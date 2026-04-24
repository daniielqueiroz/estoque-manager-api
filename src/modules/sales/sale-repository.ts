import { Prisma, SaleStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { FindSaleIdInput, ListSalesSort } from "./sale-schema";
import { DateRangeInput } from "../../shared/schemas/dateRange";
import { DailySaleRow } from "../products/product-schema";

/**
 * Cria uma venda contedo uma lista de Products atraves do Nested Writes do Prisma
 * Faz uso de uma transaction para garantir que o decremento do estoque seja feito em segurança
 * @param customerName Nome do cliente
 * @param totalAmount Valor total da venda, calculado na camada service para evitar manipulação do frontend
 * @param items Lista de Products
 * @param items[].productId ID do produto
 * @param items[].quantity Quantidade do produto a ser comprada
 * @param items[].unitPrice Preço unitário no momento da venda, busca na service para evitar manipulação do frontend
 */
export const create = async (
  customerName: string,
  totalAmount: number,
  items: { productId: string; quantity: number; unitPrice: number }[],
) => {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        customerName,
        totalAmount,
        items: {
          create: items,
        },
      },
      include: {
        items: true,
      },
    });

    // Remove a quantidade de itens do estoque após efetivar a Sale acima
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { quantity: { decrement: item.quantity } },
      });
    }

    return sale;
  });
};

export const findAll = async (
  page: number,
  pageSize: number,
  sort: ListSalesSort,
) => {
  const skip = (page - 1) * pageSize;

  const orderBy: Prisma.SaleOrderByWithRelationInput =
    sort.sortBy === "items"
      ? { items: { _count: sort.sortOrder } }
      : { [sort.sortBy]: sort.sortOrder };

  const [data, total] = await Promise.all([
    prisma.sale.findMany({
      skip,
      take: pageSize,
      orderBy,
      include: {
        items: true,
      },
    }),

    prisma.sale.count(),
  ]);

  return {
    data,
    total,
  };
};

export const exportAll = async (range: DateRangeInput) => {
  const sales = await prisma.sale.findMany({
    where: {
      createdAt: { gte: range.startDate, lte: range.endDate },
    },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
  });

  return sales.map(({ _count, ...sale }) => ({
    ...sale,
    itemCount: _count.items,
  }));
};

export const findById = async ({ id }: FindSaleIdInput) => {
  const sale = await prisma.sale.findFirst({
    where: { id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });
  return sale;
};

export const reportData = async (
  range: DateRangeInput,
  userTimezone: string,
) => {
  const condition = {
    status: { not: SaleStatus.CANCELLED },
    createdAt: {
      gte: range.startDate,
      lt: range.endDate,
    },
  };

  const timeZone = Prisma.raw(`'${userTimezone}'`);

  const [totalSales, totalProductsSold, totalRevenue, rawDailyData] =
    await Promise.all([
      //Total Sales
      prisma.sale.count({
        where: condition,
      }),

      // Total de Produtos vendidos no range informado
      prisma.saleItem.aggregate({
        where: { sale: condition },
        _sum: { quantity: true },
      }),

      //Revenue - Receita total gerada
      prisma.sale.aggregate({
        where: condition,
        _sum: { totalAmount: true },
      }),

      /* Dados das vendas feitas por dia
    Foi necessário fazer raw SQL, pois o Prisma só permite agrupar por data/hora
    mas eu precisava agrupar apenas pela data

    dailySales: Número de transações de venda em que o produto apareceu no dia
    productsSold: Quantidade de produtos vendidos no dia
    avgPrice: Preço médio, pois pode ocorrer do preço mudar ao longo do dia, então não é seguro pegar de unitPrice
    revenue: Total arrecadado na venda desse produto no dia */
      prisma.$queryRaw<DailySaleRow[]>`
        SELECT
          DATE(CONVERT_TZ(si.createdAt, '+00:00', ${timeZone})) AS date,
          COUNT(DISTINCT si.saleId)       AS dailySales,
          SUM(si.quantity)                AS productsSold,
          AVG(si.unitPrice)              AS avgPrice,
          SUM(si.unitPrice * si.quantity) AS revenue
        FROM SaleItem si
        INNER JOIN Sale s ON s.id = si.saleId
        WHERE si.createdAt >= ${range.startDate}
          AND si.createdAt <  ${range.endDate}
          AND s.status != 'CANCELLED'
        GROUP BY DATE(CONVERT_TZ(si.createdAt, '+00:00', ${timeZone}))
        ORDER BY date ASC
      `,
    ]);

  // Remover horas da Data, deixando apenas YYYY-MM-DD
  const dailyData = rawDailyData.map((row) => ({
    ...row,
    date: new Date(row.date).toISOString().split("T")[0],
  }));

  return { totalSales, totalProductsSold, totalRevenue, dailyData };
};

export const cancelById = async ({ id }: FindSaleIdInput) => {
  const sale = await prisma.sale.findFirst({
    where: { id, status: { not: SaleStatus.CANCELLED } },
    include: { items: true },
  });

  if (!sale) return null;

  // Transaction para garantir que após a venda ser cancelada, os produtos voltem ao estoque
  return prisma.$transaction(async (tx) => {
    await tx.sale.update({
      where: { id },
      data: { status: SaleStatus.CANCELLED },
    });

    for (const item of sale.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { quantity: { increment: item.quantity } },
      });
    }

    return true;
  });
};

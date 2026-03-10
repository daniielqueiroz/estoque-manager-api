import { SaleStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { FindSaleIdInput, GenerateSaleReportInput } from "./sale-schema";
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

export const findAll = async (page: number, limit: number) => {
  const skip = (page - 1) * limit;

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        items: true,
      },
    }),

    prisma.sale.count(),
  ]);

  return {
    data: sales,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
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

export const reportData = async (range: GenerateSaleReportInput) => {
  const condition = {
    status: { not: SaleStatus.CANCELLED },
    createdAt: { gte: range.startDate, lte: range.endDate },
  };

  const [totalSales, totalProductsSold, totalRevenue, dailyData] =
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
        DATE(createdAt)            AS date,
        COUNT(*)                   AS dailySales,
        SUM(quantity)              AS productsSold,
        AVG(unitPrice)             as avgPrice,
        SUM(unitPrice * quantity)  AS revenue
      FROM SaleItem
        WHERE createdAt >= ${range.startDate}
        AND createdAt <= ${range.endDate}
      GROUP BY DATE(createdAt)
    `,
    ]);

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

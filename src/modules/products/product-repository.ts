import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import {
  CreateProductInput,
  DailySaleRow,
  FindProductIdInput,
  GenerateProductReportInput,
  UpdateProductInput,
} from "./product-schema";

export const create = async (data: CreateProductInput) => {
  const user = await prisma.product.create({ data });
  return user;
};

export const findAll = async () => {
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    orderBy: { updatedAt: "desc" },
  });
  return products;
};

export const findManyByIds = async (ids: string[]) => {
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, deletedAt: null },
  });
  return products;
};

export const findById = async ({ id }: FindProductIdInput) => {
  const product = await prisma.product.findFirst({
    where: { id, deletedAt: null },
  });
  return product;
};

export const reportProduct = async (
  { id }: FindProductIdInput,
  range: GenerateProductReportInput,
) => {
  const condition = {
    productId: id,
    createdAt: { gte: range.startDate, lte: range.endDate },
  };

  const [totalSales, totalProductsSold, dailyData] = await Promise.all([
    // Total de vendas que esse produto
    prisma.saleItem.count({
      where: condition,
    }),

    // Total de Produtos vendidos no range informado
    prisma.saleItem.aggregate({
      where: condition,
      _sum: { quantity: true },
    }),

    /* Dados das vendas do produto feitas por dia
    Foi necessário fazer raw SQL, pois o Prisma só permite agrupar por data/hora
    mas eu precisava agrupar apenas pela data

    dailySales: Número de transações de venda em que o produto apareceu no dia
    productsSold: Quantidade de produtos vendidos no dia
    avgPrice: Preço médio, pois pode ocorrer do preço mudar ao longo do dia, então não é seguro pegar de unitPrice
    revenue: Total arrecadado na venda desse produto no dia */
    prisma.$queryRaw<DailySaleRow[]>`
      SELECT
        DATE(si.createdAt)            AS date,
        COUNT(*)                      AS dailySales,
        SUM(si.quantity)              AS productsSold,
        AVG(si.unitPrice)             AS avgPrice,
        SUM(si.unitPrice * si.quantity) AS revenue
      FROM SaleItem si
      INNER JOIN Sale s ON s.id = si.saleId
      WHERE si.productId = ${id}
        AND si.createdAt >= ${range.startDate}
        AND si.createdAt <= ${range.endDate}
        AND s.status != 'CANCELLED'
      GROUP BY DATE(si.createdAt)
      ORDER BY date ASC
    `,
  ]);

  return {
    totalSales,
    totalProductsSold: totalProductsSold._sum.quantity,
    dailyData,
  };
};

export const update = async (
  { id }: FindProductIdInput,
  data: UpdateProductInput,
) => {
  try {
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: data,
    });
    return updatedProduct;
  } catch (error) {
    // Validação caso o ID informado seja inexistente
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return null;
    }
    throw error;
  }
};

/**
 * Em vez de deletar o Product é feito um soft delete, ou seja, é atualizado o deletedAt para now(),
 * desse modo sendo possível recuperar dados sobre esse produto posteriormente em relatórios
 * @param id ID do produto a ser deletado
 */
export const deleteById = async ({ id }: FindProductIdInput) => {
  const product = await prisma.product.findFirst({
    where: { id, deletedAt: null },
  });

  if (!product) {
    return null;
  }

  await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return true;
};

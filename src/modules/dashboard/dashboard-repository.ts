import { SaleStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export const getSummaryMetrics = async () => {
  const now = new Date();

  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );

  const [totalSales, revenue, averageTicket, totalProducts] = await Promise.all(
    [
      // Vendas do dia
      await prisma.sale.count({
        where: {
          createdAt: { gte: startOfDay, lte: endOfDay },
          status: SaleStatus.CONFIRMED,
        },
      }),

      //   Faturamento do dia
      await prisma.sale.aggregate({
        where: {
          createdAt: { gte: startOfDay, lte: endOfDay },
          status: SaleStatus.CONFIRMED,
        },
        _sum: { totalAmount: true },
      }),

      //   Ticket médio do dia
      await prisma.sale.aggregate({
        where: {
          createdAt: { gte: startOfDay, lte: endOfDay },
          status: SaleStatus.CONFIRMED,
        },
        _avg: { totalAmount: true },
      }),

      //   Produtos cadastrados
      await prisma.product.count({
        where: { deletedAt: null },
      }),
    ],
  );

  return {
    totalSales,
    revenue: revenue._sum.totalAmount,
    averageTicket: averageTicket._avg.totalAmount,
    totalProducts,
  };
};

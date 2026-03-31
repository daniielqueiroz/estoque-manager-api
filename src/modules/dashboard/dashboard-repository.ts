import { SaleStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { GetDashboardDataSchema } from "./dashboard-schema";

export const getSummaryMetrics = async (range: GetDashboardDataSchema) => {
  const condition = {
    createdAt: { gte: range.startDate, lt: range.endDate },
    status: SaleStatus.CONFIRMED,
  };

  const [totalSales, revenue, averageTicket, totalProducts] = await Promise.all(
    [
      // Vendas do dia
      await prisma.sale.count({
        where: condition,
      }),

      //   Faturamento do dia
      await prisma.sale.aggregate({
        where: condition,
        _sum: { totalAmount: true },
      }),

      //   Ticket médio do dia
      await prisma.sale.aggregate({
        where: condition,
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

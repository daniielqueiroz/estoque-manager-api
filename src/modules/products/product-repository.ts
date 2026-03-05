import { prisma } from "../../lib/prisma";

export const findAll = async () => {
  const products = await prisma.product.findMany();
  return products;
};

import { prisma } from "../../lib/prisma";
import { CreateProductInput, FindProductIdInput } from "./product-schema";

export const findAll = async () => {
  const products = await prisma.product.findMany();
  return products;
};

export const findOne = async ({ id }: FindProductIdInput) => {
  const product = await prisma.product.findUnique({
    where: { id },
  });
  return product;
};

export const create = async (data: CreateProductInput) => {
  const user = await prisma.product.create({ data });
  return user;
};

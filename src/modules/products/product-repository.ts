import { prisma } from "../../lib/prisma";
import { CreateProductInput, FindProductIdInput } from "./product-schema";

export const findAll = async () => {
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
  });
  return products;
};

export const findById = async ({ id }: FindProductIdInput) => {
  const product = await prisma.product.findFirst({
    where: { id, deletedAt: null },
  });
  return product;
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

export const create = async (data: CreateProductInput) => {
  const user = await prisma.product.create({ data });
  return user;
};

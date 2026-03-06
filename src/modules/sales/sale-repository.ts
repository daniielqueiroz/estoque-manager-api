import { prisma } from "../../lib/prisma";

/**
 * Cria uma venda contedo uma lista de Products atraves do Nested Writes do Prisma
 * Faz uso de uma transcation para garantir que o decremento do estoque seja feito em segurança
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

export const findAll = async () => {
  const sales = await prisma.sale.findMany({
    include: {
      items: true,
    },
  });
  return sales;
};

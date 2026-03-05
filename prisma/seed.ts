// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Limpa itens de venda primeiro por causa das FKs
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.product.deleteMany();

  const products = await prisma.product.createMany({
    data: [
      {
        name: "Shampoo Anticaspa",
        description: "Shampoo 400ml",
        price: 24.9,
        quantity: 50,
        category: "Higiene",
      },
      {
        name: "Arroz Tipo 1",
        description: "Pacote 5kg",
        price: 29.99,
        quantity: 80,
        category: "Alimentos",
      },
      {
        name: "Feijao Carioca",
        description: "Pacote 1kg",
        price: 8.5,
        quantity: 120,
        category: "Alimentos",
      },
      {
        name: "Cafe Torrado",
        description: "Pacote 500g",
        price: 18.75,
        quantity: 60,
        category: "Bebidas",
      },
      {
        name: "Detergente Neutro",
        description: "Frasco 500ml",
        price: 3.99,
        quantity: 200,
        category: "Limpeza",
      },
    ],
  });

  // Busca produtos criados para montar uma venda exemplo
  const [shampoo, arroz, feijao] = await Promise.all([
    prisma.product.findFirstOrThrow({ where: { name: "Shampoo Anticaspa" } }),
    prisma.product.findFirstOrThrow({ where: { name: "Arroz Tipo 1" } }),
    prisma.product.findFirstOrThrow({ where: { name: "Feijao Carioca" } }),
  ]);

  const itemsInput = [
    { productId: shampoo.id, quantity: 1, unitPrice: shampoo.price },
    { productId: arroz.id, quantity: 2, unitPrice: arroz.price },
    { productId: feijao.id, quantity: 1, unitPrice: feijao.price },
  ];

  const totalAmount = itemsInput.reduce(
    (acc, item) => acc + item.quantity * item.unitPrice,
    0,
  );

  await prisma.sale.create({
    data: {
      customerName: "Cliente Seed",
      totalAmount,
      items: {
        create: itemsInput,
      },
    },
  });

  console.log("Seed executado com sucesso.");
  console.log(`Produtos inseridos: ${products.count}`);
}

main()
  .catch((error) => {
    console.error("Erro ao executar seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

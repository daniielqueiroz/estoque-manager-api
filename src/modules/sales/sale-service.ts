import { CreateSaleInput } from "./sale-schema";
import * as ProductRepository from "../products/product-repository";
import * as SaleRepository from "./sale-repository";

export const createSale = async (data: CreateSaleInput) => {
  // Recupera apenas os IDs dos Products
  const productsIds = data.items.map((item) => item.productId);

  // Busca os objetos de Products no banco de dados
  const products = await ProductRepository.findManyByIds(productsIds);

  // Valida se conseguiu encontrar todos
  if (products.length !== productsIds.length) {
    throw new Error("Um ou mais produtos não encontrados");
  }

  // Itera sobre a lista de produtos enviada pelo frontend
  // Ao final monta a lista de produtos contendo: productId, quantity e unitPrice
  // unitPrice tem que ser obtido pelo Product obtido do BD para evitar fraude pelo frontend
  const items = data.items.map((item) => {
    const product = products.find((p) => p.id === item.productId)!;

    if (product.quantity < item.quantity) {
      throw new Error(`Estoque insuficiente para o produto ${product.name}`);
    }

    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: product.price,
    };
  });

  // Calcula o valor total da Sale, para isso itera entre cada item da lista de
  // compra e multiplica o valor unitario pela quantidade comprada
  const totalAmount = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );

  return SaleRepository.create(data.customerName, totalAmount, items);
};

export const listSales = async () => {
  const sales = await SaleRepository.findAll();
  return sales;
};

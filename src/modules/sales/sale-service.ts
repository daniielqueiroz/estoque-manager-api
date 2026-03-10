import {
  CreateSaleInput,
  FindSaleIdInput,
  GenerateSaleReportInput,
} from "./sale-schema";
import * as ProductRepository from "../products/product-repository";
import * as SaleRepository from "./sale-repository";
import { AppError } from "../../shared/errors/AppError";

export const createSale = async (data: CreateSaleInput) => {
  // Recupera apenas os IDs dos Products
  const productsIds = data.items.map((item) => item.productId);

  // Busca os objetos de Products no banco de dados
  const products = await ProductRepository.findManyByIds(productsIds);

  // Valida se conseguiu encontrar todos
  if (products.length !== productsIds.length) {
    throw new AppError("Um ou mais produtos não encontrados", 404);
  }

  // Itera sobre a lista de produtos enviada pelo frontend
  // Ao final monta a lista de produtos contendo: productId, quantity e unitPrice
  // unitPrice tem que ser obtido pelo Product obtido do BD para evitar fraude pelo frontend
  const items = data.items.map((item) => {
    const product = products.find((p) => p.id === item.productId)!;

    if (product.quantity < item.quantity) {
      throw new AppError(
        `Estoque insuficiente para o produto ${product.name}`,
        400,
      );
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

export const listSales = async (page: number, limit: number) => {
  const sales = await SaleRepository.findAll(page, limit);
  return sales;
};

export const searchSaleById = async (id: FindSaleIdInput) => {
  const sale = await SaleRepository.findById(id);

  if (!sale) {
    throw new AppError("Nenhuma venda encontrada", 404);
  }

  return sale;
};

export const generateSaleReport = async (range: GenerateSaleReportInput) => {
  const { totalSales, totalProductsSold, totalRevenue, dailyData } =
    await SaleRepository.reportData(range);

  // Necessário fazer Cast para Number, pois o MySQL devolve BigInt na raw SQL ao usar COUNT e SUM
  // e o Express não consegue serializar o bigint
  const dailySales = dailyData.map((day) => ({
    date: day.date,
    dailySales: Number(day.dailySales),
    productsSold: Number(day.productsSold),
    avgPrice: Number(day.avgPrice),
    revenue: Number(day.revenue),
  }));

  return {
    totalSales,
    totalProductsSold: totalProductsSold._sum.quantity ?? 0,
    totalRevenue: totalRevenue._sum.totalAmount ?? 0,
    dailySales,
  };
};

export const cancelSaleById = async (id: FindSaleIdInput) => {
  const canceled = await SaleRepository.cancelById(id);

  if (!canceled) {
    throw new AppError("Venda não encontrada ou já cancelada", 404);
  }

  return canceled;
};

import * as ProductRepository from "./product-repository";
import {
  CreateProductInput,
  FindProductIdInput,
  GenerateProductReportInput,
  UpdateProductInput,
} from "./product-schema";

export const createProduct = async (data: CreateProductInput) => {
  const product = await ProductRepository.create(data);
  return product;
};

export const listProducts = async () => {
  const data = await ProductRepository.findAll();
  return data;
};

export const getProductById = async (productId: FindProductIdInput) => {
  const product = await ProductRepository.findById(productId);
  return product;
};

export const generateProductSaleReport = async (
  id: FindProductIdInput,
  range: GenerateProductReportInput,
) => {
  const product = await ProductRepository.findById(id);

  if (!product) {
    throw new Error("Produto não encontrado");
  }

  const report = await ProductRepository.reportProduct(id, range);

  const totalRevenue = report.dailySales.reduce(
    (acc, day) => acc + Number(day.revenue),
    0,
  );

  // Necessário fazer Cast para Number, pois o MySQL devolve BigInt na raw SQL ao usar COUNT e SUM
  // e o Express não consegue serializar o bigint
  const dailySales = report.dailySales.map((day) => ({
    date: day.date,
    salesOccurrences: Number(day.salesOccurrences),
    totalQuantity: Number(day.totalQuantity),
    avgPrice: Number(day.avgPrice),
    revenue: Number(day.revenue),
  }));

  return {
    product,
    report: {
      salesOccurrences: report.salesOccurrences,
      totalProductsSold: report.totalProductsSold,
      totalRevenue,
      dailySales,
    },
  };
};

export const updateProduct = async (
  id: FindProductIdInput,
  data: UpdateProductInput,
) => {
  const updatedProduct = await ProductRepository.update(id, data);
  return updatedProduct;
};

export const deleteProductById = async (productId: FindProductIdInput) => {
  const deleted = await ProductRepository.deleteById(productId);
  return deleted;
};

import { AppError } from "../../shared/errors/AppError";
import { paginate } from "../../shared/utils/paginate";
import * as ProductRepository from "./product-repository";
import {
  CreateProductInput,
  FindProductIdInput,
  GenerateProductReportInput,
  ListProductsSort,
  UpdateProductInput,
} from "./product-schema";

export const createProduct = async (data: CreateProductInput) => {
  const product = await ProductRepository.create(data);
  return product;
};

export const listProducts = async (
  page: number,
  pageSize: number,
  sort: ListProductsSort,
  search?: string,
) => {
  const { data, total } = await ProductRepository.findAll(page, pageSize, sort, search);

  return paginate({ data, total, page, pageSize });
};

export const getProductById = async (productId: FindProductIdInput) => {
  const product = await ProductRepository.findById(productId);

  if (!product) {
    throw new AppError("Produto não encontrado", 404);
  }

  return product;
};

export const generateProductSaleReport = async (
  id: FindProductIdInput,
  range: GenerateProductReportInput,
  userTimezone: string,
) => {
  const product = await ProductRepository.findById(id);

  if (!product) {
    throw new AppError("Produto não encontrado", 404);
  }
  const { totalSales, totalProductsSold, dailyData } =
    await ProductRepository.reportProduct(id, range, userTimezone);

  const totalRevenue = dailyData.reduce(
    (acc, day) => acc + Number(day.revenue),
    0,
  );

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
    product,
    report: {
      totalSales,
      totalProductsSold,
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

  if (!updatedProduct) {
    throw new AppError("Produto não encontrado", 404);
  }

  return updatedProduct;
};

export const deleteProductById = async (productId: FindProductIdInput) => {
  const deleted = await ProductRepository.deleteById(productId);

  if (!deleted) {
    throw new AppError("Produto não encontrado", 404);
  }

  return deleted;
};

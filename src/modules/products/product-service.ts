import * as ProductRepository from "./product-repository";
import { CreateProductInput, FindProductIdInput } from "./product-schema";

export const listProducts = async () => {
  const data = await ProductRepository.findAll();
  return data;
};

export const getProduct = async (productId: FindProductIdInput) => {
  const product = await ProductRepository.findOne(productId);
  return product;
};

export const createProduct = async (data: CreateProductInput) => {
  const product = await ProductRepository.create(data);
  return product;
};

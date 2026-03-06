import * as ProductRepository from "./product-repository";
import { CreateProductInput, FindProductIdInput } from "./product-schema";

export const listProducts = async () => {
  const data = await ProductRepository.findAll();
  return data;
};

export const getProductById = async (productId: FindProductIdInput) => {
  const product = await ProductRepository.findById(productId);
  return product;
};

export const deleteProductById = async (productId: FindProductIdInput) => {
  const deleted = await ProductRepository.deleteById(productId);
  return deleted;
};

export const createProduct = async (data: CreateProductInput) => {
  const product = await ProductRepository.create(data);
  return product;
};

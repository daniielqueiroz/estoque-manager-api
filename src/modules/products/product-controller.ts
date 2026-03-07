import { Request, Response } from "express";
import * as ProductService from "./product-service";
import {
  CreateProductInput,
  findProductIdSchema,
  generateProductReportSchema,
  UpdateProductInput,
} from "./product-schema";

export const postProduct = async (req: Request, res: Response) => {
  const body = req.body as CreateProductInput;
  const data = await ProductService.createProduct(body);
  res.status(201).json(data);
};

export const getProducts = async (req: Request, res: Response) => {
  const data = await ProductService.listProducts();
  res.status(200).json(data);
};

export const getProduct = async (req: Request, res: Response) => {
  const id = req.params;

  //Validar ID com o schema do Zod
  const validId = findProductIdSchema.safeParse(id);

  if (!validId.success) {
    return res.status(400).json({ message: "ID inválido" });
  }

  const data = await ProductService.getProductById(validId.data);

  if (!data) {
    return res.status(404).json({ message: "Produto não encontrado" });
  }

  return res.status(200).json(data);
};

export const getProductSaleReport = async (req: Request, res: Response) => {
  const id = req.params;
  const validId = findProductIdSchema.safeParse(id);
  if (!validId.success) {
    return res.status(400).json({ message: "ID inválido" });
  }

  const range = req.query;
  const validRange = generateProductReportSchema.safeParse(range);

  if (!validRange.success) {
    return res.status(400).json({ message: "O range informado é inválido" });
  }

  try {
    const productSaleReport = await ProductService.generateProductSaleReport(
      validId.data,
      validRange.data,
    );

    return res.status(200).json(productSaleReport);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ message: "Produto não encontrado" });
    }
    return res
      .status(500)
      .json({ message: "Erro ao gerar relatório do produto" });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  const id = req.params;
  const body = req.body as UpdateProductInput;

  const validId = findProductIdSchema.safeParse(id);

  if (!validId.success) {
    return res.status(400).json({ message: "ID inválido" });
  }

  const updatedProduct = await ProductService.updateProduct(validId.data, body);

  if (!updatedProduct) {
    return res.status(404).json({ message: "Produto não encontrado" });
  }

  return res.status(200).json(updatedProduct);
};

export const deleteProduct = async (req: Request, res: Response) => {
  const id = req.params;

  const validId = findProductIdSchema.safeParse(id);

  if (!validId.success) {
    return res.status(400).json({ message: "ID inválido" });
  }

  const deleted = await ProductService.deleteProductById(validId.data);

  if (!deleted) {
    return res.status(404).json({ message: "Produto não encontrado" });
  }

  return res.status(204).send();
};

import { Request, Response } from "express";
import * as ProductService from "./product-service";
import { CreateProductInput, findProductIdSchema } from "./product-schema";

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

export const postProduct = async (req: Request, res: Response) => {
  const body = req.body as CreateProductInput;
  const data = await ProductService.createProduct(body);
  res.status(201).json(data);
};

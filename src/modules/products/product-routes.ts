import { Router } from "express";
import * as ProductController from "./product-controller";
import { validadeRequest } from "../../shared/middlewares/validateRequest";
import { createProductSchema } from "./product-schema";

export const productRouter = Router();

productRouter.get("/", ProductController.getProducts);
productRouter.get("/:id", ProductController.getProduct);
productRouter.delete("/:id", ProductController.deleteProduct);
productRouter.post(
  "/",
  validadeRequest(createProductSchema),
  ProductController.postProduct,
);

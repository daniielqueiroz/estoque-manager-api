import { Router } from "express";
import * as ProductController from "./product-controller";
import { validadeRequest } from "../../shared/middlewares/validateRequest";
import { createProductSchema, updateProductSchema } from "./product-schema";

export const productRouter = Router();

productRouter.post(
  "/",
  validadeRequest(createProductSchema),
  ProductController.postProduct,
);
productRouter.get("/", ProductController.getProducts);
productRouter.get("/:id", ProductController.getProduct);
productRouter.get("/:id/report", ProductController.getProductSaleReport);
productRouter.put(
  "/:id",
  validadeRequest(updateProductSchema),
  ProductController.updateProduct,
);
productRouter.delete("/:id", ProductController.deleteProduct);

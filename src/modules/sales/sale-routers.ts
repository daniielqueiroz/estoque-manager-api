import { Router } from "express";
import { validadeRequest } from "../../shared/middlewares/validateRequest";
import { createSaleSchema } from "./sale-schema";
import * as SaleController from "./sale-controller";

export const saleRouter = Router();

saleRouter.post(
  "/",
  validadeRequest(createSaleSchema),
  SaleController.postSale,
);
saleRouter.get("/", SaleController.getSales);

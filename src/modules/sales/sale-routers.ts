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
saleRouter.get("/report", SaleController.getSaleReport);
saleRouter.get("/:id", SaleController.getSale);
saleRouter.patch("/:id/cancel", SaleController.cancelSale);

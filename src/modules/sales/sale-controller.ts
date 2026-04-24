import { Request, Response } from "express";
import {
  CreateSaleInput,
  findSaleIdSchema,
  listSalesSortSchema,
} from "./sale-schema";
import { dateRangeSchema } from "../../shared/schemas/dateRange";
import * as SaleService from "./sale-service";
import { paginationSchema } from "../../shared/schemas/pagination";

export const postSale = async (req: Request, res: Response) => {
  const body = req.body as CreateSaleInput;

  const sale = await SaleService.createSale(body);

  return res.status(201).json(sale);
};

export const getSales = async (req: Request, res: Response) => {
  const { page, pageSize } = paginationSchema.parse(req.query);
  const sort = listSalesSortSchema.parse(req.query);

  const sales = await SaleService.listSales(page, pageSize, sort);
  return res.status(200).json(sales);
};

export const exportSales = async (req: Request, res: Response) => {
  const range = req.query;
  const validRange = dateRangeSchema.parse(range);

  const data = await SaleService.exportSales(validRange);
  return res.status(200).json(data);
};

export const getSale = async (req: Request, res: Response) => {
  const id = req.params;
  const validId = findSaleIdSchema.parse(id);

  const sale = await SaleService.searchSaleById(validId);

  res.status(200).json(sale);
};

export const getSaleReport = async (req: Request, res: Response) => {
  const range = req.query;
  const validRange = dateRangeSchema.parse(range);

  const saleReport = await SaleService.generateSaleReport(
    validRange,
    req.userTimezone,
  );

  return res.status(200).json(saleReport);
};

export const cancelSale = async (req: Request, res: Response) => {
  const id = req.params;
  const validId = findSaleIdSchema.parse(id);

  await SaleService.cancelSaleById(validId);

  return res.status(204).send();
};

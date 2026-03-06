import { Request, Response } from "express";
import { CreateSaleInput, findSaleIdSchema } from "./sale-schema";
import * as SaleService from "./sale-service";

export const postSale = async (req: Request, res: Response) => {
  const body = req.body as CreateSaleInput;

  try {
    const sale = await SaleService.createSale(body);

    return res.status(200).json(sale);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Erro interno" });
  }
};

export const getSales = async (req: Request, res: Response) => {
  const sales = await SaleService.listSales();

  if (!sales) {
    return res.status(400).json({ message: "Nenhuma venda encontrada" });
  }

  return res.status(200).json(sales);
};

export const getSale = async (req: Request, res: Response) => {
  const id = req.params;

  const validId = findSaleIdSchema.safeParse(id);

  if (!validId.success) {
    return res.status(400).json({ message: "ID Inválido" });
  }

  const sale = await SaleService.searchSaleById(validId.data);

  if (!sale) {
    return res.status(404).json({ message: "Nenhuma venda encontrada" });
  }

  res.status(200).json(sale);
};

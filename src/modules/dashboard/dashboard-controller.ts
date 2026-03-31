import { Request, Response } from "express";
import * as DashboardService from "./dashboard-service";
import { getDashboardDataSchema } from "./dashboard-schema";

export const getDashboardData = async (req: Request, res: Response) => {
  const range = req.query;
  const validRange = getDashboardDataSchema.parse(range);

  const data = await DashboardService.getDashboardData(validRange);
  res.status(200).json(data);
};

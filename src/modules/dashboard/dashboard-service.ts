import * as DashboardRepository from "./dashboard-repository";
import { GetDashboardDataSchema } from "./dashboard-schema";

export const getDashboardData = async (range: GetDashboardDataSchema) => {
  const data = await DashboardRepository.getSummaryMetrics(range);
  return data;
};

import z from "zod";

export const getDashboardDataSchema = z
  .object({
    startDate: z.iso.datetime().transform((val) => new Date(val)),
    endDate: z.iso.datetime().transform((val) => new Date(val)),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "endDate deve ser maior ou igual a startDate",
    path: ["endDate"],
  });
export type GetDashboardDataSchema = z.infer<typeof getDashboardDataSchema>;

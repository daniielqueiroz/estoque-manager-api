import z from "zod";

export const createSaleSchema = z.object({
  customerName: z.string().trim().min(2),
  items: z
    .array(
      z.object({
        productId: z.uuid("ID do produto inválido"),
        quantity: z
          .number()
          .int()
          .positive("Quantidade deve ser maior que zero"),
      }),
    )
    .min(1, "Deve haver pelo menos um item na venda"),
});
export type CreateSaleInput = z.infer<typeof createSaleSchema>;

export const findSaleIdSchema = z.object({
  id: z.uuid("ID Inválido"),
});
export type FindSaleIdInput = z.infer<typeof findSaleIdSchema>;

export const generateSaleReportSchema = z
  .object({
    startDate: z.iso.datetime().transform((val) => new Date(val)),
    endDate: z.iso.datetime().transform((val) => new Date(val)),
    userTz: z
      .string()
      .refine((val) => Intl.supportedValuesOf("timeZone").includes(val), {
        message: "Timezone inválida",
      }),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "endDate deve ser maior ou igual a startDate",
    path: ["endDate"],
  });
export type GenerateSaleReportInput = z.infer<typeof generateSaleReportSchema>;

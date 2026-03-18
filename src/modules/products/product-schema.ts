import * as z from "zod";

export const createProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(120),
  description: z.string().trim().max(250),
  price: z.number().positive("Preço deve ser maior que zero"),
  quantity: z
    .number()
    .int("Quantidade deve ser um valor inteiro")
    .min(0, "Quantidade não pode ser negativa"),
  category: z
    .string()
    .trim()
    .min(3, "Categoria deve ter pelo menos 3 caracteres")
    .max(50),
});
export type CreateProductInput = z.infer<typeof createProductSchema>;

// .partial() torna todos os campos opcionais; .strict() rejeita campos desconhecidos
export const updateProductSchema = createProductSchema.partial().strict();
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const findProductIdSchema = z.object({
  id: z.uuid("ID Inválido"),
});
export type FindProductIdInput = z.infer<typeof findProductIdSchema>;

export const generateProductReportSchema = z
  .object({
    startDate: z.iso.date().transform((val) => new Date(val)),
    endDate: z.iso.date().transform((val) => {
      const d = new Date(val);
      d.setUTCHours(23, 59, 59, 999);
      return d;
    }),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "endDate deve ser maior ou igual a startDate",
    path: ["endDate"],
  });
export type GenerateProductReportInput = z.infer<
  typeof generateProductReportSchema
>;

export type DailySaleRow = {
  date: string;
  /** Número de transações de venda em que o produto apareceu no dia */
  dailySales: bigint;
  /** Total de unidades vendidas no dia */
  productsSold: bigint;
  avgPrice: number;
  revenue: number;
};

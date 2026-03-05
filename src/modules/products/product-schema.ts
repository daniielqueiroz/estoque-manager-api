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
  category: z.string().trim().max(50),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const findProductIdSchema = z.object({
  id: z.uuid("ID Inválido"),
});

export type FindProductIdInput = z.infer<typeof findProductIdSchema>;

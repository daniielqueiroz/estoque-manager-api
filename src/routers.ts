import { Router } from "express";

export const router = Router();

router.use("/products", () => {
  console.log("Hello world");
});

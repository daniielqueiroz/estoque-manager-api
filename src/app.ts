import express from "express";
import "dotenv/config";
import { router } from "./routers";

function createApp() {
  const app = express();

  app.use(express.json());
  app.use("/api", router);

  return app;
}

export default createApp;

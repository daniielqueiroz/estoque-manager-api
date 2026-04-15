import express from "express";
import cors from "cors";
import "dotenv/config";
import { router } from "./routers";
import { errorHandler } from "./shared/middlewares/errorHandler";
import { timezoneMiddleware } from "./shared/middlewares/timezone";

function createApp() {
  const app = express();

  app.use(express.json());
  app.use(cors());
  app.use(timezoneMiddleware);
  app.use("/api", router);
  app.use(errorHandler);

  return app;
}

export default createApp;

import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/requestLogger";
import routes from "./routes";

const app = express();

const allowedOrigins = [
  process.env.CUSTOMER_SITE_URL,
  process.env.ADMIN_PANEL_URL,
].filter((origin): origin is string => Boolean(origin));

app.use(requestLogger);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

app.use("/api", routes);

app.use(errorHandler);

export default app;
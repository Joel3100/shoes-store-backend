import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/requestLogger";
import routes from "./routes";

const app = express();

const allowedOrigins = Array.from(
  new Set([
    "http://localhost:5173",
    "http://localhost:5174",
    process.env.CUSTOMER_SITE_URL,
    process.env.ADMIN_PANEL_URL,
  ].filter((origin): origin is string => typeof origin === "string" && origin.length > 0))
);

console.log("CORS allowed origins:", allowedOrigins);

app.use(requestLogger);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api", routes);

app.use(errorHandler);

export default app;
import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found-handler.js";
import { userRouter } from "./routes/user.routes.js";

const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    origin: env.allowedOrigins.length > 0 ? env.allowedOrigins : false,
  }),
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Demasiadas solicitudes. Inténtalo de nuevo más tarde." },
  }),
);
app.use(express.json({ limit: "16kb" }));

app.use("/users", userRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

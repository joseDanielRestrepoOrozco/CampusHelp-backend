import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found-handler.js';
import { usuariosRouter } from './routes/usuarios.routes.js';
import { areasRouter } from './routes/areas.routes.js';
import { categoriasRouter } from './routes/categorias.routes.js';
import { casosRouter } from './routes/casos.routes.js';

const app = express();

app.disable('x-powered-by');
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
    message: {
      error: 'VALIDACION',
      mensaje: 'Demasiadas solicitudes. Inténtalo de nuevo más tarde.',
      detalles: [],
    },
  }),
);
app.use(express.json({ limit: '16kb' }));

// Todas las rutas del contrato (docs/03-api.md) viven bajo /api.
app.use('/api', usuariosRouter);
app.use('/api', areasRouter);
app.use('/api', categoriasRouter);
app.use('/api', casosRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found-handler.js';
import { userRouter } from './routes/user.routes.js';
import { campusRouter } from './routes/campus.routes.js';

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin: env.allowedOrigins.length > 0 ? env.allowedOrigins : true,
    credentials: true,
  }),
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'VALIDACION',
      mensaje: 'Demasiadas solicitudes. Inténtalo de nuevo más tarde.',
      detalles: [],
    },
  }),
);
app.use(express.json({ limit: '32kb' }));

// Rutas de CampusHelp (bajo /api y también accesible en la raíz)
app.use('/api', campusRouter);
app.use('/', campusRouter);

// Ruta legada de ejemplo de usuarios
app.use('/users', userRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;

import 'dotenv/config';

function parsePort(value: string | undefined): number {
  if (value === undefined) return 3000;

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('PORT debe ser un entero entre 1 y 65535');
  }

  return port;
}

function parseDatabaseUrl(value: string | undefined): string {
  if (!value) throw new Error('Falta la variable de entorno DATABASE_URL');

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('DATABASE_URL no es una URL válida');
  }

  if (url.protocol !== 'postgres:' && url.protocol !== 'postgresql:') {
    throw new Error('DATABASE_URL debe usar el protocolo PostgreSQL');
  }

  return value;
}

function parseAllowedOrigins(value: string | undefined): string[] {
  if (!value?.trim()) return [];

  return value.split(',').map(rawOrigin => {
    const origin = rawOrigin.trim();
    let url: URL;

    try {
      url = new URL(origin);
    } catch {
      throw new Error(`Origen inválido en ALLOWED_ORIGINS: ${origin}`);
    }

    if ((url.protocol !== 'http:' && url.protocol !== 'https:') || url.origin !== origin) {
      throw new Error(`ALLOWED_ORIGINS solo admite orígenes HTTP(S): ${origin}`);
    }

    return origin;
  });
}

export const env = {
  port: parsePort(process.env.PORT),
  databaseUrl: parseDatabaseUrl(process.env.DATABASE_URL),
  allowedOrigins: parseAllowedOrigins(process.env.ALLOWED_ORIGINS),
};

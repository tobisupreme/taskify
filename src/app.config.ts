import * as dotenv from 'dotenv';
dotenv.config();

const env = (key: string, defaultVal?: string): string | undefined => {
  return process.env[key] || defaultVal;
};

env.number = (key: string, defaultVal?: number | string): number => {
  const val = env(key, defaultVal?.toString());
  return Number(val);
};

env.require = (key: string): string => {
  const value = env(key);
  if (!value) {
    throw new Error(`Environment variable '${key}' is missing!`);
  }

  return value;
};

const config = {
  environment: env('NODE_ENV'),

  app: {
    name: 'taskify',
    port: env.number('APP_PORT', 3001),
    hostname: env('APP_HOSTNAME', 'localhost'),
    host: env('APP_HOST', `http://localhost:${env.number('APP_PORT', 3001)}`),
    api: {
      version: env('APP_API_VERSION', '1'),
    },
    widgetBaseURL: env('WIDGET_BASE_URL'),
  },

  db: {
    url: env.require('DATABASE_URL'),
  },

  redis: {
    host: env('REDIS_HOST'),
    port: env.number('REDIS_PORT', '6379'),
    password: env('REDIS_PASSWORD'),
    cacheTtl: env.number('CACHE_TTL'),
    url: env('REDIS_URL'),
  },

  jwt: {
    secret: env('JWT_SECRET', '1b9cc674f4a907'),
    signOptions: {
      expiresIn: env.number('JWT_EXPIRES', 30 * 60),
    },
    refreshTokenExpiresIn: env.number('JWT_REFRESH_TOKEN_EXPIRES', 6 * 60 * 60),
  },

  swagger: {
    user: { demo: env('SWAGGER_USER_PASSWORD', '12345@') },
  },
};

export default () => config;

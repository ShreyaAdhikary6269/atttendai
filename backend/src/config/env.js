import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT) || 5000,
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  db: {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECT_STRING,
    poolMax: Number(process.env.DB_POOL_MAX) || 5,
  },
  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://localhost:5001',
};

export const missingDbSettings = ['DB_USER', 'DB_PASSWORD', 'DB_CONNECT_STRING'].filter(
  (k) => !process.env[k]
);

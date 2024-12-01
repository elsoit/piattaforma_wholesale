export const dbConfig = {
  test: {
    connectionString: process.env.TEST_DATABASE_URL,
    ssl: true
  },
  production: {
    connectionString: process.env.PROD_DATABASE_URL,
    ssl: true
  }
} 
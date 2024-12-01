declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'test' | 'production'
      TEST_DATABASE_URL: string
      PROD_DATABASE_URL: string
      TEST_R2_ACCOUNT_ID: string
      TEST_R2_ACCESS_KEY_ID: string
      TEST_R2_SECRET_ACCESS_KEY: string
      TEST_R2_PUBLIC_URL: string
      PROD_R2_ACCOUNT_ID: string
      PROD_R2_ACCESS_KEY_ID: string
      PROD_R2_SECRET_ACCESS_KEY: string
      PROD_R2_PUBLIC_URL: string
      JWT_SECRET: string
    }
  }
}

export {} 
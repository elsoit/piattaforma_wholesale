interface Environment {
  database: {
    url: string
    ssl: boolean
  }
  r2: {
    accountId: string
    accessKeyId: string
    secretAccessKey: string
    publicUrl: string
    bucket: string
  }
  jwt: {
    secret: string
    expiresIn: string
  }
}

const environments: Record<string, Environment> = {
  test: {
    database: {
      url: process.env.TEST_DATABASE_URL!,
      ssl: false
    },
    r2: {
      accountId: process.env.TEST_R2_ACCOUNT_ID!,
      accessKeyId: process.env.TEST_R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.TEST_R2_SECRET_ACCESS_KEY!,
      publicUrl: process.env.TEST_R2_PUBLIC_URL!,
      bucket: 'piattaforma-whls-test'
    },
    jwt: {
      secret: process.env.JWT_SECRET!,
      expiresIn: '24h'
    }
  },
  production: {
    database: {
      url: process.env.PROD_DATABASE_URL!,
      ssl: true
    },
    r2: {
      accountId: process.env.PROD_R2_ACCOUNT_ID!,
      accessKeyId: process.env.PROD_R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.PROD_R2_SECRET_ACCESS_KEY!,
      publicUrl: process.env.PROD_R2_PUBLIC_URL!,
      bucket: 'piattaforma-whls-prod'
    },
    jwt: {
      secret: process.env.JWT_SECRET!,
      expiresIn: '24h'
    }
  }
}

export const env = environments[process.env.NODE_ENV || 'development'] 
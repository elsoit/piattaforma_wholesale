interface EnvConfig {
  database: {
    url: string;
  };
  r2: {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    publicUrl: string;
    bucket: string;
  };
}

const configs: { [key: string]: EnvConfig } = {
  test: {
    database: {
      url: process.env.TEST_DATABASE_URL || '',
    },
    r2: {
      accountId: process.env.TEST_R2_ACCOUNT_ID || '',
      accessKeyId: process.env.TEST_R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.TEST_R2_SECRET_ACCESS_KEY || '',
      publicUrl: process.env.TEST_R2_PUBLIC_URL || '',
      bucket: 'piattaforma-whls-test'
    }
  },
  production: {
    database: {
      url: process.env.PROD_DATABASE_URL || '',
    },
    r2: {
      accountId: process.env.PROD_R2_ACCOUNT_ID || '',
      accessKeyId: process.env.PROD_R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.PROD_R2_SECRET_ACCESS_KEY || '',
      publicUrl: process.env.PROD_R2_PUBLIC_URL || '',
      bucket: 'piattaforma-whls-prod'
    }
  }
}

export const config = configs[process.env.NODE_ENV || 'development'] 
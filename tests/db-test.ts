import { testConnection } from '../lib/db';

testConnection()
    .then(() => process.exit(0))
    .catch(() => process.exit(1)); 
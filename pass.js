#!/usr/bin/env node

const bcrypt = require('bcrypt');

const secret = process.argv[2] || process.env.NEXTAUTH_SECRET;

if (!secret) {
  console.error('Errore: nessun segreto fornito. Imposta NEXTAUTH_SECRET o passa il valore come argomento.');
  process.exit(1);
}

(async () => {
  try {
    const hash = await bcrypt.hash(secret, 10);
    console.log(hash);
  } catch (err) {
    console.error('Errore durante l\'hashing:', err);
    process.exit(1);
  }
})();

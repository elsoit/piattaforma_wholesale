#!/usr/bin/env node

// Carica le variabili d'ambien

const bcrypt = require('bcrypt');
const secret = "ciaobellomio";
(async () => {
  try {
    const secret = "ciaobellomio";
    if (!secret) {
      console.error('Errore: la variabile NEXTAUTH_SECRET non è impostata in .env');
      process.exit(1);
    }

    // Genera l'hash con bcrypt (saltRounds = 10)
    const hash = await bcrypt.hash(secret, 10);
    console.log(hash);
  } catch (err) {
    console.error('Errore durante lhashing:', err);
    process.exit(1);
  }
})();
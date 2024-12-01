export interface Client {
  id: string
  stato: 'attivo' | 'eliminata'
  user: {
    attivo: boolean
    // aggiungi altri campi dell'utente necessari
  }
  // aggiungi altri campi del cliente necessari
} 
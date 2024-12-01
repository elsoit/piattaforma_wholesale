export const BUSINESS_TYPES = [
  { value: 'wholeseller', label: 'Grossista' },
  { value: 'distributer', label: 'Distributore' },
  { value: 'outlet', label: 'Outlet' },
  { value: 'online_boutique', label: 'Boutique Online' },
  { value: 'physical_boutique', label: 'Boutique Fisica' },
  { value: 'hybrid_stores', label: 'Negozio Ibrido' }
] as const

export const COUNTRIES = [
  { value: 'IT', label: 'Italia' },
  { value: 'FR', label: 'Francia' },
  { value: 'DE', label: 'Germania' },
  { value: 'GB', label: 'Regno Unito' },
  { value: 'ES', label: 'Spagna' },
  { value: 'PT', label: 'Portogallo' },
  { value: 'BE', label: 'Belgio' },
  { value: 'NL', label: 'Paesi Bassi' },
  { value: 'LU', label: 'Lussemburgo' },
  { value: 'CH', label: 'Svizzera' },
  { value: 'AT', label: 'Austria' },
  { value: 'GR', label: 'Grecia' }
] as const

// Puoi aggiungere altri tipi di varianti qui
export const CLIENT_STATUS = [
  { value: 'attivo', label: 'Attivo' },
  { value: 'inattivo', label: 'Inattivo' }
] as const 
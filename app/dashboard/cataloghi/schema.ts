export const formSchema = z.object({
  codice: z.string().min(1, 'Codice richiesto'),
  brand_id: z.string().min(1, 'Brand richiesto'),
  tipo: z.enum(['Preordine', 'Disponibile', 'Riassortimento', 'Stock', 'Rimanenze']),
  stagione: z.enum([
    'PRE FALL-WINTER',
    'MAIN FALL-WINTER',
    'PRE SPRING-SUMMER',
    'MAIN SPRING-SUMMER',
    'OTHER'
  ]),
  anno: z.number().min(2000).max(2100),
  data_inizio_ordini: z.string().optional(),
  data_fine_ordini: z.string().optional(),
  data_consegna: z.string(),
  note: z.string().optional(),
  condizioni: z.string().optional(),
  cover_url: z.string().optional(),
  stato: z.enum(['bozza', 'pubblicato', 'archiviato']).default('bozza')
}) 
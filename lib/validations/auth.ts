import * as z from "zod"
import { BUSINESS_TYPES, COUNTRIES } from '@/lib/constants/variants'

export const RegisterSchema = z.object({
  company_name: z.string().min(2, "Ragione sociale richiesta"),
  vat_number: z.string().min(11, "Partita IVA non valida"),
  company_email: z.string().email("Email non valida"),
  company_phone: z.string().min(6, "Numero di telefono non valido"),
  business: z.enum(BUSINESS_TYPES.map(t => t.value) as [string, ...string[]], {
    required_error: "Seleziona il tipo di business"
  }),
  address: z.string().min(2, "Indirizzo richiesto"),
  city: z.string().min(2, "Città richiesta"),
  zip_code: z.string().min(5, "CAP non valido"),
  country: z.enum(COUNTRIES.map(c => c.value) as [string, ...string[]], {
    required_error: "Seleziona il paese"
  }),
  user_email: z.string().email("Email non valida"),
  password: z.string().min(8, "La password deve essere di almeno 8 caratteri"),
  nome: z.string().min(2, "Nome richiesto"),
  cognome: z.string().min(2, "Cognome richiesto"),
})

export type RegisterInput = z.infer<typeof RegisterSchema> 
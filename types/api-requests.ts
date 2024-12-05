import { z } from 'zod'
import { UserRole } from './auth'

// Schema base per le richieste API
const baseRequestSchema = z.object({
  timestamp: z.date().optional()
})

// Schema per la creazione di un brand
export const createBrandSchema = baseRequestSchema.extend({
  name: z.string().min(2, 'Nome troppo corto'),
  description: z.string().optional(),
  logo: z.string().optional()
})

// Schema per l'aggiornamento di un brand
export const updateBrandSchema = baseRequestSchema.extend({
  id: z.string().uuid(),
  name: z.string().min(2, 'Nome troppo corto').optional(),
  description: z.string().optional(),
  logo: z.string().optional()
})

// Schema per la creazione di un catalogo
export const createCatalogoSchema = baseRequestSchema.extend({
  nome: z.string().min(2, 'Nome troppo corto'),
  brand_id: z.string().uuid(),
  tipo: z.enum(['Preordine', 'Riassortimento']),
  stagione: z.enum(['MAIN SPRING-SUMMER', 'MAIN FALL-WINTER', 'FLASH']),
  anno: z.number().min(2024).max(2100),
  data_inizio_ordini: z.date().optional(),
  data_fine_ordini: z.date().optional(),
  data_consegna: z.string().optional(),
  note: z.string().optional(),
  condizioni: z.string().optional(),
  cover_url: z.string().optional()
})

// Schema per l'aggiornamento di un catalogo
export const updateCatalogoSchema = baseRequestSchema.extend({
  id: z.number(),
  nome: z.string().min(2, 'Nome troppo corto').optional(),
  tipo: z.enum(['Preordine', 'Riassortimento']).optional(),
  stagione: z.enum(['MAIN SPRING-SUMMER', 'MAIN FALL-WINTER', 'FLASH']).optional(),
  anno: z.number().min(2024).max(2100).optional(),
  data_inizio_ordini: z.date().optional(),
  data_fine_ordini: z.date().optional(),
  data_consegna: z.string().optional(),
  note: z.string().optional(),
  condizioni: z.string().optional(),
  cover_url: z.string().optional()
})

// Schema per l'upload di un file
export const uploadFileSchema = baseRequestSchema.extend({
  catalogo_id: z.number(),
  nome: z.string(),
  tipo: z.string(),
  description: z.string().optional(),
  file: z.instanceof(File)
})

// Schema per l'aggiornamento di un file
export const updateFileSchema = uploadFileSchema.omit({ file: true }).partial()

// Schema per la creazione di un client
export const createClientSchema = z.object({
  company_name: z.string().min(2),
  vat_number: z.string(),
  business: z.string().optional(),
  country: z.string(),
  address: z.string(),
  city: z.string(),
  zip_code: z.string(),
  company_email: z.string().email(),
  company_phone: z.string().optional(),
  pec: z.string().optional(),
  sdi: z.string().optional(),
  user_id: z.number(),
  stato: z.enum(['in_attesa_di_attivazione', 'attivo', 'sospeso', 'disattivato']).default('in_attesa_di_attivazione'),
  attivo: z.boolean().default(true)
})

// Aggiungi questo schema
export const updateClientSchema = z.object({
  id: z.number(),
  stato: z.string(),
  attivo: z.boolean()
})

// Tipi derivati dagli schema
export type CreateBrandRequest = z.infer<typeof createBrandSchema>
export type UpdateBrandRequest = z.infer<typeof updateBrandSchema>
export type CreateCatalogoRequest = z.infer<typeof createCatalogoSchema>
export type UpdateCatalogoRequest = z.infer<typeof updateCatalogoSchema>
export type UploadFileRequest = z.infer<typeof uploadFileSchema>
export type UpdateFileRequest = z.infer<typeof updateFileSchema>
export type CreateClientRequest = z.infer<typeof createClientSchema>

// Tipi per le risposte
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ErrorResponse {
  error: string
  details?: unknown
}

// Helper per verificare il tipo di risposta
export function isPaginatedResponse<T>(response: unknown): response is PaginatedResponse<T> {
  return response !== null && 
         typeof response === 'object' && 
         'data' in response &&
         'total' in response
}

export function isErrorResponse(response: unknown): response is ErrorResponse {
  return response !== null && 
         typeof response === 'object' && 
         'error' in response
} 
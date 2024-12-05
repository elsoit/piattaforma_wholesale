import { z } from 'zod'

// Schema base per le risposte API
const apiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional()
})

// Schema per risposte con dati
export const apiDataResponseSchema = apiResponseSchema.extend({
  data: z.unknown()
})

// Schema per risposte di errore
export const apiErrorResponseSchema = apiResponseSchema.extend({
  error: z.string()
})

// Tipi derivati
export type ApiResponse = z.infer<typeof apiResponseSchema>
export type ApiDataResponse<T> = ApiResponse & { data: T }
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>

// Type guard per verificare il tipo di risposta
export function isApiError(response: unknown): response is ApiErrorResponse {
  return apiErrorResponseSchema.safeParse(response).success
}

export function isApiSuccess<T>(response: unknown): response is ApiDataResponse<T> {
  return apiDataResponseSchema.safeParse(response).success
}

// Helper per creare risposte tipizzate
export function createSuccessResponse<T>(data: T, message?: string): ApiDataResponse<T> {
  return {
    success: true,
    data,
    message
  }
}

export function createErrorResponse(error: string): ApiErrorResponse {
  return {
    success: false,
    error
  }
} 
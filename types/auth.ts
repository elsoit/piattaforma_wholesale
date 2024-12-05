import { z } from 'zod'
import { isValidPhoneNumber } from 'libphonenumber-js'

// Enum per i ruoli utente
export const UserRole = z.enum(['admin', 'cliente', 'user'])
export type UserRole = z.infer<typeof UserRole>

// Schema base per l'utente (senza password)
export const baseUserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  nome: z.string(),
  cognome: z.string(),
  ruolo: UserRole,
  attivo: z.boolean(),
  telefono: z.string().optional(),
  created_at: z.date(),
  updated_at: z.date(),
  clientId: z.number().optional()
})

// Schema completo utente (con password)
export const userSchema = baseUserSchema.extend({
  password: z.string()
})

// Tipi derivati
export type User = z.infer<typeof userSchema>
export type BaseUser = z.infer<typeof baseUserSchema>

// Schema per le credenziali di login
export const loginSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(8, 'Password troppo corta')
})

export type LoginCredentials = z.infer<typeof loginSchema>

// Schema per la risposta del login
export const loginResponseSchema = z.object({
  user: baseUserSchema, // Usiamo lo schema base senza password
  redirectUrl: z.string()
})

export type LoginResponse = z.infer<typeof loginResponseSchema>

// Schema per la verifica email
export const checkEmailSchema = z.object({
  email: z.string().email('Email non valida')
})

export type CheckEmailRequest = z.infer<typeof checkEmailSchema>

// Schema per la registrazione
export const registerSchema = z.object({
  nome: z.string()
    .min(2, 'Il nome deve essere di almeno 2 caratteri')
    .max(50, 'Il nome non può superare i 50 caratteri'),
  
  cognome: z.string()
    .min(2, 'Il cognome deve essere di almeno 2 caratteri')
    .max(50, 'Il cognome non può superare i 50 caratteri'),
  
  email: z.string()
    .email('Email non valida')
    .toLowerCase(),
  
  telefono: z.string()
    .refine((val) => !val || isValidPhoneNumber(val), {
      message: 'Numero di telefono non valido'
    })
    .optional(),
  
  password: z.string()
    .min(8, 'La password deve essere di almeno 8 caratteri')
    .max(100, 'La password non può superare i 100 caratteri')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      'La password deve contenere almeno una lettera maiuscola, una minuscola, un numero e un carattere speciale'
    )
})

export type RegisterRequest = z.infer<typeof registerSchema>

// Tipo per il payload JWT
export interface JWTPayload {
  userId: number
  email: string
  role: UserRole
  clientId?: number
  iat?: number
  exp?: number
}

// Tipo per la sessione
export interface Session {
  userId: number
  role: UserRole
  clientId?: number
}

// Helper per verificare i ruoli
export const isAdmin = (role: UserRole): boolean => role === 'admin'
export const isCliente = (role: UserRole): boolean => role === 'cliente'
export const isUser = (role: UserRole): boolean => role === 'user'

// Helper per sanitizzare l'utente (rimuovere la password)
export function sanitizeUser(user: User): BaseUser {
  const { password, ...sanitizedUser } = user
  return sanitizedUser
} 
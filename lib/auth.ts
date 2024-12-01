import bcrypt from 'bcrypt'

export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  console.log('Plain password:', plainPassword)
  console.log('Hashed password from DB:', hashedPassword)
  const result = await bcrypt.compare(plainPassword, hashedPassword)
  console.log('Password match result:', result)
  return result
} 
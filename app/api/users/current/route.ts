import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const userName = cookieStore.get('user_name')?.value
    const companyName = cookieStore.get('company_name')?.value

    if (!userName) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    const [nome, cognome] = userName.split(' ')

    return NextResponse.json({
      nome,
      cognome,
      companyName
    })

  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Error fetching user' },
      { status: 500 }
    )
  }
} 
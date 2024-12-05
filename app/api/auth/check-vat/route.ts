import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  const dbClient = await db.connect();

  try {
    const { vat_number, country } = await request.json();

    const { rows } = await dbClient.query(
      'SELECT id FROM clients WHERE UPPER(vat_number) = UPPER($1) AND country = $2',
      [vat_number, country]
    );

    if (rows.length > 0) {
      return NextResponse.json(
        { error: 'VAT number already registered' },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error checking VAT:', error);
    return NextResponse.json(
      { error: 'Error checking VAT number' },
      { status: 500 }
    );
  } finally {
    dbClient.release();
  }
}

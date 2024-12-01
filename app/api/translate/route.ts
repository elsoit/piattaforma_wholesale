import { NextResponse } from 'next/server';
import { Translate } from '@google-cloud/translate/build/src/v2';

const translate = new Translate({
  key: process.env.GOOGLE_TRANSLATE_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { text, targetLanguage } = await request.json();

    const [translation] = await translate.translate(text, targetLanguage);

    return NextResponse.json({ translatedText: translation });
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore durante la traduzione' },
      { status: 500 }
    );
  }
} 
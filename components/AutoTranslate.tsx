'use client';

import { useEffect, useState } from 'react';

interface AutoTranslateProps {
  text: string;
}

export function AutoTranslate({ text }: AutoTranslateProps) {
  const [translatedText, setTranslatedText] = useState(text);
  const [userLanguage, setUserLanguage] = useState('it');

  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      setUserLanguage(event.detail);
    };

    window.addEventListener('languageChange', handleLanguageChange as EventListener);

    return () => {
      window.removeEventListener('languageChange', handleLanguageChange as EventListener);
    };
  }, []);

  useEffect(() => {
    const translateText = async () => {
      if (userLanguage === 'it') {
        setTranslatedText(text);
        return;
      }

      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            targetLanguage: userLanguage,
          }),
        });
        
        const data = await response.json();
        setTranslatedText(data.translatedText);
      } catch (error) {
        console.error('Errore durante la traduzione:', error);
        setTranslatedText(text);
      }
    };

    translateText();
  }, [text, userLanguage]);

  return <span>{translatedText}</span>;
} 
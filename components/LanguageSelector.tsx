'use client';

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Globe } from 'lucide-react';

export function LanguageSelector() {
  const [currentLang, setCurrentLang] = useState('it');

  const languages = {
    it: 'Italiano',
    en: 'English',
    ru: 'Русский'
  };

  const handleLanguageChange = async (newLang: string) => {
    setCurrentLang(newLang);
    // Trigger la traduzione attraverso il nostro componente AutoTranslate
    const event = new CustomEvent('languageChange', { detail: newLang });
    window.dispatchEvent(event);
  };

  return (
    <Select value={currentLang} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-[140px]">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(languages).map(([code, name]) => (
          <SelectItem key={code} value={code}>
            {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 
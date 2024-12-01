declare module 'i18n-iso-countries' {
  export function getNames(lang: string): { [key: string]: string };
  export function registerLocale(locale: any): void;
}

declare module 'i18n-iso-countries/langs/en.json' {
  const content: any;
  export default content;
} 
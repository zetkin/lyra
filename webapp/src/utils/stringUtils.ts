export const titleCaseWord = (word: string): string =>
  word[0].toUpperCase() + word.substring(1).toLowerCase();

const LANG_TO_COUNTRY: Record<string, string> = {
  cs: 'CZ',
  da: 'DK',
  el: 'GR',
  en: 'GB',
  he: 'IL',
  hi: 'IN',
  ja: 'JP',
  ko: 'KR',
  nb: 'NO',
  nn: 'NO',
  sq: 'AL',
  sv: 'SE',
  uk: 'UA',
  zh: 'CN',
};

export const langToFlagEmoji = (lang: string): string => {
  const countryCode = (LANG_TO_COUNTRY[lang] ?? lang).toUpperCase();
  return [...countryCode]
    .map((char) => String.fromCodePoint(0x1f1e6 + char.charCodeAt(0) - 65))
    .join('');
};

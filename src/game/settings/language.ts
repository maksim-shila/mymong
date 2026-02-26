export enum Language {
  RUSSIAN = 'ru',
  ENGLISH = 'en',
}

const LANGUAGE_STORAGE_KEY = 'mymong.language';
const DEFAULT_LANGUAGE: Language = Language.ENGLISH;

export const loadLanguage = (): Language => {
  try {
    const raw = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (raw === Language.RUSSIAN || raw === Language.ENGLISH) {
      return raw as Language;
    }
  } catch {
    // noop
  }

  return DEFAULT_LANGUAGE;
};

export const saveLanguage = (language: Language): void => {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // noop
  }
};

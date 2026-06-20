export const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German',
  it: 'Italian', pt: 'Portuguese', zh: 'Chinese', ja: 'Japanese',
  ko: 'Korean', ar: 'Arabic', ru: 'Russian', nl: 'Dutch',
}

export const LANGUAGES = Object.entries(LANGUAGE_NAMES).map(([code, label]) => ({ code, label }))

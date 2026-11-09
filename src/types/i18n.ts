import type dictionary from "../../data/translations.json";
export type TranslationKey = keyof typeof dictionary.en;
export type Translate = (key: TranslationKey) => string;

import React, { createContext, useContext, useMemo } from "react";
import englishMessages from "./locales/en.json";

export const PALWORLD_BREEDING_CALCULATOR_LOCALES = [
  "en",
  "zh-TW",
  "zh-CN",
  "ja",
  "ko",
  "th",
  "id",
  "vi",
  "fr",
  "de",
  "es",
  "es-MX",
  "it",
  "pl",
  "pt-BR",
  "ru",
  "tr",
] as const;

export type Locale = (typeof PALWORLD_BREEDING_CALCULATOR_LOCALES)[number];

export interface PageMessages extends Record<string, unknown> {
  meta_title: string;
  meta_description: string;
}

export interface CommonMessages {
  back_to_top: string;
  clear: string;
  close: string;
  search: { select: string };
}

export interface RuntimeLanguagePack {
  v: 1;
  locale: Locale;
  messages: PageMessages;
  common: CommonMessages;
  languageNames?: Partial<Record<Locale, string>>;
  pals: Record<string, string>;
  passiveSkills: Record<string, { name: string; description?: string }>;
}

type RuntimeLanguagePackPayload = Omit<
  RuntimeLanguagePack,
  "messages" | "common"
> & {
  messages: Record<string, unknown>;
  common: Record<string, unknown>;
};

export const LANGUAGE_DISPLAY_NAMES: Record<Locale, string> = {
  en: "English",
  "zh-CN": "Chinese (Simplified)",
  "zh-TW": "Chinese (Traditional)",
  ja: "Japanese",
  ko: "Korean",
  th: "Thai",
  id: "Indonesian",
  vi: "Vietnamese",
  fr: "French",
  de: "German",
  es: "Spanish",
  "es-MX": "Spanish (Mexico)",
  it: "Italian",
  pl: "Polish",
  "pt-BR": "Portuguese (Brazil)",
  ru: "Russian",
  tr: "Turkish",
};

export const ENGLISH_COMMON_MESSAGES: CommonMessages = {
  back_to_top: "Back to top",
  clear: "Clear",
  close: "Close",
  search: { select: "Select" },
};

type TranslationOptions = Record<string, string | number | Date>;
type Translate = (key: string, options?: TranslationOptions) => string;

interface I18nValue {
  locale: Locale;
  translate: (
    namespace: string,
    key: string,
    options?: TranslationOptions,
  ) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function normalizeLocale(value: string | null | undefined): Locale {
  const normalized = value?.trim().replaceAll("_", "-").toLowerCase();
  if (!normalized) return "en";

  if (["zh", "zh-cn", "zh-sg", "zh-hans"].includes(normalized)) {
    return "zh-CN";
  }
  if (["zh-tw", "zh-hk", "zh-mo", "zh-hant"].includes(normalized)) {
    return "zh-TW";
  }
  if (normalized === "pt" || normalized === "pt-br") return "pt-BR";
  if (normalized === "es-mx") return "es-MX";

  const primary = normalized.split("-")[0];
  return (
    PALWORLD_BREEDING_CALCULATOR_LOCALES.find(
      (locale) => locale.toLowerCase() === normalized || locale === primary,
    ) ?? "en"
  );
}

export function readPageLocale(
  availableLocales: readonly Locale[] = getAvailableLocales(),
): Locale {
  if (typeof window === "undefined") return "en";
  const shellLocale =
    typeof document === "undefined"
      ? null
      : document
          .querySelector('meta[name="palworld-breeding-calculator-locale"]')
          ?.getAttribute("content");
  if (shellLocale && matchesSupportedLocale(shellLocale, availableLocales)) {
    return normalizeLocale(shellLocale);
  }

  const requestedLocale = new URLSearchParams(window.location.search).get(
    "lang",
  );
  if (
    requestedLocale &&
    matchesSupportedLocale(requestedLocale, availableLocales)
  ) {
    return normalizeLocale(requestedLocale);
  }

  const browserLocales = window.navigator?.languages?.length
    ? window.navigator.languages
    : window.navigator?.language
      ? [window.navigator.language]
      : [];
  for (const browserLocale of browserLocales) {
    if (matchesSupportedLocale(browserLocale, availableLocales)) {
      return normalizeLocale(browserLocale);
    }
  }
  return "en";
}

function matchesSupportedLocale(
  value: string,
  availableLocales: readonly Locale[],
) {
  const normalized = value.trim().replaceAll("_", "-").toLowerCase();
  if (!normalized) return false;
  if (
    [
      "zh",
      "zh-cn",
      "zh-sg",
      "zh-hans",
      "zh-tw",
      "zh-hk",
      "zh-mo",
      "zh-hant",
      "pt",
      "pt-br",
      "es-mx",
    ].includes(normalized)
  ) {
    return availableLocales.includes(normalizeLocale(normalized));
  }
  const primary = normalized.split("-")[0];
  return availableLocales.some(
    (locale) => locale.toLowerCase() === normalized || locale === primary,
  );
}

export function getAvailableLocales(
  configured = import.meta.env.VITE_PALWORLD_AVAILABLE_LOCALES,
): readonly Locale[] {
  const locales = String(configured ?? "")
    .split(",")
    .map((item) => normalizeLocale(item))
    .filter((item, index, values) => values.indexOf(item) === index);
  return locales.length > 0 ? locales : ["en"];
}

export function resolveRuntimeLanguagePackBaseUrl(
  configured = import.meta.env.VITE_PALWORLD_LANGUAGE_PACK_BASE_URL,
): string | null {
  const value = String(configured ?? "")
    .trim()
    .replace(/\/+$/u, "");
  return value && !value.includes("%VITE_") ? value : null;
}

export async function loadRuntimeLanguagePack(
  locale: Locale | string,
  options: { baseUrl?: string | null; fetch?: typeof fetch } = {},
): Promise<RuntimeLanguagePack> {
  const normalizedLocale = normalizeLocale(locale);
  const baseUrl = options.baseUrl?.trim().replace(/\/+$/u, "");
  if (!baseUrl) return createEnglishLanguagePack();

  try {
    const fetchImpl = options.fetch ?? fetch;
    const response = await fetchImpl(
      `${baseUrl}/${encodeURIComponent(normalizedLocale)}.json`,
      { credentials: "same-origin" },
    );
    if (!response.ok) return createEnglishLanguagePack();

    const pack = await response.json();
    if (!isRuntimeLanguagePackPayload(pack, normalizedLocale)) {
      return createEnglishLanguagePack();
    }
    return {
      ...pack,
      messages: mergeWithEnglishFallback(
        englishMessages,
        pack.messages,
      ) as PageMessages,
      common: mergeWithEnglishFallback(
        ENGLISH_COMMON_MESSAGES,
        pack.common,
      ) as CommonMessages,
    };
  } catch {
    return createEnglishLanguagePack();
  }
}

export function applyRuntimeLanguageDisplayNames(pack: RuntimeLanguagePack) {
  for (const locale of PALWORLD_BREEDING_CALCULATOR_LOCALES) {
    const name = pack.languageNames?.[locale];
    if (typeof name === "string" && name.trim()) {
      LANGUAGE_DISPLAY_NAMES[locale] = name;
    }
  }
}

export async function loadPageMessages(locale: Locale): Promise<PageMessages> {
  return (
    await loadRuntimeLanguagePack(locale, {
      baseUrl: resolveRuntimeLanguagePackBaseUrl(),
    })
  ).messages;
}

export function getPageMetadata(messages: PageMessages) {
  return {
    title: `${messages.meta_title} | CrateX.app`,
    description: messages.meta_description,
  };
}

export function I18nProvider({
  locale,
  messages,
  common = ENGLISH_COMMON_MESSAGES,
  children,
}: {
  locale: Locale;
  messages: PageMessages;
  common?: CommonMessages;
  children: React.ReactNode;
}) {
  const value = useMemo<I18nValue>(
    () => ({
      locale,
      translate(namespace, key, options) {
        const source =
          namespace === "palworld-breeding-calculator"
            ? messages
            : namespace === "common"
              ? common
              : null;
        const message = readNestedString(source, key);
        if (message == null) {
          throw new Error(
            `Missing translation: ${namespace}.${key} (${locale})`,
          );
        }
        return formatMessage(message, options);
      },
    }),
    [common, locale, messages],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

function createEnglishLanguagePack(): RuntimeLanguagePack {
  return {
    v: 1,
    locale: "en",
    messages: englishMessages,
    common: ENGLISH_COMMON_MESSAGES,
    pals: {},
    passiveSkills: {},
  };
}

function isRuntimeLanguagePackPayload(
  value: unknown,
  locale: Locale,
): value is RuntimeLanguagePackPayload {
  if (!value || typeof value !== "object") return false;
  const pack = value as Partial<RuntimeLanguagePackPayload>;
  return (
    pack.v === 1 &&
    pack.locale === locale &&
    isRecord(pack.messages) &&
    isRecord(pack.common) &&
    (pack.languageNames === undefined || isRecord(pack.languageNames)) &&
    isRecord(pack.pals) &&
    isRecord(pack.passiveSkills)
  );
}

function mergeWithEnglishFallback(
  fallback: unknown,
  preferred: unknown,
): unknown {
  if (!isRecord(fallback)) {
    return typeof preferred === "string" && preferred.trim()
      ? preferred
      : fallback;
  }

  const preferredRecord = isRecord(preferred) ? preferred : {};
  const merged: Record<string, unknown> = { ...preferredRecord };
  for (const [key, fallbackValue] of Object.entries(fallback)) {
    merged[key] = mergeWithEnglishFallback(fallbackValue, preferredRecord[key]);
  }
  return merged;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function useLocale(): Locale {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useLocale requires I18nProvider");
  return context.locale;
}

export function useTranslations(namespace: string): Translate {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useTranslations requires I18nProvider");
  return useMemo(
    () => (key: string, options?: TranslationOptions) =>
      context.translate(namespace, key, options),
    [context, namespace],
  );
}

function readNestedString(source: unknown, key: string): string | null {
  let current = source;
  for (const segment of key.split(".")) {
    if (!current || typeof current !== "object") return null;
    current = (current as Record<string, unknown>)[segment];
  }
  return typeof current === "string" ? current : null;
}

function formatMessage(message: string, options?: TranslationOptions) {
  if (!options) return message;
  return message.replace(/\{([^{}]+)\}/gu, (placeholder, key: string) => {
    const value = options[key];
    return value == null ? placeholder : String(value);
  });
}

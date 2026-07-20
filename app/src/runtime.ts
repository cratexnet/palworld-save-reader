import type { Locale } from "./i18n";

export const PALWORLD_BREEDING_CALCULATOR_PUBLIC_PATH =
  "/games/palworld/breeding";

const GAME_TO_CRATEX_LOCALE: Record<Locale, string> = {
  en: "en",
  "zh-TW": "zh-TW",
  "zh-CN": "zh-CN",
  ja: "ja",
  ko: "ko",
  th: "th",
  id: "id",
  vi: "vi",
  fr: "fr",
  de: "de",
  es: "es",
  "es-MX": "es",
  it: "it",
  pl: "pl",
  "pt-BR": "pt",
  ru: "ru",
  tr: "tr",
};

export function buildPalworldBreedingCalculatorStandaloneHref(
  locale: Locale,
  hash = "",
) {
  const params = new URLSearchParams({ lang: locale });
  const normalizedHash =
    hash && hash !== "#" ? `#${hash.replace(/^#/u, "")}` : "";
  return `${PALWORLD_BREEDING_CALCULATOR_PUBLIC_PATH}?${params.toString()}${normalizedHash}`;
}

export function shouldManagePalworldCalculatorDocumentMetadata(
  shellLocale: string | null,
) {
  return shellLocale === null;
}

export function buildCrateXGamesCategoryHref(locale: Locale) {
  return `/${GAME_TO_CRATEX_LOCALE[locale]}/cat/games`;
}

export function resolveBreedingRoutesApiBaseUrlFromLocation(
  env: Record<string, unknown>,
  origin: string,
) {
  const configured = readEnvString(env, "PUBLIC_API_BASE_URL");
  if (configured) return configured.replace(/\/+$/u, "");

  const url = new URL(origin);
  const hostname = url.hostname.toLowerCase();
  if (hostname === "cratex.app" || hostname === "www.cratex.app") {
    return "https://api.cratex.app";
  }
  if (hostname === "preview.cratex.app") {
    return "https://api-preview.cratex.app";
  }
  return url.origin.replace(/\/+$/u, "");
}

function readEnvString(env: Record<string, unknown>, key: string) {
  const value = env[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

import { PALWORLD_BREEDING_CALCULATOR_LOCALES, type Locale } from "./i18n";

export const PALWORLD_BREEDING_CALCULATOR_PUBLIC_PATH =
  "/games/palworld/breeding";

export const PALWORLD_BREEDING_CALCULATOR_LOCALE_COOKIE_NAME =
  "cratex-palworld-breeding-locale";
export const PALWORLD_BREEDING_CALCULATOR_LOCALE_SOURCE_QUERY_PARAM =
  "locale-source";
export const PALWORLD_BREEDING_CALCULATOR_AUTOMATIC_LOCALE_SOURCE = "auto";

const LOCALE_COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

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

export function buildCrateXGamesCategoryHref() {
  return "/cat/games";
}

export function persistPalworldBreedingCalculatorLocalePreference(
  locale: Locale,
  target?: {
    hostname: string;
    writeCookie: (value: string) => void;
    readCookie?: () => string;
    removeLocalStorage?: (key: string) => void;
    writeLocalStorage: (key: string, value: string) => void;
  },
) {
  const activeTarget = target ?? {
    hostname: window.location.hostname,
    readCookie: () => document.cookie,
    writeCookie: (value: string) => {
      document.cookie = value;
    },
    writeLocalStorage: (key: string, value: string) => {
      window.localStorage.setItem(key, value);
    },
    removeLocalStorage: (key: string) => {
      window.localStorage.removeItem(key);
    },
  };
  const parts = activeTarget.hostname.split(".");
  const domain = parts.length >= 2 ? `.${parts.slice(-2).join(".")}` : "";
  const hostOnly =
    activeTarget.hostname === "localhost" ||
    /^\d{1,3}(?:\.\d{1,3}){3}$/u.test(activeTarget.hostname);
  const domainAttribute = !hostOnly && domain ? `; domain=${domain}` : "";
  const cookieOptions =
    `; max-age=${LOCALE_COOKIE_MAX_AGE}; path=/; SameSite=lax` +
    domainAttribute;

  let cookiePersisted = false;
  try {
    activeTarget.writeCookie(
      `${PALWORLD_BREEDING_CALCULATOR_LOCALE_COOKIE_NAME}=${encodeURIComponent(locale)}${cookieOptions}`,
    );
    if (!hostOnly) {
      activeTarget.writeCookie(
        `${PALWORLD_BREEDING_CALCULATOR_LOCALE_COOKIE_NAME}=; max-age=0; path=/; SameSite=lax`,
      );
    }
    cookiePersisted =
      activeTarget.readCookie === undefined ||
      readPalworldBreedingCalculatorLocaleCookie(activeTarget.readCookie()) ===
        locale;
  } catch {}

  if (cookiePersisted) {
    try {
      activeTarget.removeLocalStorage?.(
        PALWORLD_BREEDING_CALCULATOR_LOCALE_COOKIE_NAME,
      );
    } catch {}
    return;
  }

  try {
    activeTarget.writeLocalStorage(
      PALWORLD_BREEDING_CALCULATOR_LOCALE_COOKIE_NAME,
      locale,
    );
  } catch {
    // Language navigation still works when preference storage is unavailable.
  }
}

export function isPalworldBreedingCalculatorAutomaticLocaleEntry(
  search: string,
) {
  const params = new URLSearchParams(search);
  const requestedLocales = params.getAll("lang");
  const localeSources = params.getAll(
    PALWORLD_BREEDING_CALCULATOR_LOCALE_SOURCE_QUERY_PARAM,
  );
  return (
    Array.from(params.keys()).length === 2 &&
    requestedLocales.length === 1 &&
    PALWORLD_BREEDING_CALCULATOR_LOCALES.includes(
      requestedLocales[0] as Locale,
    ) &&
    localeSources.length === 1 &&
    localeSources[0] === PALWORLD_BREEDING_CALCULATOR_AUTOMATIC_LOCALE_SOURCE
  );
}

export function resolvePalworldBreedingCalculatorLocalStoragePreference({
  automaticLocaleEntry,
  pageLocale,
  storedLocale,
}: {
  automaticLocaleEntry: boolean;
  pageLocale: Locale;
  storedLocale: string | null | undefined;
}): Locale | null {
  if (
    !automaticLocaleEntry ||
    !PALWORLD_BREEDING_CALCULATOR_LOCALES.includes(storedLocale as Locale) ||
    storedLocale === pageLocale
  ) {
    return null;
  }
  return storedLocale as Locale;
}

function readPalworldBreedingCalculatorLocaleCookie(
  cookie: string,
): Locale | null {
  const prefix = `${PALWORLD_BREEDING_CALCULATOR_LOCALE_COOKIE_NAME}=`;
  const localeCookie = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  if (!localeCookie) return null;

  try {
    const locale = decodeURIComponent(localeCookie.slice(prefix.length));
    return PALWORLD_BREEDING_CALCULATOR_LOCALES.includes(locale as Locale)
      ? (locale as Locale)
      : null;
  } catch {
    return null;
  }
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

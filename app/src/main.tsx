import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { applyRuntimeLanguagePack } from "./game-data";
import {
  applyRuntimeLanguageDisplayNames,
  getAvailableLocales,
  loadRuntimeLanguagePack,
  readPageLocale,
  resolveRuntimeLanguagePackBaseUrl,
} from "./i18n";
import {
  buildPalworldBreedingCalculatorStandaloneHref,
  isPalworldBreedingCalculatorAutomaticLocaleEntry,
  PALWORLD_BREEDING_CALCULATOR_LOCALE_COOKIE_NAME,
  resolvePalworldBreedingCalculatorLocalStoragePreference,
} from "./runtime";
import "./styles.css";

function getRequiredRootElement() {
  const root = document.getElementById("root");
  if (!root) throw new Error("Missing #root element");
  return root;
}

const root = getRequiredRootElement();

async function renderApp() {
  const locale = readPageLocale(getAvailableLocales());
  let storedLocale: string | null = null;
  try {
    storedLocale = window.localStorage.getItem(
      PALWORLD_BREEDING_CALCULATOR_LOCALE_COOKIE_NAME,
    );
  } catch {}
  const automaticLocaleEntry = isPalworldBreedingCalculatorAutomaticLocaleEntry(
    window.location.search,
  );
  const localStorageLocale =
    resolvePalworldBreedingCalculatorLocalStoragePreference({
      pageLocale: locale,
      automaticLocaleEntry,
      storedLocale,
    });
  if (localStorageLocale) {
    window.location.replace(
      buildPalworldBreedingCalculatorStandaloneHref(
        localStorageLocale,
        window.location.hash,
      ),
    );
    return;
  }
  if (automaticLocaleEntry) {
    window.history.replaceState(
      window.history.state,
      "",
      buildPalworldBreedingCalculatorStandaloneHref(
        locale,
        window.location.hash,
      ),
    );
  }
  const languagePack = await loadRuntimeLanguagePack(locale, {
    baseUrl: resolveRuntimeLanguagePackBaseUrl(),
  });
  applyRuntimeLanguageDisplayNames(languagePack);
  applyRuntimeLanguagePack(languagePack);

  createRoot(root).render(
    <StrictMode>
      <App
        locale={languagePack.locale}
        messages={languagePack.messages}
        common={languagePack.common}
      />
    </StrictMode>,
  );
}

void renderApp();

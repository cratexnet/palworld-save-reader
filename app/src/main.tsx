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
import "./styles.css";

function getRequiredRootElement() {
  const root = document.getElementById("root");
  if (!root) throw new Error("Missing #root element");
  return root;
}

const root = getRequiredRootElement();

async function renderApp() {
  const locale = readPageLocale(getAvailableLocales());
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

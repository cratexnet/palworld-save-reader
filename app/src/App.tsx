import { ChakraProvider } from "@chakra-ui/react";
import { useEffect } from "react";
import PalworldBreedingCalculatorPage from "./PalworldBreedingCalculatorPage";
import { calculatorSystem } from "./chakra-system";
import {
  getPageMetadata,
  I18nProvider,
  type CommonMessages,
  type Locale,
  type PageMessages,
} from "./i18n";
import {
  buildPalworldBreedingCalculatorStandaloneHref,
  shouldManagePalworldCalculatorDocumentMetadata,
} from "./runtime";
import { AppToaster } from "./ui";

export default function App({
  locale,
  messages,
  common,
}: {
  locale: Locale;
  messages: PageMessages;
  common: CommonMessages;
}) {
  const metadata = getPageMetadata(messages);

  useEffect(() => {
    document.documentElement.lang = locale;
    const shellLocale =
      document
        .querySelector<HTMLMetaElement>(
          'meta[name="palworld-breeding-calculator-locale"]',
        )
        ?.getAttribute("content") ?? null;
    if (!shouldManagePalworldCalculatorDocumentMetadata(shellLocale)) return;

    document.title = metadata.title;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", metadata.description);
  }, [locale, metadata.description, metadata.title]);

  function handleLocaleChange(nextLocale: Locale) {
    if (nextLocale === locale) return;
    window.location.assign(
      buildPalworldBreedingCalculatorStandaloneHref(
        nextLocale,
        window.location.hash,
      ),
    );
  }

  return (
    <ChakraProvider value={calculatorSystem}>
      <I18nProvider locale={locale} messages={messages} common={common}>
        <PalworldBreedingCalculatorPage onLocaleChange={handleLocaleChange} />
        <AppToaster closeLabel={common.close} />
      </I18nProvider>
    </ChakraProvider>
  );
}

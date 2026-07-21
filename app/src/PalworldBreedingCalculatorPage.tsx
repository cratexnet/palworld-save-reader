"use client";

import {
  createContext,
  forwardRef,
  startTransition,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
  type Ref,
  useCallback,
  useEffect,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  FileArchive,
  FolderOpen,
  Gamepad2,
  Languages,
  Joystick,
  LoaderCircle,
  Mars,
  Monitor,
  Plus,
  Search,
  Server,
  Share2,
  Store,
  Sparkles,
  Terminal,
  Venus,
  X,
} from "lucide-react";
import { appToaster, AppIcon, AppTooltip, Link } from "./ui";
import {
  Alert,
  Badge,
  Box,
  Button,
  CloseButton,
  Collapsible,
  Combobox,
  createListCollection,
  Dialog,
  Field,
  Flex,
  Grid,
  Heading,
  HStack,
  Image,
  Input,
  IconButton,
  NativeSelect,
  Portal,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
} from "@chakra-ui/react";
import BackToTopButton from "./BackToTopButton";
import FileDropzone from "./FileDropzone";
import ResultsSearchToolbar from "./ResultsSearchToolbar";
import {
  matchesResultsSearch,
  normalizeResultsSearchText,
  type ResultsSearchEntry,
} from "./results-search";
import { resolveBreedingSearchResultVisibility } from "./breeding-search-result-visibility";
import type { Locale } from "./i18n";
import {
  getAvailableLocales,
  LANGUAGE_DISPLAY_NAMES,
  useLocale,
  useTranslations,
} from "./i18n";
import {
  buildCrateXGamesCategoryHref,
  resolveBreedingRoutesApiBaseUrlFromLocation,
} from "./runtime";
import {
  readPalworldBreedingCalculatorSessionState,
  writePalworldBreedingCalculatorSessionState,
  type BreedingCalculatorPreparedOwnedPalsUpload,
  type PalworldBreedingCalculatorSessionState,
} from "./calculator-session-state";
import {
  buildCalculatorShareHash,
  parseCalculatorShareHash,
  type CalculatorShareState,
} from "./calculator-share-state";
import {
  createPassiveSkillEffectExcerpt,
  resolvePassiveSkillGroup,
  resolvePassiveSkillPresentation,
  type PassiveSkillPresentation,
  type PassiveSkillTier,
} from "./passive-skill-presentation";
import { getVirtualListRange } from "./virtual-list";
import {
  comparePalworldBreedingRoutes,
  summarizePalworldBreedingRoute,
} from "../../src/breeding-route-summary";
import {
  createPalworldFormulaRouteSignature,
  createPalworldRouteExecutionSignature,
} from "../../src/breeding-route-identity";
import { createPalworldRouteCollectionRevision } from "../../src/route-collection-revision";
import {
  getDisplayContainerSlot,
  getPalboxSlotPosition,
} from "../../src/palbox-slot-position";
import { dedupeParentBreedingOutcomes } from "../../src/parent-breeding-display";
import { gameData, PALWORLD_V1_METADATA } from "./game-data";
import {
  findPalworldInternalIdByDisplayText,
  getPalworldDisplayName,
} from "../../src/palworld-localization";
import {
  getPalworldPassiveSkillDisplayName,
  listPalworldPassiveSkillOptions,
  type PalworldPassiveSkillOption,
} from "../../src/passive-skill-localization";
import {
  type PalworldBreedingRoute,
  type PalworldBreedingRouteGroup,
  type PalworldBreedingRouteRequirement,
  type PalworldBreedingRoutesResponse,
  type PalworldParentBreedingOutcome,
} from "../../src/breeding-routes-api-contract";
import { createPalworldBreedingRoutesFetchInput } from "../../src/breeding-routes-fetch-request";
import { parsePalworldBreedingRoutesResponse } from "../../src/breeding-routes-response";
import {
  createFormulaPlanFromTargetShard,
  loadParentShard,
  loadTargetShard,
} from "../../src/static-breeding-data";
import { summarizePalworldOwnedPassiveSkills } from "../../src/owned-passive-summary";
import { assertPalworldSaveFileSize } from "../../src/save-file-header";
import { parsePalworldSaveInWorker } from "../../src/save-parser-worker-client";
import { comparePalSearchOptions } from "../../src/pal-search-option-order";
import { mapSaveParserErrorToMessageKey } from "../../src/save-parser-error-message";

const CALCULATOR_CONTENT_MAX_WIDTH = "80rem";
const INVENTORY_PRIORITY_ROUTE_COUNT = 8;
const MAX_PASSIVE_SELECTION = 4;
const EMPTY_OWNED_PALS_PAYLOAD = { v: 1, pals: [] } as const;
const PASSIVE_LABEL_FONT_SIZES = [14, 13, 12, 11.25] as const;
const PASSIVE_TIER_KEYS = [
  "worldTree",
  "prismatic",
  "gold",
  "common",
  "negative",
] as const;
type PassiveTierKey = (typeof PASSIVE_TIER_KEYS)[number];
const SAVE_LOCATION_KEYS = [
  "steam_windows",
  "game_pass",
  "steam_deck",
  "steam_linux",
  "dedicated_server",
] as const;
type SaveLocationKey = (typeof SAVE_LOCATION_KEYS)[number];
const SAVE_LOCATION_ICONS = {
  steam_windows: Monitor,
  game_pass: Gamepad2,
  steam_deck: Joystick,
  steam_linux: Terminal,
  dedicated_server: Server,
} satisfies Record<SaveLocationKey, typeof Monitor>;
type BreedingQueryMode = "target" | "parents";
type ParentBreedingDataStatus = "idle" | "loading" | "ready" | "error";
type SubmittedParentBreedingQuery = {
  parentSpecies: string;
  partnerSpecies: string | null;
  reverse: boolean;
};

const availableLocales = getAvailableLocales();
const palworldAssetBaseHref =
  import.meta.env.VITE_PALWORLD_ASSET_BASE_URL?.trim().replace(/\/+$/u, "") ||
  null;
const cratexLogo32Href = "/favicon-32.png";
const cratexLogo64Href = "/favicon-64.png";

interface FloatingErrorAlertProps {
  testId: string;
  message: string;
  retryLabel: string;
  closeLabel: string;
  onRetry: () => void;
  onClose: () => void;
}

function FloatingErrorAlert({
  testId,
  message,
  retryLabel,
  closeLabel,
  onRetry,
  onClose,
}: FloatingErrorAlertProps) {
  return (
    <Portal>
      <Alert.Root
        data-testid={testId}
        status="error"
        role="alert"
        position="fixed"
        zIndex={1500}
        insetX={{ base: 3, md: "auto" }}
        right={{ md: 6 }}
        bottom={{ base: 3, md: 6 }}
        w={{ base: "auto", md: "28rem" }}
        maxW="calc(100vw - 1.5rem)"
        borderWidth="1px"
        borderColor="var(--palworld-error-border-soft)"
        borderRadius="md"
        boxShadow="0 18px 48px rgba(4, 38, 48, 0.28)"
      >
        <Alert.Indicator />
        <Alert.Description flex="1" lineHeight="1.5">
          {message}
        </Alert.Description>
        <Button
          type="button"
          size="xs"
          variant="outline"
          flexShrink={0}
          onClick={onRetry}
        >
          {retryLabel}
        </Button>
        <CloseButton
          size="sm"
          flexShrink={0}
          aria-label={closeLabel}
          onClick={onClose}
        />
      </Alert.Root>
    </Portal>
  );
}

function palworldIconHref(internalId: string) {
  if (!palworldAssetBaseHref) return null;
  const fileName = internalId
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/_/g, "-")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLocaleLowerCase();
  const src = `${palworldAssetBaseHref}/pals/${fileName}.webp`;

  return {
    src,
    srcSet: [
      `${palworldAssetBaseHref}/pals/48/${fileName}.webp 48w`,
      `${palworldAssetBaseHref}/pals/96/${fileName}.webp 96w`,
      `${src} 192w`,
    ].join(", "),
  };
}
const palworldHero1920Href = palworldAssetBaseHref
  ? `${palworldAssetBaseHref}/hero/palworld-library-hero-1920.webp`
  : null;
const palworldHero768Href = palworldAssetBaseHref
  ? `${palworldAssetBaseHref}/hero/palworld-library-hero-768.webp`
  : null;
const palworldHero3840Href = palworldAssetBaseHref
  ? `${palworldAssetBaseHref}/hero/palworld-library-hero-3840.webp`
  : null;
const passiveSkillAssetBaseHref = palworldAssetBaseHref
  ? `${palworldAssetBaseHref}/passives`
  : null;
const palworldChildLabelIconHref = palworldAssetBaseHref
  ? `${palworldAssetBaseHref}/items/pal-egg.webp`
  : null;
const palworldParentLabelIconHref = palworldAssetBaseHref
  ? `${palworldAssetBaseHref}/pals/sheep-ball.webp`
  : null;
const palworldTargetQueryIconHref = palworldAssetBaseHref
  ? `${palworldAssetBaseHref}/buildings/egg-incubator.webp`
  : null;
const palworldParentsQueryIconHref = palworldAssetBaseHref
  ? `${palworldAssetBaseHref}/buildings/breeding-farm.webp`
  : null;

const PASSIVE_TIER_TONES = {
  negative: {
    accent: "#ff424b",
    text: "#f4f6f6",
  },
  neutral: {
    accent: "#829196",
    text: "#f2f6f7",
  },
  rank1: {
    accent: "#d8e1e3",
    text: "#f2f6f7",
  },
  rank2Or3: {
    accent: "#ffda1a",
    text: "#ffe45a",
  },
  rank4: {
    accent: "#62f8dd",
    text: "#69f5df",
  },
  rank5: {
    accent: "#62f8dd",
    text: "#69f5df",
  },
} as const satisfies Record<
  PassiveSkillTier,
  {
    accent: string;
    text: string;
  }
>;

type WorkbenchStatus = "idle" | "parsing" | "ready" | "planning";
type CalculationMode = "formula" | "inventory";
type CalculationResult = PalworldBreedingRoutesResponse & {
  mode: CalculationMode;
};
type PalworldBreedingRouteSource = PalworldBreedingRoute["sources"][number];
type PalworldBreedingRouteParent =
  PalworldBreedingRoute["steps"][number]["parent1"];
type InventoryRouteGroupKey = Extract<
  PalworldBreedingRouteGroup,
  "parents_owned" | "needs_supplement"
>;
const EMPTY_OWNED_ROUTE_SOURCES = new Map<
  string,
  PalworldBreedingRouteSource
>();
const OwnedRouteSourcesContext = createContext<
  ReadonlyMap<string, PalworldBreedingRouteSource>
>(EMPTY_OWNED_ROUTE_SOURCES);

interface SearchOption {
  value: string;
  label: string;
  description?: string;
  badge?: string;
  avatarInternalId?: string;
  selectedLabel?: string;
  searchText: string;
  paldeckNumber?: number | null;
  paldeckCode?: string;
  rank?: number;
  ownedCount?: number;
}

type ControlledComboboxInputProps = ComponentProps<typeof Input>;

const ControlledComboboxInput = forwardRef<
  HTMLInputElement,
  ControlledComboboxInputProps
>(({ defaultValue: _defaultValue, ...props }, ref) => (
  <Input {...props} ref={ref} />
));

ControlledComboboxInput.displayName = "ControlledComboboxInput";

export interface PalworldBreedingCalculatorPageProps {
  onLocaleChange?: (locale: Locale) => void | Promise<void>;
}

function resolveBreedingRoutesApiBaseUrl() {
  if (typeof window === "undefined") return "";

  return resolveBreedingRoutesApiBaseUrlFromLocation(
    import.meta.env,
    window.location.origin,
  );
}

function normalizeSearchText(value: string) {
  return value.trim().toLocaleLowerCase();
}

function readCalculatorSessionStateFromBrowser() {
  if (typeof window === "undefined") return null;
  try {
    return readPalworldBreedingCalculatorSessionState(window.sessionStorage);
  } catch {
    return null;
  }
}

function writeCalculatorSessionStateToBrowser(
  state: PalworldBreedingCalculatorSessionState,
) {
  if (typeof window === "undefined") return;
  try {
    writePalworldBreedingCalculatorSessionState(window.sessionStorage, state);
  } catch {
    // State handoff is optional when browser storage is unavailable.
  }
}

function shouldUseNativeShare() {
  return typeof navigator.share === "function";
}

function readCalculatorShareStateFromBrowser() {
  if (typeof window === "undefined") return null;
  return parseCalculatorShareHash(window.location.hash, {
    isPalId: (value) => Boolean(gameData.palsByInternal[value]),
    isPassiveId: (value) => Boolean(gameData.passiveSkillsByInternal?.[value]),
  });
}

function paldeckBadgeText(internalId: string) {
  const pal = gameData.palsByInternal[internalId];
  return pal?.paldeckCode ? `No.${pal.paldeckCode}` : null;
}

function createPalOptions(locale: string): SearchOption[] {
  return Object.entries(gameData.palsByInternal)
    .map(([internalId, pal]) => {
      const label = getPalworldDisplayName(internalId, gameData, locale);
      const english = pal.localizedNames?.en ?? pal.name;
      const badge = paldeckBadgeText(internalId) ?? undefined;
      const description = english && english !== label ? english : undefined;
      return {
        value: internalId,
        label,
        badge,
        avatarInternalId: internalId,
        selectedLabel: badge ? `${badge} ${label}` : label,
        description,
        searchText: [
          pal.paldeckNumber,
          pal.paldeckCode,
          badge,
          internalId,
          label,
          pal.name,
          english,
          ...Object.values(pal.localizedNames ?? {}),
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase(),
        paldeckNumber: pal.paldeckNumber,
        paldeckCode: pal.paldeckCode,
      };
    })
    .sort((left, right) => comparePalSearchOptions(left, right, locale));
}

function createPassiveOptions(locale: string): SearchOption[] {
  return listPalworldPassiveSkillOptions(locale, gameData).map((option) => {
    const label = safePassiveLabel(option, locale);
    return {
      value: option.id,
      label,
      description: option.description,
      rank: option.rank,
      searchText: [
        option.id,
        option.value,
        option.label,
        label,
        option.description,
      ]
        .join(" ")
        .toLocaleLowerCase(),
    };
  });
}

function passiveTierKey(rank = 0): PassiveTierKey {
  return resolvePassiveSkillGroup(rank);
}

function groupPassiveOptionsByTier(options: readonly SearchOption[]) {
  const groups = Object.fromEntries(
    PASSIVE_TIER_KEYS.map((key) => [key, [] as SearchOption[]]),
  ) as Record<PassiveTierKey, SearchOption[]>;

  for (const option of options) {
    groups[passiveTierKey(option.rank)].push(option);
  }

  return groups;
}

function safePassiveLabel(
  optionOrId: PalworldPassiveSkillOption | string,
  locale: string,
) {
  const id = typeof optionOrId === "string" ? optionOrId : optionOrId.id;
  const localized =
    typeof optionOrId === "string"
      ? getPalworldPassiveSkillDisplayName(id, locale, gameData)
      : optionOrId.label;

  if (localized !== id || !looksLikeInternalId(id)) return localized;
  return humanizeInternalId(id);
}

function safePalLabel(internalId: string, locale: string) {
  const localized = getPalworldDisplayName(internalId, gameData, locale);
  if (localized !== internalId || !looksLikeInternalId(internalId)) {
    return localized;
  }
  return humanizeInternalId(internalId);
}

function looksLikeInternalId(value: string) {
  return /[_]/u.test(value) || /^[A-Z0-9]+_/u.test(value);
}

function humanizeInternalId(value: string) {
  return value
    .replace(/^PAL_/u, "")
    .replace(/_/gu, " ")
    .replace(/([a-z])([A-Z])/gu, "$1 $2")
    .replace(/\bup(\d)\b/giu, "+$1")
    .replace(/\bdown(\d)\b/giu, "-$1")
    .trim();
}

function sortRoutes(routes: readonly PalworldBreedingRoute[] | undefined) {
  return [...(routes ?? [])].sort(
    (left, right) =>
      comparePalworldBreedingRoutes(left, right) ||
      createPalworldFormulaRouteSignature(left).localeCompare(
        createPalworldFormulaRouteSignature(right),
      ),
  );
}

function sortParentBreedingOutcomes(
  outcomes: readonly PalworldParentBreedingOutcome[],
) {
  return [...outcomes].sort((left, right) => {
    const leftPartner = gameData.palsByInternal[left.partnerSpecies];
    const rightPartner = gameData.palsByInternal[right.partnerSpecies];
    return (
      (leftPartner?.minWildLevel ?? Number.MAX_SAFE_INTEGER) -
        (rightPartner?.minWildLevel ?? Number.MAX_SAFE_INTEGER) ||
      (leftPartner?.rarity ?? Number.MAX_SAFE_INTEGER) -
        (rightPartner?.rarity ?? Number.MAX_SAFE_INTEGER) ||
      (leftPartner?.paldeckNumber ?? Number.MAX_SAFE_INTEGER) -
        (rightPartner?.paldeckNumber ?? Number.MAX_SAFE_INTEGER) ||
      left.child.localeCompare(right.child) ||
      left.parentRequiredGender.localeCompare(right.parentRequiredGender) ||
      left.partnerRequiredGender.localeCompare(right.partnerRequiredGender)
    );
  });
}

function waitForNextPaint() {
  if (typeof window === "undefined" || !window.requestAnimationFrame) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });
}

async function readFileBuffer(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === "function") {
    return file.arrayBuffer();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
        return;
      }
      reject(new Error("invalid_file_reader_result"));
    });
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsArrayBuffer(file);
  });
}

async function createPreparedUploadFromFile(file: File, signal: AbortSignal) {
  assertPalworldSaveFileSize(file.size);
  const saveBuffer = await readFileBuffer(file);
  assertPalworldSaveFileSize(saveBuffer.byteLength);
  return parsePalworldSaveInWorker({
    saveBuffer,
    createWorker: () =>
      new Worker(new URL("./save-parser.worker.ts", import.meta.url), {
        type: "module",
      }),
    signal,
  });
}

async function readBreedingRoutesApiError(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error;
  } catch {
    return null;
  }
}

function mapBreedingRoutesApiErrorToKey(status: number, code: string | null) {
  if (status === 413 || code === "payload_too_large") {
    return "error.payload_too_large";
  }
  if (status === 415 || code === "unsupported_content_type") {
    return "error.unsupported_upload";
  }
  if (status === 415 || code === "unsupported_content_encoding") {
    return "error.unsupported_upload";
  }
  if (status >= 500) return "error.api_server";
  if (code === "invalid_query") return "error.invalid_request";
  if (code === "invalid_payload") return "error.invalid_payload";
  return "error.api_unreachable";
}

function FieldLabelIcon({ src }: { src: string }) {
  return (
    <Flex
      as="span"
      w={6}
      h={6}
      flexShrink={0}
      align="center"
      justify="center"
      overflow="hidden"
      borderRadius="sm"
      borderWidth="1px"
      borderColor="rgba(156, 192, 198, 0.4)"
      bg="linear-gradient(145deg, #34464a, #17272d)"
      boxShadow="inset 0 0 0 1px rgba(255, 255, 255, 0.06), 0 2px 5px rgba(3, 20, 25, 0.24)"
      aria-hidden="true"
    >
      <Image src={src} alt="" w="full" h="full" objectFit="contain" />
    </Flex>
  );
}

function QueryModeIcon({ src }: { src: string | null }) {
  if (!src) return null;

  return (
    <Image
      src={src}
      alt=""
      boxSize={{ base: 6, md: 7 }}
      flexShrink={0}
      objectFit="contain"
      filter="drop-shadow(0 1px 1px rgba(3, 20, 25, 0.28))"
      aria-hidden="true"
    />
  );
}

function SaveImportPrompt({
  testId,
  linkTestId,
  prefix,
  linkLabel,
  suffix,
  inventoryExamples,
  disabled,
  onClick,
}: {
  testId: string;
  linkTestId: string;
  prefix?: string;
  linkLabel: string;
  suffix?: string;
  inventoryExamples?: {
    owned: string;
    missing: string;
  };
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <HStack
      data-testid={testId}
      w="full"
      align="flex-start"
      justify="center"
      gap={2.5}
      borderWidth="1px"
      borderStyle="dashed"
      borderColor="var(--palworld-border-strong)"
      borderRadius="sm"
      bg="var(--palworld-surface-a56)"
      px={3}
      py={2.5}
    >
      <AppIcon
        as={FileArchive}
        size="sm"
        mt={0.5}
        flexShrink={0}
        color="var(--palworld-accent-fg)"
        aria-hidden="true"
      />
      <Text
        minW={0}
        color="var(--palworld-fg-muted)"
        fontSize="sm"
        lineHeight="1.55"
        textAlign="center"
      >
        <Box
          as="span"
          className="palworld-save-import-prompt__action"
          display={{ base: "block", md: "inline" }}
          textWrap="balance"
        >
          {prefix}
          <Button
            data-testid={linkTestId}
            type="button"
            variant="plain"
            display="inline"
            h="auto"
            minW={0}
            p={0}
            verticalAlign="baseline"
            whiteSpace="normal"
            textAlign="start"
            lineHeight="inherit"
            color="var(--palworld-accent-fg)"
            fontWeight="900"
            textDecoration="underline"
            textUnderlineOffset="2px"
            disabled={disabled}
            onClick={onClick}
          >
            {linkLabel}
          </Button>
          {suffix ? (
            <Box as="span" ms={1}>
              {suffix}
            </Box>
          ) : null}
        </Box>
        {inventoryExamples ? (
          <Box
            as="span"
            className="palworld-save-import-prompt__examples"
            display="inline-flex"
            alignItems="center"
            gap={2}
            mx={1.5}
            verticalAlign="middle"
            whiteSpace="nowrap"
          >
            <Box as="span" display="inline-flex" alignItems="center" gap={1}>
              <Box
                as="span"
                className="palworld-compact-formula-inventory-count palworld-compact-formula-inventory-count--example"
              >
                ×3
              </Box>
              <Box
                as="span"
                color="var(--palworld-fg)"
                fontSize="xs"
                fontWeight="800"
              >
                {inventoryExamples.owned}
              </Box>
            </Box>
            <Box as="span" display="inline-flex" alignItems="center" gap={1}>
              <Box
                as="span"
                className="palworld-compact-formula-inventory-count palworld-compact-formula-inventory-count--missing palworld-compact-formula-inventory-count--example"
              >
                ×0
              </Box>
              <Box
                as="span"
                color="var(--palworld-fg)"
                fontSize="xs"
                fontWeight="800"
              >
                {inventoryExamples.missing}
              </Box>
            </Box>
          </Box>
        ) : null}
      </Text>
    </HStack>
  );
}

function SwapPalsButton({
  testId,
  label,
  disabled,
  onClick,
}: {
  testId: string;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <AppTooltip content={label}>
      <IconButton
        data-testid={testId}
        type="button"
        aria-label={label}
        size="md"
        boxSize={10}
        minW={10}
        minH={10}
        variant="outline"
        justifySelf="center"
        alignSelf={{ base: "center", lg: "start" }}
        mt={{ base: 0, lg: "1.875rem" }}
        borderRadius={{ base: "full", lg: "sm" }}
        borderColor="var(--palworld-border)"
        bg="var(--palworld-surface)"
        color="var(--palworld-accent-fg)"
        _hover={{
          borderColor: "var(--palworld-accent-border)",
          bg: "var(--palworld-surface-subtle)",
        }}
        disabled={disabled}
        onClick={onClick}
      >
        <AppIcon
          as={ArrowLeftRight}
          size="sm"
          transform={{ base: "rotate(90deg)", lg: "none" }}
          aria-hidden="true"
        />
      </IconButton>
    </AppTooltip>
  );
}

function SearchCombobox({
  id,
  label,
  labelIconSrc,
  showLabel = true,
  placeholder,
  helperText,
  emptyText,
  options,
  value,
  disabled,
  invalid,
  errorText,
  reserveErrorSpace = false,
  inputRef,
  locale,
  onChange,
}: {
  id: string;
  label: string;
  labelIconSrc?: string | null;
  showLabel?: boolean;
  placeholder: string;
  helperText?: string;
  emptyText: string;
  options: readonly SearchOption[];
  value: string | null;
  disabled?: boolean;
  invalid?: boolean;
  errorText?: string;
  reserveErrorSpace?: boolean;
  inputRef?: Ref<HTMLInputElement>;
  locale: string;
  onChange: (value: string | null) => void;
}) {
  const commonT = useTranslations("common");
  const calculatorT = useTranslations("palworld-breeding-calculator");
  const [isTyping, setIsTyping] = useState(false);
  const [query, setQuery] = useState("");
  const [scrollTop, setScrollTop] = useState(0);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const syncContentRef = useCallback(
    (content: HTMLDivElement | null) => {
      contentRef.current = content;
      if (content) content.scrollTop = scrollTop;
    },
    [scrollTop],
  );

  const selectedOption = options.find((option) => option.value === value);
  const selectedInputValue =
    disabled && !value
      ? ""
      : isTyping
        ? query
        : (selectedOption?.selectedLabel ?? selectedOption?.label ?? "");
  const [inputValue, setInputValue] = useState(selectedInputValue);
  useEffect(() => {
    if (!isTyping) setInputValue(selectedInputValue);
  }, [isTyping, selectedInputValue]);
  const selectedAvatarInternalId =
    !isTyping && selectedOption?.avatarInternalId
      ? selectedOption.avatarInternalId
      : null;
  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) return options;
    return options.filter((option) =>
      option.searchText.includes(normalizedQuery),
    );
  }, [options, query]);
  const collection = useMemo(
    () =>
      createListCollection({
        items: filteredOptions,
      }),
    [filteredOptions],
  );
  const itemHeight = 56;
  const virtualRange = getVirtualListRange({
    itemCount: filteredOptions.length,
    itemHeight,
    scrollTop,
    viewportHeight: 320,
    overscan: 2,
  });
  const virtualOptions = filteredOptions.slice(
    virtualRange.startIndex,
    virtualRange.endIndex,
  );

  function scrollToIndex(index: number) {
    const nextScrollTop = Math.max(0, index * itemHeight - 132);
    setScrollTop(nextScrollTop);
  }

  return (
    <Field.Root disabled={disabled} invalid={invalid}>
      {showLabel ? (
        <Field.Label
          htmlFor={id}
          minH={6}
          gap={2}
          color="var(--palworld-fg)"
          fontSize="md"
          fontWeight="800"
          lineHeight="1.5"
        >
          {labelIconSrc ? <FieldLabelIcon src={labelIconSrc} /> : null}
          {label}
        </Field.Label>
      ) : null}
      <Combobox.Root
        collection={collection}
        ids={{ input: id }}
        lazyMount
        unmountOnExit
        value={value ? [value] : []}
        inputValue={inputValue}
        onInputValueChange={(details) => {
          if (details.reason !== "input-change") return;
          setInputValue(details.inputValue);
          setIsTyping(true);
          setQuery(details.inputValue);
          setScrollTop(0);
          if (contentRef.current) contentRef.current.scrollTop = 0;
        }}
        onValueChange={(details) => {
          const nextValue = details.value[0] ?? null;
          const nextOption = options.find(
            (option) => option.value === nextValue,
          );
          setInputValue(nextOption?.selectedLabel ?? nextOption?.label ?? "");
          onChange(nextValue);
          setIsTyping(false);
          setQuery("");
        }}
        onOpenChange={(details) => {
          if (!details.open) {
            setIsTyping(false);
            setQuery("");
            return;
          }
          setQuery("");
          setIsTyping(false);
          const selectedIndex = options.findIndex(
            (option) => option.value === value,
          );
          scrollToIndex(Math.max(0, selectedIndex));
        }}
        onInteractOutside={() => {
          setIsTyping(false);
          setQuery("");
        }}
        openOnClick
        scrollToIndexFn={(details) => scrollToIndex(details.index)}
        size="md"
        width="full"
        positioning={{
          sameWidth: true,
          placement: "bottom-start",
          flip: false,
        }}
      >
        <Combobox.Control>
          <Box position="relative" w="full">
            {selectedAvatarInternalId ? (
              <Box
                position="absolute"
                zIndex={1}
                left={2}
                top="50%"
                transform="translateY(-50%)"
                pointerEvents="none"
              >
                <PalAvatar
                  internalId={selectedAvatarInternalId}
                  locale={locale}
                  size="sm"
                />
              </Box>
            ) : (
              <AppIcon
                as={Search}
                size="sm"
                color="var(--palworld-accent)"
                position="absolute"
                zIndex={1}
                left={3}
                top="50%"
                transform="translateY(-50%)"
                pointerEvents="none"
              />
            )}
            <Combobox.Input asChild>
              <ControlledComboboxInput
                ref={inputRef}
                value={inputValue}
                aria-label={showLabel ? undefined : label}
                aria-describedby={errorText ? `${id}-error` : undefined}
                autoComplete="off"
                placeholder={placeholder}
                ps={selectedAvatarInternalId ? 12 : 9}
                pe={{ base: value ? 22 : 12, md: value ? 16 : 10 }}
                minH={{ base: 12, md: 10 }}
                borderWidth="1px"
                borderColor="var(--palworld-border)"
                bg="var(--palworld-surface-a92)"
                color={
                  selectedAvatarInternalId
                    ? "transparent"
                    : "var(--palworld-fg)"
                }
                fontSize={{ base: "md", md: "sm" }}
                textIndent={selectedAvatarInternalId ? "-9999px" : undefined}
                boxShadow="var(--palworld-inset-highlight)"
                _placeholder={{ color: "var(--palworld-fg-faint)" }}
                _selection={
                  selectedAvatarInternalId ? { bg: "transparent" } : undefined
                }
                _hover={{ borderColor: "var(--palworld-accent-border)" }}
                _focusVisible={{
                  borderColor: "var(--palworld-focus-ring)",
                  boxShadow: "0 0 0 3px var(--palworld-focus-ring)",
                }}
                _invalid={{
                  borderColor: "var(--palworld-error-border)",
                  boxShadow: "0 0 0 1px var(--palworld-error-border)",
                }}
                onFocus={(event) => event.currentTarget.select()}
              />
            </Combobox.Input>
            {selectedAvatarInternalId ? (
              <HStack
                position="absolute"
                zIndex={1}
                left={12}
                right={{ base: 22, md: 16 }}
                top="50%"
                transform="translateY(-50%)"
                gap={2}
                minW={0}
                pointerEvents="none"
                aria-hidden="true"
              >
                <PaldeckBadge internalId={selectedAvatarInternalId} />
                <Text
                  color="var(--palworld-fg)"
                  fontSize={{ base: "md", md: "sm" }}
                  fontWeight="medium"
                  lineClamp={1}
                >
                  {selectedOption?.label}
                </Text>
                {selectedOption?.ownedCount ? (
                  <Badge
                    flexShrink={0}
                    bg="var(--palworld-success-bg)"
                    color="var(--palworld-success-fg)"
                    fontSize="2xs"
                  >
                    {calculatorT("calculator.owned_count", {
                      count: selectedOption.ownedCount,
                    })}
                  </Badge>
                ) : null}
              </HStack>
            ) : null}
            <HStack
              position="absolute"
              zIndex={1}
              right={1.5}
              top="50%"
              transform="translateY(-50%)"
              gap={0.5}
            >
              {value ? (
                <Combobox.ClearTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    minW={{ base: 10, md: 8 }}
                    h={{ base: 10, md: 8 }}
                    px={0}
                    aria-label={`${commonT("clear")} ${label}`}
                  >
                    <AppIcon as={X} size="xs" aria-hidden="true" />
                  </Button>
                </Combobox.ClearTrigger>
              ) : null}
              <Combobox.Trigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  minW={{ base: 10, md: 8 }}
                  h={{ base: 10, md: 8 }}
                  px={0}
                  aria-label={`${commonT("search.select")} ${label}`}
                >
                  <AppIcon as={ChevronDown} size="xs" aria-hidden="true" />
                </Button>
              </Combobox.Trigger>
            </HStack>
          </Box>
        </Combobox.Control>
        <Combobox.Positioner>
          <Combobox.Content
            ref={syncContentRef}
            p={1}
            borderWidth="1px"
            borderColor="var(--palworld-border)"
            borderRadius="md"
            bg="var(--palworld-surface)"
            boxShadow="var(--palworld-popover-shadow)"
            maxH="min(20rem, var(--available-height))"
            overflowY="auto"
            onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
          >
            <Combobox.Empty>
              <Text px={3} py={2} fontSize="sm" color="var(--palworld-fg-soft)">
                {emptyText}
              </Text>
            </Combobox.Empty>
            <Box
              aria-hidden="true"
              role="presentation"
              h={`${virtualRange.paddingTop}px`}
              flexShrink={0}
            />
            {virtualOptions.map((option) => (
              <Combobox.Item
                key={option.value}
                item={option}
                h={`${itemHeight}px`}
                minH={`${itemHeight}px`}
                overflow="hidden"
                borderRadius="md"
                color="var(--palworld-fg)"
                _highlighted={{ bg: "var(--palworld-surface-subtle)" }}
                _disabled={{ opacity: 0.68, cursor: "not-allowed" }}
              >
                <Combobox.ItemText asChild>
                  <HStack gap={2.5} minW={0} align="center">
                    {option.avatarInternalId ? (
                      <PalAvatar
                        internalId={option.avatarInternalId}
                        locale={locale}
                        size="sm"
                      />
                    ) : null}
                    <Stack gap={0.5} minW={0}>
                      <HStack gap={2} minW={0}>
                        {option.avatarInternalId ? (
                          <PaldeckBadge internalId={option.avatarInternalId} />
                        ) : null}
                        <Text fontSize="sm" fontWeight="medium" lineClamp={1}>
                          {option.label}
                        </Text>
                        {option.ownedCount ? (
                          <Badge
                            flexShrink={0}
                            bg="var(--palworld-success-bg)"
                            color="var(--palworld-success-fg)"
                            fontSize="2xs"
                          >
                            {calculatorT("calculator.owned_count", {
                              count: option.ownedCount,
                            })}
                          </Badge>
                        ) : null}
                      </HStack>
                      {option.description ? (
                        <Text
                          fontSize="xs"
                          color="var(--palworld-fg-subtle)"
                          lineClamp={1}
                        >
                          {option.description}
                        </Text>
                      ) : null}
                    </Stack>
                  </HStack>
                </Combobox.ItemText>
                <Combobox.ItemIndicator />
              </Combobox.Item>
            ))}
            <Box
              aria-hidden="true"
              role="presentation"
              h={`${virtualRange.paddingBottom}px`}
              flexShrink={0}
            />
          </Combobox.Content>
        </Combobox.Positioner>
      </Combobox.Root>
      <Box minH={reserveErrorSpace ? 7 : undefined}>
        {errorText ? (
          <Field.ErrorText id={`${id}-error`} mt={1.5} fontSize="sm">
            {errorText}
          </Field.ErrorText>
        ) : helperText ? (
          <Field.HelperText
            mt={1.5}
            fontSize="sm"
            color="var(--palworld-fg-soft)"
            lineHeight="1.55"
          >
            {helperText}
          </Field.HelperText>
        ) : null}
      </Box>
    </Field.Root>
  );
}

function PassiveSkillPickerDialog({
  open,
  options,
  selectedValues,
  locale,
  inputRef,
  finalFocusEl,
  onToggle,
  onClose,
}: {
  open: boolean;
  options: readonly SearchOption[];
  selectedValues: readonly string[];
  locale: string;
  inputRef?: Ref<HTMLInputElement>;
  finalFocusEl?: () => HTMLElement | null;
  onToggle: (passiveId: string) => void;
  onClose: () => void;
}) {
  const t = useTranslations("palworld-breeding-calculator");
  const commonT = useTranslations("common");
  const [query, setQuery] = useState("");
  const [openTierKeys, setOpenTierKeys] = useState(
    () => new Set<PassiveTierKey>(["worldTree", "prismatic", "gold"]),
  );
  const normalizedQuery = normalizeSearchText(query);
  const filteredOptions = useMemo(() => {
    if (!normalizedQuery) return options;
    return options.filter((option) =>
      option.searchText.includes(normalizedQuery),
    );
  }, [normalizedQuery, options]);
  const optionGroups = groupPassiveOptionsByTier(filteredOptions);

  function renderOption(option: SearchOption) {
    const selected = selectedValues.includes(option.value);
    const disabled =
      !selected && selectedValues.length >= MAX_PASSIVE_SELECTION;
    const ownedCount = option.ownedCount;
    const isOwned = typeof ownedCount === "number";
    const ownership = isOwned ? "owned" : "missing";
    const ownershipLabel = isOwned
      ? t("calculator.owned_count", { count: ownedCount })
      : t("calculator.passive_group_missing");
    const passiveLabel = safePassiveLabel(option.value, locale);
    const visual = passiveSkillVisual(option.value);
    const effectExcerpt = createPassiveSkillEffectExcerpt(
      option.description,
      normalizedQuery,
    );

    return (
      <Box key={option.value} className="palworld-passive-choice" minW={0}>
        <Box className="palworld-passive-choice__body" minW={0}>
          <Box className="palworld-passive-choice__surface" minW={0}>
            <Button
              className="palworld-passive-skill"
              style={passiveSkillSurfaceStyle(visual)}
              type="button"
              aria-label={`${passiveLabel} ${ownershipLabel}`}
              aria-pressed={selected}
              variant="plain"
              h="auto"
              minH={0}
              minW={0}
              justifyContent="stretch"
              borderRadius="sm"
              borderWidth={0}
              px={0}
              py={0}
              color={visual.tone.text}
              opacity={disabled ? 0.43 : 1}
              cursor={disabled ? "not-allowed" : "pointer"}
              _focusVisible={{
                outline: `3px solid ${visual.tone.accent}`,
                outlineOffset: "2px",
              }}
              whiteSpace="normal"
              data-passive-rank={visual.rank}
              data-passive-tier={visual.presentation.tier}
              data-passive-ownership={ownership}
              data-passive-motion="interactive"
              disabled={disabled}
              onClick={() => onToggle(option.value)}
            >
              <HStack
                as="span"
                minW={0}
                w="full"
                gap={2}
                justify="space-between"
                align="center"
                h="full"
                ps={3}
                pe={0}
                py={0}
              >
                <Text
                  as="span"
                  minW={0}
                  flex="1"
                  textAlign="left"
                  fontSize="xs"
                  fontWeight="800"
                  lineHeight="1.25"
                  lineClamp={1}
                  overflowWrap="anywhere"
                >
                  {passiveLabel}
                </Text>
                <Box as="span" w={8} flexShrink={0} aria-hidden="true" />
              </HStack>
            </Button>
            {selected ? (
              <span
                className="palworld-passive-skill__selection-frame"
                aria-hidden="true"
              />
            ) : null}
          </Box>
          {normalizedQuery && option.description ? (
            <AppTooltip content={option.description}>
              <Text
                as="span"
                className="palworld-passive-choice__description"
                display="block"
                px={1}
                pt={0.5}
                color="var(--palworld-fg-soft)"
                fontSize="xs"
                lineHeight="1.35"
                lineClamp={2}
                whiteSpace="pre-line"
              >
                {effectExcerpt}
              </Text>
            </AppTooltip>
          ) : null}
        </Box>
        {ownership === "owned" ? (
          <AppTooltip content={ownershipLabel}>
            <Text
              as="span"
              className="palworld-passive-owned-count"
              data-testid="owned-passive-count"
              aria-hidden="true"
            >
              x{ownedCount}
            </Text>
          </AppTooltip>
        ) : null}
      </Box>
    );
  }

  function renderTierGroup(
    tierKey: PassiveTierKey,
    groupOptions: readonly SearchOption[],
  ) {
    if (groupOptions.length === 0) return null;

    const key = tierKey;
    const forceOpen = Boolean(query);
    const open = forceOpen || openTierKeys.has(key);

    return (
      <Collapsible.Root
        key={key}
        open={open}
        lazyMount
        unmountOnExit
        onOpenChange={(details) => {
          if (forceOpen) return;
          setOpenTierKeys((current) => {
            const next = new Set(current);
            if (details.open) next.add(key);
            else next.delete(key);
            return next;
          });
        }}
      >
        <Stack gap={2}>
          <Collapsible.Trigger asChild>
            <Button
              type="button"
              variant="plain"
              h="auto"
              minH={9}
              w="full"
              px={0}
              justifyContent="stretch"
              color="var(--palworld-fg)"
            >
              <HStack justify="space-between" gap={3} w="full">
                <HStack gap={2} minW={0}>
                  <AppIcon
                    as={ChevronDown}
                    size="xs"
                    flexShrink={0}
                    transform={open ? "rotate(180deg)" : "none"}
                    transition="transform 160ms ease"
                    aria-hidden="true"
                  />
                  <Text fontSize="sm" fontWeight="900" lineClamp={1}>
                    {t(`calculator.passive_tier_${tierKey}`)}
                  </Text>
                </HStack>
                <Badge
                  bg="var(--palworld-surface-muted)"
                  color="var(--palworld-accent)"
                >
                  {groupOptions.length}
                </Badge>
              </HStack>
            </Button>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <Box className="palworld-passive-picker-grid">
              {groupOptions.map(renderOption)}
            </Box>
          </Collapsible.Content>
        </Stack>
      </Collapsible.Root>
    );
  }

  function renderTierGroups(groups: Record<PassiveTierKey, SearchOption[]>) {
    return PASSIVE_TIER_KEYS.map((tierKey) =>
      renderTierGroup(tierKey, groups[tierKey]),
    );
  }

  return (
    <Dialog.Root
      open={open}
      finalFocusEl={finalFocusEl}
      onOpenChange={(details) => {
        if (!details.open) onClose();
      }}
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop
          bg="rgba(4, 38, 48, 0.66)"
          _closed={{ pointerEvents: "none" }}
        />
        <Dialog.Positioner
          p={{ base: 0, md: 4 }}
          alignItems={{ base: "stretch", md: "center" }}
        >
          <Dialog.Content
            data-testid="passive-picker-panel"
            maxW={{ base: "none", md: "48rem" }}
            h={{ base: "100dvh", md: "auto" }}
            maxH={{ base: "100dvh", md: "calc(100dvh - 2rem)" }}
            m={0}
            w="full"
            overflow="hidden"
            borderWidth={{ base: 0, md: "1px" }}
            borderColor="var(--palworld-border-muted)"
            borderRadius={{ base: 0, md: "md" }}
            bg="var(--palworld-surface)"
            color="var(--palworld-fg)"
            boxShadow="var(--palworld-popover-shadow)"
          >
            <Dialog.Header
              flexShrink={0}
              borderBottomWidth="1px"
              borderColor="var(--palworld-border-muted)"
            >
              <Stack gap={3} w="full">
                <HStack justify="space-between" gap={3} align="start">
                  <Stack gap={0.5} minW={0}>
                    <Dialog.Title fontSize="lg" fontWeight="900">
                      {t("calculator.passive_count", {
                        count: selectedValues.length,
                      })}
                    </Dialog.Title>
                  </Stack>
                  <Dialog.CloseTrigger asChild>
                    <CloseButton
                      size="sm"
                      aria-label={commonT("close")}
                      color="var(--palworld-accent)"
                    />
                  </Dialog.CloseTrigger>
                </HStack>

                <Box position="relative">
                  <AppIcon
                    as={Search}
                    size="sm"
                    color="var(--palworld-accent)"
                    position="absolute"
                    left={3}
                    top="50%"
                    transform="translateY(-50%)"
                    pointerEvents="none"
                    zIndex={1}
                  />
                  <Input
                    id="palworld-passive-picker-search"
                    ref={inputRef}
                    autoFocus
                    autoComplete="off"
                    value={query}
                    placeholder={t("calculator.passive_placeholder")}
                    ps={9}
                    minH={{ base: 12, md: 10 }}
                    borderColor="var(--palworld-border-strong)"
                    bg="var(--palworld-surface)"
                    color="var(--palworld-fg)"
                    fontSize={{ base: "md", md: "sm" }}
                    _placeholder={{ color: "var(--palworld-fg-faint)" }}
                    _hover={{ borderColor: "var(--palworld-accent-border)" }}
                    _focusVisible={{
                      borderColor: "var(--palworld-focus-ring)",
                      boxShadow: "0 0 0 3px var(--palworld-focus-ring)",
                    }}
                    onChange={(event) => setQuery(event.currentTarget.value)}
                  />
                </Box>
              </Stack>
            </Dialog.Header>

            <Dialog.Body
              flex="1"
              minH={0}
              overflowY="auto"
              overscrollBehavior="contain"
              py={4}
            >
              {filteredOptions.length > 0 ? (
                <Stack
                  className="palworld-passive-picker-results"
                  role="group"
                  aria-label={t("calculator.passives")}
                  gap={4}
                >
                  {renderTierGroups(optionGroups)}
                </Stack>
              ) : (
                <Text
                  px={3}
                  py={5}
                  textAlign="center"
                  fontSize="sm"
                  color="var(--palworld-fg-soft)"
                >
                  {t("combobox.no_results")}
                </Text>
              )}
            </Dialog.Body>

            <Dialog.Footer
              flexShrink={0}
              borderTopWidth="1px"
              borderColor="var(--palworld-border-muted)"
            >
              <HStack justify="space-between" gap={3} w="full" align="center">
                <Text
                  fontSize="xs"
                  color={
                    selectedValues.length >= MAX_PASSIVE_SELECTION
                      ? "var(--palworld-error-fg)"
                      : "var(--palworld-fg-subtle)"
                  }
                >
                  {t("calculator.passive_limit")}
                </Text>
                <Button
                  type="button"
                  size="sm"
                  bg="var(--palworld-accent-solid)"
                  color="var(--palworld-accent-contrast)"
                  borderColor="var(--palworld-accent-border)"
                  _hover={{ bg: "var(--palworld-accent-solid-hover)" }}
                  onClick={onClose}
                >
                  <AppIcon as={CheckCircle2} size="sm" aria-hidden="true" />
                  {t("calculator.passive_done")}
                </Button>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

function PalIconImage({
  fallback,
  onError,
  src,
  ...props
}: Omit<ComponentProps<"img">, "src"> & {
  fallback: ReactNode;
  src: string | null;
}) {
  const [loadFailed, setLoadFailed] = useState(false);

  if (!src || loadFailed) return fallback;

  return (
    <img
      {...props}
      src={src}
      onError={(event) => {
        setLoadFailed(true);
        onError?.(event);
      }}
    />
  );
}

function PalAvatar({
  internalId,
  locale,
  size = "md",
}: {
  internalId: string;
  locale: string;
  size?: "sm" | "md";
}) {
  const label = safePalLabel(internalId, locale);
  const iconSource = palworldIconHref(internalId);
  const boxSize = size === "sm" ? 9 : 14;
  const fontSize = size === "sm" ? "xs" : "sm";

  return (
    <Flex
      w={boxSize}
      h={boxSize}
      flexShrink={0}
      align="center"
      justify="center"
      position="relative"
      overflow="hidden"
      borderRadius="full"
      borderWidth="2px"
      borderColor="rgba(156, 192, 198, 0.32)"
      bg="radial-gradient(circle at 45% 35%, #34464a, #17272d 72%)"
      boxShadow="inset 0 0 0 1px rgba(255, 255, 255, 0.08), 0 3px 8px rgba(3, 20, 25, 0.32)"
      aria-hidden="true"
      data-pal-icon-status={iconSource ? "available" : "missing"}
    >
      <PalIconImage
        key={iconSource?.src ?? internalId}
        src={iconSource?.src ?? null}
        srcSet={iconSource?.srcSet}
        sizes={size === "sm" ? "36px" : "56px"}
        alt=""
        loading="lazy"
        decoding="async"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: "scale(1.08)",
          filter: "drop-shadow(0 2px 1px rgba(3, 18, 22, 0.36))",
        }}
        fallback={
          <Flex
            w="full"
            h="full"
            align="center"
            justify="center"
            fontSize={fontSize}
            fontWeight="900"
            color="var(--palworld-accent-contrast)"
          >
            {label.slice(0, 1).toLocaleUpperCase(locale)}
          </Flex>
        }
      />
    </Flex>
  );
}

function PaldeckBadge({ internalId }: { internalId: string }) {
  const badge = paldeckBadgeText(internalId);
  if (!badge) return null;

  return (
    <Badge
      flexShrink={0}
      bg="rgba(19, 47, 54, 0.92)"
      color="var(--palworld-accent-contrast)"
      borderRadius="sm"
      fontSize="0.68rem"
      px={1.5}
      py={0}
    >
      {badge}
    </Badge>
  );
}

function PalNode({
  internalId,
  locale,
  caption,
  gender,
  compact = false,
  contained = false,
  availability,
  availabilityDetail,
}: {
  internalId: string;
  locale: string;
  caption?: string;
  gender?: PalworldBreedingRouteSource["gender"] | "Any";
  compact?: boolean;
  contained?: boolean;
  availability?: PalworldBreedingRouteParent["availability"];
  availabilityDetail?: string;
}) {
  const t = useTranslations("palworld-breeding-calculator");
  const availabilityView = availability
    ? getParentAvailabilityView(availability, t)
    : null;

  return (
    <HStack
      gap={2.5}
      minW={0}
      flex={
        compact && !contained
          ? { base: "0 0 auto", md: "0 1 13rem" }
          : undefined
      }
      w={contained ? "full" : compact ? { base: "full", md: "auto" } : "full"}
      borderWidth="1px"
      borderStyle={availabilityView?.borderStyle ?? "solid"}
      borderColor={
        availabilityView?.borderColor ?? "var(--palworld-border-soft)"
      }
      bg={availabilityView?.bg ?? "var(--palworld-surface-a72)"}
      borderRadius="md"
      px={2.5}
      py={2}
    >
      <PalAvatar internalId={internalId} locale={locale} />
      <Stack gap={0.5} minW={0} flex="1">
        <HStack gap={1.5} minW={0}>
          <PaldeckBadge internalId={internalId} />
          <Text
            fontSize="sm"
            fontWeight="800"
            color="var(--palworld-fg)"
            lineClamp={1}
          >
            {safePalLabel(internalId, locale)}
          </Text>
          <GenderMarker gender={gender} />
        </HStack>
        {availabilityView ? (
          <HStack gap={1} minW={0} color={availabilityView.color}>
            <AppIcon
              as={availabilityView.icon}
              size="xs"
              flexShrink={0}
              aria-hidden="true"
            />
            <Text
              fontSize="xs"
              fontWeight="900"
              lineHeight="1.3"
              lineClamp={availabilityDetail ? 2 : 1}
              whiteSpace="pre-line"
            >
              {availabilityDetail ?? availabilityView.label}
            </Text>
          </HStack>
        ) : null}
        {caption ? (
          <Text
            fontSize="xs"
            color="var(--palworld-fg-subtle)"
            lineHeight="1.35"
            lineClamp={2}
            overflowWrap="anywhere"
          >
            {caption}
          </Text>
        ) : null}
      </Stack>
    </HStack>
  );
}

function getParentAvailabilityView(
  availability: PalworldBreedingRouteParent["availability"],
  t: ReturnType<typeof useTranslations>,
) {
  if (availability === "owned") {
    return {
      label: t("routes.parent_owned"),
      icon: CheckCircle2,
      color: "var(--palworld-success-fg)",
      borderColor: "var(--palworld-success-border)",
      borderStyle: "solid" as const,
      bg: "var(--palworld-success-bg)",
    };
  }
  if (availability === "owned_incompatible") {
    return {
      label: t("routes.parent_incompatible"),
      icon: CircleAlert,
      color: "var(--palworld-warning-fg)",
      borderColor: "var(--palworld-warning-border)",
      borderStyle: "solid" as const,
      bg: "var(--palworld-warning-bg)",
    };
  }
  if (availability === "missing") {
    return {
      label: t("routes.parent_missing"),
      icon: CircleAlert,
      color: "var(--palworld-error-fg)",
      borderColor: "var(--palworld-error-border)",
      borderStyle: "dashed" as const,
      bg: "var(--palworld-error-bg)",
    };
  }
  if (availability === "intermediate") {
    return {
      label: t("routes.parent_intermediate"),
      icon: Sparkles,
      color: "var(--palworld-info-fg)",
      borderColor: "var(--palworld-info-border)",
      borderStyle: "solid" as const,
      bg: "var(--palworld-info-bg)",
    };
  }
  return {
    label: t("routes.parent_unknown"),
    icon: CircleAlert,
    color: "var(--palworld-fg-soft)",
    borderColor: "var(--palworld-border-strong)",
    borderStyle: "dashed" as const,
    bg: "var(--palworld-surface-a72)",
  };
}

interface PassiveSkillVisual {
  rank: number;
  presentation: PassiveSkillPresentation;
  tone: (typeof PASSIVE_TIER_TONES)[PassiveSkillTier];
}

function passiveSkillVisual(passiveId: string): PassiveSkillVisual {
  const rank = gameData.passiveSkillsByInternal?.[passiveId]?.rank ?? 0;
  const presentation = resolvePassiveSkillPresentation(rank);
  const tone = PASSIVE_TIER_TONES[presentation.tier];
  return {
    rank,
    presentation,
    tone,
  };
}

function passiveSkillSurfaceStyle(visual: PassiveSkillVisual): CSSProperties {
  const passiveSkillBackingImage = passiveSkillAssetBaseHref
    ? `url(${passiveSkillAssetBaseHref}/passive-skill-base-neutral.webp)`
    : null;
  const passiveSkillSurfaceImage = passiveSkillAssetBaseHref
    ? `url(${passiveSkillAssetBaseHref}/${visual.presentation.backgroundAsset})`
    : null;
  const reducedMotionSurfaceImage = passiveSkillAssetBaseHref
    ? `url(${passiveSkillAssetBaseHref}/${visual.presentation.reducedMotionBackgroundAsset})`
    : null;

  return {
    "--palworld-passive-backing": passiveSkillBackingImage ?? "none",
    "--palworld-passive-texture": passiveSkillSurfaceImage ?? "none",
    "--palworld-passive-texture-reduced-motion":
      reducedMotionSurfaceImage ?? "none",
    "--palworld-passive-accent": visual.tone.accent,
  } as CSSProperties;
}

function PassiveSkillContent({
  passiveId,
  locale,
  compact = false,
  count,
}: {
  passiveId: string;
  locale: string;
  compact?: boolean;
  count?: number;
}) {
  return (
    <HStack
      className="palworld-passive-skill__content"
      gap={0}
      minW={0}
      flex="1"
      align="stretch"
    >
      <Box
        as="span"
        className="palworld-passive-skill__label"
        display="flex"
        minW={0}
        flex="1"
        flexDirection="column"
        alignItems="stretch"
        justifyContent="center"
        px={compact ? 2 : 2.5}
      >
        <Text
          as="span"
          minW={0}
          textAlign="left"
          fontSize={compact ? "sm" : "md"}
          fontWeight="800"
          lineHeight="1.2"
          lineClamp={compact ? 1 : 2}
          overflowWrap="anywhere"
        >
          {safePassiveLabel(passiveId, locale)}
        </Text>
      </Box>
      {typeof count === "number" ? (
        <Badge
          flexShrink={0}
          minW={7}
          alignSelf="center"
          me={1.5}
          justifyContent="center"
          bg="rgba(255, 255, 255, 0.14)"
          color="inherit"
          borderColor="rgba(255, 255, 255, 0.24)"
        >
          <AppIcon as={CheckCircle2} size="xs" aria-hidden="true" />×{count}
        </Badge>
      ) : null}
      <Box
        as="span"
        className="palworld-passive-skill__rank"
        w={compact ? 9 : 10}
        flexShrink={0}
        aria-hidden="true"
      />
    </HStack>
  );
}

function PassiveTag({
  passiveId,
  locale,
  count,
}: {
  passiveId: string;
  locale: string;
  count?: number;
}) {
  const visual = passiveSkillVisual(passiveId);

  return (
    <Box
      as="span"
      className="palworld-passive-skill"
      style={passiveSkillSurfaceStyle(visual)}
      display="inline-flex"
      minW={0}
      minH={8}
      alignItems="center"
      borderRadius="sm"
      px={0}
      py={0}
      alignSelf="flex-start"
      color={visual.tone.text}
      data-passive-rank={visual.rank}
      data-passive-tier={visual.presentation.tier}
      data-passive-motion="static"
    >
      <PassiveSkillContent
        passiveId={passiveId}
        locale={locale}
        compact
        count={count}
      />
    </Box>
  );
}

function RouteRequirements({
  route,
  locale,
}: {
  route: PalworldBreedingRoute;
  locale: string;
}) {
  const t = useTranslations("palworld-breeding-calculator");
  const missingPassiveRequirements = route.requirements.filter(
    (
      requirement,
    ): requirement is Extract<
      PalworldBreedingRouteRequirement,
      { type: "missing_passive" }
    > => requirement.type === "missing_passive",
  );
  const otherRequirements = route.requirements.filter(
    (requirement) => requirement.type !== "missing_passive",
  );

  if (route.requirements.length === 0) return null;

  return (
    <Stack
      data-testid="route-requirements"
      gap={3}
      borderWidth="1px"
      borderStyle="solid"
      borderColor="var(--palworld-error-border-soft)"
      borderRadius="md"
      bg="var(--palworld-surface-a72)"
      p={3}
    >
      <HStack gap={2} align="center" color="var(--palworld-error-fg)">
        <AppIcon as={CircleAlert} size="sm" flexShrink={0} aria-hidden="true" />
        <Text fontSize="sm" fontWeight="900">
          {t("routes.requirements_title")}
        </Text>
        <Badge
          ms="auto"
          bg="var(--palworld-surface-a72)"
          color="var(--palworld-error-fg-soft)"
          borderColor="var(--palworld-error-border-soft)"
        >
          ×{route.complexity.blockerCount}
        </Badge>
      </HStack>

      <Stack gap={3}>
        {otherRequirements.map((requirement, index) => (
          <Box key={`${requirement.type}-${index}`} minW={0}>
            <RouteRequirementItem
              route={route}
              requirement={requirement}
              locale={locale}
            />
          </Box>
        ))}
        {missingPassiveRequirements.length > 0 ? (
          <Stack gap={1.5} minW={0}>
            <Text
              fontSize="xs"
              fontWeight="900"
              color="var(--palworld-error-fg)"
            >
              {t("routes.missing_passive")}
            </Text>
            <HStack gap={3} align="start" flexWrap="wrap">
              {missingPassiveRequirements.map((requirement) => (
                <RouteRequirementItem
                  key={requirement.passiveId}
                  route={route}
                  requirement={requirement}
                  locale={locale}
                />
              ))}
            </HStack>
          </Stack>
        ) : null}
      </Stack>
    </Stack>
  );
}

function RouteRequirementItem({
  route,
  requirement,
  locale,
}: {
  route: PalworldBreedingRoute;
  requirement: PalworldBreedingRouteRequirement;
  locale: string;
}) {
  const t = useTranslations("palworld-breeding-calculator");

  if (requirement.type === "missing_parent") {
    return (
      <HStack gap={2.5} align="start" minW={0}>
        <AppIcon
          as={CircleAlert}
          size="sm"
          mt={0.5}
          color="var(--palworld-error-fg)"
          flexShrink={0}
          aria-hidden="true"
        />
        <Stack gap={0.5} minW={0}>
          <Text fontSize="xs" fontWeight="900" color="var(--palworld-error-fg)">
            {t("routes.parent_missing")}
          </Text>
          <HStack gap={1.5} minW={0} flexWrap="wrap">
            <Text fontSize="sm" fontWeight="800" color="var(--palworld-fg)">
              {safePalLabel(requirement.species, locale)}
            </Text>
            <GenderMarker gender={requirement.requiredGender} />
            {requirement.quantity > 1 ? (
              <Badge
                bg="var(--palworld-error-bg)"
                color="var(--palworld-error-fg)"
                borderColor="var(--palworld-error-border)"
              >
                ×{requirement.quantity}
              </Badge>
            ) : null}
            <Text fontSize="xs" color="var(--palworld-fg-muted)">
              {genderLabel(requirement.requiredGender, t)}
            </Text>
          </HStack>
        </Stack>
      </HStack>
    );
  }

  if (requirement.type === "missing_passive") {
    return <PassiveTag passiveId={requirement.passiveId} locale={locale} />;
  }

  if (requirement.itemId === "PalGenderReverse") {
    const itemLabel = t("routes.gender_reverse_item", {
      quantity: requirement.quantity,
    });
    const targetSource = requirement.target.sourceId
      ? route.sources.find(
          (source) => source.id === requirement.target.sourceId,
        )
      : undefined;
    return (
      <Stack gap={1.5} minW={0}>
        <Text fontSize="sm" fontWeight="900" color="var(--palworld-fg)">
          {itemLabel}
        </Text>
        <Text fontSize="xs" color="var(--palworld-fg-muted)" lineHeight="1.5">
          {t("routes.gender_reverse_target", {
            pal: safePalLabel(requirement.target.species, locale),
            step: requirement.target.stepIndex + 1,
            parent: requirement.target.parentPosition,
            gender: genderLabel(requirement.target.requiredGender, t),
          })}
        </Text>
        {targetSource ? (
          <Text fontSize="xs" color="var(--palworld-fg-muted)" lineHeight="1.5">
            {sourceLocationLabel(targetSource.slot, t)}
          </Text>
        ) : null}
        <RequirementOffers requirement={requirement} itemLabel={itemLabel} />
      </Stack>
    );
  }

  if (requirement.itemId === "passive_implant") {
    const itemLabel = t("routes.passive_implant_item", {
      passive: safePassiveLabel(requirement.target.passiveId, locale),
      quantity: requirement.quantity,
    });
    return (
      <Stack gap={1.5} minW={0}>
        <Text fontSize="sm" fontWeight="900" color="var(--palworld-fg)">
          {itemLabel}
        </Text>
        <PassiveTag passiveId={requirement.target.passiveId} locale={locale} />
        <RequirementOffers requirement={requirement} itemLabel={itemLabel} />
      </Stack>
    );
  }

  return null;
}

function RequirementOffers({
  requirement,
  itemLabel,
}: {
  requirement: Extract<PalworldBreedingRouteRequirement, { type: "use_item" }>;
  itemLabel: string;
}) {
  const t = useTranslations("palworld-breeding-calculator");

  if (requirement.offers.length === 0) return null;

  return (
    <Stack gap={1}>
      {requirement.offers.map((offer) => {
        const purchaseLabel = t("routes.implant_purchase", {
          vendor: t(`routes.implant_vendors.${offer.vendor}`),
          cost: offer.cost,
          currency: t(`routes.implant_currencies.${offer.currency}`),
        });
        return (
          <HStack
            key={`${offer.vendor}-${offer.currency}-${offer.cost}-${offer.sourceUrl}`}
            gap={1.5}
            align="start"
            minW={0}
            color="var(--palworld-info-fg)"
          >
            <AppIcon
              as={Store}
              size="xs"
              mt={0.5}
              flexShrink={0}
              aria-hidden="true"
            />
            <Link
              href={offer.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${itemLabel}. ${purchaseLabel}`}
            >
              <Text
                as="span"
                fontSize="xs"
                fontWeight="800"
                lineHeight="1.5"
                textDecoration="underline"
                textUnderlineOffset="2px"
              >
                {purchaseLabel}
              </Text>
            </Link>
          </HStack>
        );
      })}
    </Stack>
  );
}

function FittedPassiveSkillLabel({
  label,
  locale,
}: {
  label: string;
  locale: string;
}) {
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const [fontSize, setFontSize] = useState<number>(PASSIVE_LABEL_FONT_SIZES[0]);

  useLayoutEffect(() => {
    const labelElement = labelRef.current;
    if (!labelElement) return;

    let active = true;
    const fitLabel = () => {
      const style = window.getComputedStyle(labelElement);
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) return;

      context.font = `${style.fontStyle} ${style.fontWeight} 14px ${style.fontFamily}`;
      const availableWidth =
        labelElement.clientWidth -
        Number.parseFloat(style.paddingInlineStart || "0") -
        Number.parseFloat(style.paddingInlineEnd || "0");
      const measuredWidth = context.measureText(label).width;
      const nextFontSize =
        PASSIVE_LABEL_FONT_SIZES.find(
          (candidate) =>
            (measuredWidth * candidate) / PASSIVE_LABEL_FONT_SIZES[0] <=
            availableWidth,
        ) ?? PASSIVE_LABEL_FONT_SIZES.at(-1)!;

      if (active) setFontSize(nextFontSize);
    };

    fitLabel();
    const resizeObserver = new ResizeObserver(fitLabel);
    resizeObserver.observe(labelElement);
    void document.fonts?.ready.then(fitLabel);

    return () => {
      active = false;
      resizeObserver.disconnect();
    };
  }, [label]);

  return (
    <AppTooltip content={label}>
      <span
        ref={labelRef}
        className="palworld-passive-skill__fitted-label"
        lang={locale}
        style={{ fontSize: `${fontSize}px` }}
      >
        {label}
      </span>
    </AppTooltip>
  );
}

function SelectedPassiveSkill({
  passiveId,
  locale,
  disabled,
  readOnly,
  onSelect,
  onRemove,
}: {
  passiveId: string;
  locale: string;
  disabled: boolean;
  readOnly?: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const commonT = useTranslations("common");
  const visual = passiveSkillVisual(passiveId);
  const label = safePassiveLabel(passiveId, locale);

  return (
    <Box
      data-testid="target-passive-slot"
      className="palworld-selected-passive"
      minW={0}
    >
      <HStack
        data-testid="selected-passive-skill"
        className="palworld-passive-skill"
        style={passiveSkillSurfaceStyle(visual)}
        minW={0}
        gap={0}
        borderRadius="sm"
        ps={0}
        pe={0}
        py={0}
        color={visual.tone.text}
        data-passive-rank={visual.rank}
        data-passive-tier={visual.presentation.tier}
        data-passive-motion="interactive"
        data-disabled={disabled ? "" : undefined}
      >
        <Button
          type="button"
          variant="plain"
          minW={0}
          flex="1"
          h="full"
          minH={0}
          alignSelf="stretch"
          justifyContent="stretch"
          ps={3}
          pe={0}
          color="inherit"
          disabled={disabled || readOnly}
          onClick={onSelect}
        >
          <FittedPassiveSkillLabel label={label} locale={locale} />
        </Button>
        <Box as="span" w={6} flexShrink={0} aria-hidden="true" />
      </HStack>
      {readOnly ? (
        <Box as="span" w={8} h={8} aria-hidden="true" />
      ) : (
        <Button
          data-testid="selected-passive-remove"
          type="button"
          variant="plain"
          size="xs"
          minW={8}
          w={8}
          h={8}
          px={0}
          alignSelf="center"
          borderWidth="1px"
          borderColor="var(--palworld-border)"
          borderRadius="sm"
          bg="var(--palworld-surface-a82)"
          color="var(--palworld-error-fg-emphasis)"
          _hover={{
            borderColor: "var(--palworld-error-border)",
            bg: "var(--palworld-error-bg)",
          }}
          aria-label={`${commonT("clear")} ${label}`}
          disabled={disabled}
          onClick={onRemove}
        >
          <AppIcon as={X} size="xs" aria-hidden="true" />
        </Button>
      )}
    </Box>
  );
}

function genderLabel(
  gender: PalworldBreedingRouteSource["gender"] | "Any",
  t: ReturnType<typeof useTranslations>,
) {
  if (gender === "Male") return t("gender.male");
  if (gender === "Female") return t("gender.female");
  if (gender === "Any") return t("gender.any");
  return t("gender.unknown");
}

function GenderMarker({
  gender,
}: {
  gender?: PalworldBreedingRouteSource["gender"] | "Any";
}) {
  const t = useTranslations("palworld-breeding-calculator");
  if (gender !== "Male" && gender !== "Female") return null;

  const label = genderLabel(gender, t);
  return (
    <AppTooltip content={label}>
      <Box
        as="span"
        role="img"
        aria-label={label}
        display="inline-flex"
        alignItems="center"
        flexShrink={0}
        color={gender === "Male" ? "#3188c9" : "#e35f91"}
      >
        <AppIcon
          as={gender === "Male" ? Mars : Venus}
          size="sm"
          aria-hidden="true"
        />
      </Box>
    </AppTooltip>
  );
}

function sourceLocationLabel(
  slot: string | undefined,
  t: ReturnType<typeof useTranslations>,
) {
  if (!slot) return t("routes.no_slot");
  const match = /^(party|palbox|base|other):(.*)$/u.exec(slot);
  if (!match) return t("routes.slot", { slot });
  if (match[1] === "palbox") {
    const position = getPalboxSlotPosition(match[2]);
    if (position) {
      return t("routes.location_palbox_position", {
        page: position.page,
        row: position.row,
        column: position.column,
      });
    }
  }
  const displaySlot =
    match[1] === "palbox" ? match[2] : getDisplayContainerSlot(match[2]);
  return t(`routes.location_${match[1]}`, { slot: displaySlot });
}

function RouteParentNode({
  parent,
  route,
  locale,
  desiredPassiveIds,
}: {
  parent: PalworldBreedingRouteParent;
  route: PalworldBreedingRoute;
  locale: string;
  desiredPassiveIds: readonly string[];
}) {
  const t = useTranslations("palworld-breeding-calculator");
  const source = parent.sourceId
    ? route.sources.find((candidate) => candidate.id === parent.sourceId)
    : undefined;
  const contributedPassives = source
    ? desiredPassiveIds.filter((passiveId) =>
        source.passiveIds.includes(passiveId),
      )
    : [];
  const ownedSourceLocation =
    parent.availability === "owned" && source
      ? sourceLocationLabel(source.slot, t)
      : undefined;
  return (
    <Stack gap={1.5} minW={0} w="full">
      <PalNode
        internalId={parent.species}
        locale={locale}
        gender={source?.gender}
        compact
        contained
        availability={parent.availability}
        availabilityDetail={ownedSourceLocation}
      />
      {contributedPassives.length > 0 ? (
        <HStack gap={1} flexWrap="wrap" px={0.5}>
          {contributedPassives.map((passiveId) => (
            <PassiveTag
              key={`${parent.sourceId}-${passiveId}`}
              passiveId={passiveId}
              locale={locale}
            />
          ))}
        </HStack>
      ) : null}
    </Stack>
  );
}

function RouteSourceDetails({
  route,
  locale,
}: {
  route: PalworldBreedingRoute;
  locale: string;
}) {
  const t = useTranslations("palworld-breeding-calculator");
  const ownedSourcesById = useContext(OwnedRouteSourcesContext);
  const alternativeSourceSets = (route.alternativeSourceIdSets ?? [])
    .map((sourceIds) => {
      const sources = sourceIds.map((sourceId) =>
        ownedSourcesById.get(sourceId),
      );
      return sources.every(
        (source): source is PalworldBreedingRouteSource => source != null,
      )
        ? sources
        : [];
    })
    .filter((sources) => sources.length > 0);
  const alternativeCount =
    route.alternativeCount ?? alternativeSourceSets.length;

  if (alternativeSourceSets.length === 0) return null;

  return (
    <Box asChild>
      <details data-testid="route-source-details">
        <HStack
          as="summary"
          gap={2}
          minH={10}
          px={3}
          py={2}
          cursor="pointer"
          borderWidth="1px"
          borderColor="var(--palworld-border-muted)"
          borderRadius="md"
          bg="var(--palworld-surface-a62)"
          color="var(--palworld-fg-muted)"
          _hover={{ bg: "var(--palworld-surface-a82)" }}
        >
          <Text flex="1" fontSize="xs" fontWeight="800">
            {t("routes.sources_with_alternatives", {
              count: alternativeCount,
            })}
          </Text>
          <AppIcon as={ChevronDown} size="xs" aria-hidden="true" />
        </HStack>

        <Stack gap={2} mt={3}>
          {alternativeSourceSets.map((sources) => (
            <SimpleGrid
              key={JSON.stringify(sources.map((source) => source.id))}
              columns={{ base: 1, md: 2 }}
              gap={2}
              p={2}
              borderWidth="1px"
              borderColor="var(--palworld-border-muted)"
              borderRadius="sm"
              bg="var(--palworld-canvas-surface-subtle)"
            >
              {sources.map((source) => (
                <HStack key={source.id} gap={2} minW={0}>
                  <CompactPal internalId={source.species} locale={locale} />
                  <GenderMarker gender={source.gender} />
                  <Text
                    ms="auto"
                    minW={0}
                    fontSize="xs"
                    color="var(--palworld-fg-subtle)"
                    textAlign="end"
                    whiteSpace="pre-line"
                    lineClamp={2}
                  >
                    {sourceLocationLabel(source.slot, t)}
                  </Text>
                </HStack>
              ))}
            </SimpleGrid>
          ))}
          {route.hasMoreAlternatives ? (
            <Text
              fontSize="xs"
              color="var(--palworld-fg-subtle)"
              lineHeight="1.55"
            >
              {t("routes.alternatives_limited", {
                count: alternativeSourceSets.length,
              })}
            </Text>
          ) : null}
        </Stack>
      </details>
    </Box>
  );
}

function BreedingEquationOperator({ operator }: { operator: "+" | "=" }) {
  return (
    <Text
      as="span"
      w={6}
      flex="0 0 1.5rem"
      alignSelf="center"
      color={
        operator === "+"
          ? "var(--palworld-accent-emphasis)"
          : "var(--palworld-accent)"
      }
      fontSize="md"
      fontWeight="900"
      lineHeight="1"
      textAlign="center"
    >
      {operator}
    </Text>
  );
}

function FormulaRouteCard({
  route,
  locale,
  recommended,
  desiredPassiveIds,
}: {
  route: PalworldBreedingRoute;
  locale: string;
  recommended: boolean;
  desiredPassiveIds: readonly string[];
}) {
  const t = useTranslations("palworld-breeding-calculator");

  return (
    <Box
      data-route-mode="formula"
      borderWidth="1px"
      borderColor={
        recommended
          ? "var(--palworld-recommended-border)"
          : "var(--palworld-border-soft)"
      }
      bg={
        recommended
          ? "var(--palworld-recommended-bg)"
          : "var(--palworld-surface)"
      }
      borderRadius="md"
      p={{ base: 3, md: 4 }}
      boxShadow={
        recommended
          ? "var(--palworld-recommended-shadow)"
          : "var(--palworld-route-shadow)"
      }
    >
      <Stack gap={3}>
        {recommended || desiredPassiveIds.length > 0 ? (
          <HStack gap={2} flexWrap="wrap">
            {recommended ? (
              <Badge
                bg="var(--palworld-recommended-solid)"
                color="var(--palworld-accent-contrast)"
              >
                {t("routes.recommended")}
              </Badge>
            ) : null}
            {desiredPassiveIds.map((passiveId) => (
              <PassiveTag
                key={`formula-${passiveId}`}
                passiveId={passiveId}
                locale={locale}
              />
            ))}
          </HStack>
        ) : null}

        <Stack gap={2}>
          {route.steps.map((step, index) => (
            <Flex
              key={`${step.child}-${step.parent1.species}-${step.parent2.species}-${index}`}
              gap={2}
              align="center"
              direction={{ base: "column", md: "row" }}
            >
              <Box minW={0} flex="1 1 0" w="full">
                <PalNode
                  internalId={step.parent1.species}
                  locale={locale}
                  gender={step.parent1.requiredGender}
                  compact
                  contained
                />
              </Box>
              <BreedingEquationOperator operator="+" />
              <Box minW={0} flex="1 1 0" w="full">
                <PalNode
                  internalId={step.parent2.species}
                  locale={locale}
                  gender={step.parent2.requiredGender}
                  compact
                  contained
                />
              </Box>
              <BreedingEquationOperator operator="=" />
              <Box minW={0} flex="1 1 0" w="full">
                <PalNode
                  internalId={step.child}
                  locale={locale}
                  compact
                  contained
                />
              </Box>
            </Flex>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}

function RouteCard({
  route,
  locale,
  recommended,
  mode,
  desiredPassiveIds,
}: {
  route: PalworldBreedingRoute;
  locale: string;
  recommended: boolean;
  mode: CalculationMode;
  desiredPassiveIds: readonly string[];
}) {
  const t = useTranslations("palworld-breeding-calculator");
  const isFormulaMode = mode === "formula";

  if (isFormulaMode) {
    return (
      <FormulaRouteCard
        route={route}
        locale={locale}
        recommended={recommended}
        desiredPassiveIds={desiredPassiveIds}
      />
    );
  }

  const summary = summarizePalworldBreedingRoute(route);

  return (
    <Box
      data-route-group={route.group}
      borderWidth="1px"
      borderColor={
        recommended
          ? "var(--palworld-recommended-border)"
          : "var(--palworld-border-soft)"
      }
      bg={
        recommended
          ? "var(--palworld-recommended-route-bg)"
          : "var(--palworld-route-bg)"
      }
      borderRadius="md"
      p={{ base: 3, md: 4 }}
      boxShadow={
        recommended
          ? "var(--palworld-recommended-shadow)"
          : "var(--palworld-route-shadow)"
      }
    >
      <Stack gap={4}>
        <HStack justify="space-between" align="start" gap={3} flexWrap="wrap">
          <HStack gap={2} flexWrap="wrap">
            {recommended ? (
              <Badge
                bg="var(--palworld-recommended-solid)"
                color="var(--palworld-accent-contrast)"
              >
                {summary.isExecutable
                  ? t("routes.recommended")
                  : t("routes.closest")}
              </Badge>
            ) : null}
            <Badge
              bg={
                route.group === "parents_owned"
                  ? "var(--palworld-success-bg)"
                  : "var(--palworld-error-bg)"
              }
              color={
                route.group === "parents_owned"
                  ? "var(--palworld-success-fg-strong)"
                  : "var(--palworld-error-fg-soft)"
              }
              borderWidth="1px"
              borderColor={
                route.group === "parents_owned"
                  ? "var(--palworld-success-border-soft)"
                  : "var(--palworld-error-border-soft)"
              }
            >
              {route.group === "parents_owned"
                ? t("routes.parents_owned_status")
                : t("routes.needs_supplement_status", {
                    count: summary.blockerCount,
                  })}
            </Badge>
            <Badge
              bg="var(--palworld-info-bg)"
              color="var(--palworld-info-fg)"
              borderColor="var(--palworld-info-border)"
            >
              {t("routes.step_count", { count: summary.stepCount })}
            </Badge>
          </HStack>
        </HStack>

        <RouteRequirements route={route} locale={locale} />

        <Stack gap={2}>
          <Text fontSize="sm" fontWeight="semibold">
            {t("routes.steps")}
          </Text>
          <Stack gap={2}>
            {route.steps.map((step, index) => (
              <Box
                key={`${step.child}-${step.parent1.species}-${step.parent2.species}-${index}`}
                borderWidth="1px"
                borderColor="var(--palworld-border-muted)"
                bg="var(--palworld-surface-a62)"
                borderRadius="md"
                p={2.5}
              >
                <HStack gap={2} mb={2}>
                  <Badge
                    bg="var(--palworld-accent-solid)"
                    color="var(--palworld-accent-contrast)"
                  >
                    {t("routes.step_label", { index: index + 1 })}
                  </Badge>
                </HStack>
                <Box
                  display={{ base: "flex", xl: "grid" }}
                  flexDirection="column"
                  gridTemplateColumns="minmax(0, 1fr) 1.5rem minmax(0, 1fr) 1.5rem minmax(0, 1fr)"
                  gap={2}
                  alignItems={{ base: "stretch", xl: "center" }}
                >
                  <RouteParentNode
                    parent={step.parent1}
                    route={route}
                    locale={locale}
                    desiredPassiveIds={desiredPassiveIds}
                  />
                  <BreedingEquationOperator operator="+" />
                  <RouteParentNode
                    parent={step.parent2}
                    route={route}
                    locale={locale}
                    desiredPassiveIds={desiredPassiveIds}
                  />
                  <BreedingEquationOperator operator="=" />
                  <PalNode
                    internalId={step.child}
                    locale={locale}
                    caption={
                      index === route.steps.length - 1
                        ? t("routes.final_child")
                        : t("routes.intermediate")
                    }
                    compact
                    contained
                  />
                </Box>
              </Box>
            ))}
          </Stack>
        </Stack>

        <RouteSourceDetails route={route} locale={locale} />
      </Stack>
    </Box>
  );
}

function RouteCollection({
  routes,
  locale,
  mode,
  desiredPassiveIds,
  query,
  searchMeta,
  recommendedRouteKeys,
}: {
  routes: readonly PalworldBreedingRoute[];
  locale: string;
  mode: CalculationMode;
  desiredPassiveIds: readonly string[];
  query: string;
  searchMeta: PalworldBreedingRoutesResponse["searchMeta"];
  recommendedRouteKeys: ReadonlySet<string>;
}) {
  const t = useTranslations("palworld-breeding-calculator");
  const recommendedInventoryGroup = routes.find(
    (route) =>
      recommendedRouteKeys.has(createPalworldRouteExecutionSignature(route)) &&
      (route.group === "parents_owned" || route.group === "needs_supplement"),
  )?.group as InventoryRouteGroupKey | undefined;
  const [selectedInventoryGroup, setSelectedInventoryGroup] =
    useState<InventoryRouteGroupKey>(
      recommendedInventoryGroup ?? "parents_owned",
    );
  const normalizedQuery = normalizeResultsSearchText(query);
  const matchingRoutes = filterBreedingRoutesBySearch(
    routes,
    mode,
    query,
    locale,
  );
  const inventoryGroupKeys = ["parents_owned", "needs_supplement"] as const;

  if (mode === "formula") {
    if (matchingRoutes.length === 0) {
      return (
        <Text color="var(--palworld-canvas-fg-muted)" fontSize="sm">
          {t("results.no_matching_routes")}
        </Text>
      );
    }

    return (
      <Stack gap={3}>
        <div
          data-testid="formula-route-list"
          className="palworld-formula-result-grid"
        >
          {matchingRoutes.map((route) => (
            <CompactFormulaRouteRow
              key={createPalworldFormulaRouteSignature(route)}
              route={route}
              locale={locale}
            />
          ))}
        </div>
      </Stack>
    );
  }

  const inventoryGroups = inventoryGroupKeys.map((key) => ({
    key,
    routes: matchingRoutes.filter((route) => route.group === key),
  }));
  const selectedInventoryGroupData = inventoryGroups.find(
    (group) => group.key === selectedInventoryGroup,
  );
  const activeInventoryGroup =
    (selectedInventoryGroupData?.routes.length
      ? selectedInventoryGroupData
      : undefined) ??
    inventoryGroups.find((group) => group.routes.length > 0) ??
    selectedInventoryGroupData ??
    inventoryGroups[0]!;
  const prioritizedRoutes = activeInventoryGroup.routes.slice(
    0,
    INVENTORY_PRIORITY_ROUTE_COUNT,
  );
  const groupContent =
    prioritizedRoutes.length === 0 ? (
      <Text color="var(--palworld-canvas-fg-muted)" fontSize="sm">
        {t("results.no_matching_routes")}
      </Text>
    ) : (
      <InventoryRouteBrowser
        key={`${activeInventoryGroup.key}:${normalizedQuery}:${routes.length}`}
        routes={prioritizedRoutes}
        totalRouteCount={activeInventoryGroup.routes.length}
        locale={locale}
        mode={mode}
        desiredPassiveIds={desiredPassiveIds}
        recommendedRouteKeys={recommendedRouteKeys}
      />
    );

  return (
    <Stack gap={4}>
      <Tabs.Root
        data-testid="inventory-route-tabs"
        value={activeInventoryGroup.key}
        lazyMount
        unmountOnExit
        onValueChange={(details) =>
          setSelectedInventoryGroup(details.value as InventoryRouteGroupKey)
        }
      >
        <Box
          data-testid="inventory-route-tab-list"
          w="full"
          minW={0}
          borderWidth="1px"
          borderColor="var(--palworld-canvas-border)"
          borderRadius="md"
          bg="var(--palworld-canvas)"
          p={1}
        >
          <Tabs.List
            aria-label={t("results.inventory_groups_label")}
            display="grid"
            gridTemplateColumns="repeat(2, minmax(0, 1fr))"
            w="full"
            minW={0}
            gap={1}
            borderBottomWidth="0"
          >
            {inventoryGroups.map((group) => (
              <Tabs.Trigger
                key={group.key}
                value={group.key}
                disabled={group.routes.length === 0}
                minW={0}
                w="full"
                minH={11}
                px={{ base: 2, md: 3 }}
                gap={1.5}
                justifyContent="center"
                borderRadius="sm"
                color="var(--palworld-canvas-fg-muted)"
                fontSize={{ base: "xs", md: "sm" }}
                fontWeight="900"
                lineHeight="1.3"
                textAlign="center"
                whiteSpace="normal"
                _selected={{
                  bg:
                    group.routes.length === 0
                      ? "transparent"
                      : "var(--palworld-tab-selected-bg)",
                  color:
                    group.routes.length === 0
                      ? "var(--palworld-canvas-fg-muted)"
                      : "var(--palworld-fg)",
                }}
                _hover={{
                  bg:
                    group.routes.length === 0
                      ? "transparent"
                      : "var(--palworld-tab-selected-hover-bg)",
                  color:
                    group.routes.length === 0
                      ? "var(--palworld-canvas-fg-muted)"
                      : "var(--palworld-fg)",
                }}
                _disabled={{
                  opacity: 0.5,
                  cursor: "not-allowed",
                }}
              >
                <Text as="span" minW={0} lineClamp={2}>
                  {t(`results.groups.${group.key}`)} ({group.routes.length})
                </Text>
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </Box>
        <Tabs.Content
          key={activeInventoryGroup.key}
          value={activeInventoryGroup.key}
          pt={3}
        >
          {groupContent}
        </Tabs.Content>
      </Tabs.Root>
      <ExcludedRouteNotice searchMeta={searchMeta} />
    </Stack>
  );
}

function InventoryRouteBrowser({
  routes,
  totalRouteCount,
  locale,
  mode,
  desiredPassiveIds,
  recommendedRouteKeys,
}: {
  routes: readonly PalworldBreedingRoute[];
  totalRouteCount: number;
  locale: string;
  mode: CalculationMode;
  desiredPassiveIds: readonly string[];
  recommendedRouteKeys: ReadonlySet<string>;
}) {
  const t = useTranslations("palworld-breeding-calculator");
  const defaultRoute =
    routes.find((route) =>
      recommendedRouteKeys.has(createPalworldRouteExecutionSignature(route)),
    ) ?? routes[0];
  const [selectedRouteKey, setSelectedRouteKey] = useState(
    defaultRoute ? createPalworldRouteExecutionSignature(defaultRoute) : "",
  );
  const [mobileRouteDetailOpen, setMobileRouteDetailOpen] = useState(false);
  const selectedRouteButtonRef = useRef<HTMLButtonElement | null>(null);
  const routeDetailRef = useRef<HTMLDivElement | null>(null);
  const backButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileRouteNavigationStartedRef = useRef(false);
  const selectedRoute =
    routes.find(
      (route) =>
        createPalworldRouteExecutionSignature(route) === selectedRouteKey,
    ) ?? defaultRoute;
  const selectedRouteSignature = selectedRoute
    ? createPalworldRouteExecutionSignature(selectedRoute)
    : "";

  useEffect(() => {
    if (!mobileRouteNavigationStartedRef.current) return;

    const target = mobileRouteDetailOpen
      ? backButtonRef.current
      : selectedRouteButtonRef.current;
    if (!target || target.getClientRects().length === 0) return;

    if (mobileRouteDetailOpen) {
      routeDetailRef.current?.scrollIntoView({ block: "start" });
    } else {
      target.scrollIntoView({ block: "nearest" });
    }
    target.focus({ preventScroll: true });
  }, [mobileRouteDetailOpen, selectedRouteSignature]);

  if (!selectedRoute) return null;

  return (
    <Grid
      data-testid="inventory-route-browser"
      templateColumns={{ base: "minmax(0, 1fr)", lg: "20rem minmax(0, 1fr)" }}
      gap={{ base: 3, lg: 4 }}
      alignItems="start"
    >
      <Box
        data-testid="inventory-route-list"
        display={{
          base: mobileRouteDetailOpen ? "none" : "block",
          lg: "block",
        }}
        position={{ base: "static", lg: "sticky" }}
        top={{ lg: "calc(7rem + env(safe-area-inset-top))" }}
        minW={0}
        overflow="hidden"
        borderWidth="1px"
        borderColor="var(--palworld-canvas-border)"
        borderRadius="md"
        bg="var(--palworld-canvas-surface)"
      >
        <Stack
          gap={1}
          px={3}
          py={2.5}
          borderBottomWidth="1px"
          borderColor="var(--palworld-canvas-border)"
        >
          <Heading as="h3" fontSize="sm" color="var(--palworld-canvas-fg)">
            {t("results.priority_routes")}
          </Heading>
          <Text fontSize="xs" color="var(--palworld-canvas-fg-muted)">
            {t("results.priority_route_count", {
              shown: routes.length,
              total: totalRouteCount,
            })}
          </Text>
        </Stack>
        <Stack role="list" gap={1} p={1}>
          {routes.map((route, index) => {
            const routeKey = createPalworldRouteExecutionSignature(route);
            const selected = routeKey === selectedRouteSignature;
            return (
              <Box key={routeKey} role="listitem">
                <InventoryRouteSummaryButton
                  route={route}
                  locale={locale}
                  rank={index + 1}
                  selected={selected}
                  recommended={recommendedRouteKeys.has(routeKey)}
                  buttonRef={selected ? selectedRouteButtonRef : undefined}
                  onSelect={() => {
                    mobileRouteNavigationStartedRef.current = true;
                    setSelectedRouteKey(routeKey);
                    setMobileRouteDetailOpen(true);
                  }}
                />
              </Box>
            );
          })}
        </Stack>
      </Box>

      <Stack
        ref={routeDetailRef}
        data-testid="inventory-route-detail"
        display={{ base: mobileRouteDetailOpen ? "flex" : "none", lg: "flex" }}
        gap={3}
        minW={0}
        scrollMarginTop="calc(4.25rem + env(safe-area-inset-top))"
      >
        <Button
          ref={backButtonRef}
          type="button"
          data-testid="inventory-route-back"
          className="palworld-mobile-route-back"
          display={{ base: "inline-flex", lg: "none" }}
          position={{ base: "sticky", lg: "static" }}
          top={{ base: "calc(4.25rem + env(safe-area-inset-top))", lg: "auto" }}
          zIndex="docked"
          w={{ base: "full", lg: "auto" }}
          justifyContent="flex-start"
          borderWidth="1px"
          borderColor="var(--palworld-canvas-border)"
          bg="var(--palworld-canvas-surface)"
          boxShadow="var(--palworld-floating-shadow)"
          variant="ghost"
          alignSelf="start"
          minH={11}
          px={2}
          color="var(--palworld-canvas-fg)"
          _hover={{ bg: "var(--palworld-canvas-hover)" }}
          _focusVisible={{
            outline: "3px solid var(--palworld-focus-ring)",
            outlineOffset: "2px",
          }}
          onClick={() => {
            mobileRouteNavigationStartedRef.current = true;
            setMobileRouteDetailOpen(false);
          }}
        >
          <AppIcon as={ArrowLeft} size="sm" aria-hidden="true" />
          {t("results.back_to_routes")}
        </Button>
        <RouteCard
          route={selectedRoute}
          locale={locale}
          recommended={recommendedRouteKeys.has(selectedRouteSignature)}
          mode={mode}
          desiredPassiveIds={desiredPassiveIds}
        />
      </Stack>
    </Grid>
  );
}

function InventoryRouteSummaryButton({
  route,
  locale,
  rank,
  selected,
  recommended,
  buttonRef,
  onSelect,
}: {
  route: PalworldBreedingRoute;
  locale: string;
  rank: number;
  selected: boolean;
  recommended: boolean;
  buttonRef?: Ref<HTMLButtonElement>;
  onSelect: () => void;
}) {
  const t = useTranslations("palworld-breeding-calculator");
  const summary = summarizePalworldBreedingRoute(route);
  const firstStep = route.steps[0];
  const routeTitle = firstStep
    ? `${safePalLabel(firstStep.parent1.species, locale)} + ${safePalLabel(
        firstStep.parent2.species,
        locale,
      )} → ${route.steps
        .map((step) => safePalLabel(step.child, locale))
        .join(" → ")}`
    : safePalLabel(route.target, locale);

  return (
    <Button
      type="button"
      data-testid="inventory-route-option"
      aria-current={selected ? "true" : undefined}
      variant="plain"
      ref={buttonRef}
      w="full"
      h="auto"
      minH={16}
      p={3}
      display="block"
      borderWidth="1px"
      borderColor={
        selected
          ? "var(--palworld-recommended-border)"
          : "var(--palworld-canvas-border)"
      }
      borderRadius="sm"
      bg={selected ? "var(--palworld-tab-selected-bg)" : "transparent"}
      color={selected ? "var(--palworld-fg)" : "var(--palworld-canvas-fg)"}
      textAlign="start"
      whiteSpace="normal"
      _hover={{
        bg: selected
          ? "var(--palworld-tab-selected-hover-bg)"
          : "var(--palworld-canvas-hover)",
      }}
      _focusVisible={{
        outline: "3px solid var(--palworld-focus-ring)",
        outlineOffset: "1px",
      }}
      onClick={onSelect}
    >
      <Stack gap={2} minW={0}>
        <HStack gap={2} minW={0}>
          <Text
            fontSize="xs"
            fontWeight="900"
            color={
              selected
                ? "var(--palworld-accent-emphasis)"
                : "var(--palworld-canvas-fg-muted)"
            }
          >
            #{rank}
          </Text>
          {recommended ? (
            <Badge
              bg="var(--palworld-recommended-solid)"
              color="var(--palworld-accent-contrast)"
            >
              {t("routes.recommended")}
            </Badge>
          ) : null}
          <Text
            ms="auto"
            fontSize="xs"
            color={
              selected
                ? "var(--palworld-fg-muted)"
                : "var(--palworld-canvas-fg-muted)"
            }
          >
            {t(`results.groups.generation_${route.depth}`)}
          </Text>
          <AppIcon
            as={ArrowRight}
            display={{ base: "block", lg: "none" }}
            size="sm"
            flexShrink={0}
            color={
              selected
                ? "var(--palworld-fg-faint)"
                : "var(--palworld-canvas-fg-muted)"
            }
            aria-hidden="true"
          />
        </HStack>
        <Text
          data-testid="inventory-route-title"
          fontSize="sm"
          fontWeight="800"
          lineHeight="1.45"
          color={selected ? "var(--palworld-fg)" : "var(--palworld-canvas-fg)"}
          lineClamp={2}
        >
          {routeTitle}
        </Text>
        <HStack gap={2} justify="space-between" align="start">
          <Text
            fontSize="xs"
            color={
              selected
                ? route.group === "parents_owned"
                  ? "var(--palworld-success-fg-strong)"
                  : "var(--palworld-error-fg-soft)"
                : "var(--palworld-canvas-fg-muted)"
            }
          >
            {route.group === "parents_owned"
              ? t("routes.parents_owned_status")
              : t("routes.needs_supplement_status", {
                  count: summary.blockerCount,
                })}
          </Text>
          <Text
            flexShrink={0}
            fontSize="xs"
            color={
              selected
                ? "var(--palworld-fg-muted)"
                : "var(--palworld-canvas-fg-muted)"
            }
          >
            {t("routes.step_count", { count: summary.stepCount })}
          </Text>
        </HStack>
      </Stack>
    </Button>
  );
}

function ExcludedRouteNotice({
  searchMeta,
}: {
  searchMeta: PalworldBreedingRoutesResponse["searchMeta"];
}) {
  const t = useTranslations("palworld-breeding-calculator");
  const visibility = resolveBreedingSearchResultVisibility(searchMeta);
  if (!visibility.showExcludedRouteCount) return null;

  const count = searchMeta.excludedByPolicyCount;

  return (
    <Text
      data-testid="excluded-route-count"
      fontSize="xs"
      color="var(--palworld-canvas-fg-muted)"
      lineHeight="1.55"
    >
      {t("results.excluded_by_policy", { count })}
    </Text>
  );
}

function SearchTruncationNotice({
  searchMeta,
}: {
  searchMeta: PalworldBreedingRoutesResponse["searchMeta"];
}) {
  const t = useTranslations("palworld-breeding-calculator");
  const visibility = resolveBreedingSearchResultVisibility(searchMeta);
  if (visibility.truncationNotice === null) return null;

  const message =
    visibility.truncationNotice === "empty"
      ? t("results.search_truncated_empty")
      : t("results.search_truncated", {
          count: searchMeta.returnedRouteCount,
        });

  return (
    <Alert.Root status="warning" data-testid="search-truncation-notice">
      <Alert.Indicator />
      <Alert.Description>{message}</Alert.Description>
    </Alert.Root>
  );
}

function createRouteSearchEntry(
  route: PalworldBreedingRoute,
  locale: string,
): ResultsSearchEntry {
  const species = [
    ...route.steps.flatMap((step) => [
      step.parent1.species,
      step.parent2.species,
    ]),
    ...route.requirements.flatMap((requirement) => {
      if (requirement.type === "missing_parent") {
        return [requirement.species];
      }
      if (
        requirement.type !== "missing_passive" &&
        requirement.target.type === "parent"
      ) {
        return [requirement.target.species];
      }
      return [];
    }),
  ];
  const passiveIds = [
    ...route.passiveCoverage,
    ...route.requirements.flatMap((requirement) => {
      if (requirement.type === "missing_passive") {
        return [requirement.passiveId];
      }
      if (
        requirement.type !== "missing_parent" &&
        requirement.target.type === "passive"
      ) {
        return [requirement.target.passiveId];
      }
      return [];
    }),
  ];

  return {
    text: [
      ...species.map((internalId) => safePalLabel(internalId, locale)),
      ...passiveIds.map((passiveId) => safePassiveLabel(passiveId, locale)),
    ],
    paldeckCodes: species.map(
      (internalId) => gameData.palsByInternal[internalId]?.paldeckCode,
    ),
  };
}

function filterBreedingRoutesBySearch(
  routes: readonly PalworldBreedingRoute[],
  mode: CalculationMode,
  query: string,
  locale: string,
) {
  const searchableRoutes =
    mode === "formula"
      ? routes
      : routes.filter(
          (route) =>
            route.group === "parents_owned" ||
            route.group === "needs_supplement",
        );
  if (!normalizeResultsSearchText(query)) return searchableRoutes;

  return searchableRoutes.filter((route) =>
    matchesResultsSearch(createRouteSearchEntry(route, locale), query),
  );
}

function CompactFormulaRouteRow({
  route,
  locale,
}: {
  route: PalworldBreedingRoute;
  locale: string;
}) {
  return (
    <div className="palworld-compact-formula-route">
      {route.steps.map((step, index) => (
        <div
          key={`${createPalworldFormulaRouteSignature(route)}-formula-${index}`}
          className="palworld-compact-formula-step"
        >
          <CompactFormulaPal
            internalId={step.parent1.species}
            locale={locale}
            position="parent1"
            requiredGender={step.parent1.requiredGender}
          />
          <span className="palworld-compact-formula-operator palworld-compact-formula-operator--plus">
            +
          </span>
          <CompactFormulaPal
            internalId={step.parent2.species}
            locale={locale}
            position="parent2"
            requiredGender={step.parent2.requiredGender}
          />
          <span className="palworld-compact-formula-operator palworld-compact-formula-operator--equals">
            =
          </span>
          <CompactFormulaPal
            internalId={step.child}
            locale={locale}
            position="child"
          />
        </div>
      ))}
    </div>
  );
}

function ParentBreedingResults({
  outcomes,
  locale,
  query,
  ownedCounts,
  hasImportedSave,
  onQueryChange,
}: {
  outcomes: readonly PalworldParentBreedingOutcome[];
  locale: string;
  query: string;
  ownedCounts: ReadonlyMap<string, number>;
  hasImportedSave: boolean;
  onQueryChange: (query: string) => void;
}) {
  const t = useTranslations("palworld-breeding-calculator");
  const hasQuery = Boolean(normalizeResultsSearchText(query));
  const uniqueOutcomes = dedupeParentBreedingOutcomes(outcomes);
  const matchingOutcomes = hasQuery
    ? uniqueOutcomes.filter((outcome) =>
        matchesResultsSearch(
          {
            text: [
              safePalLabel(outcome.parentSpecies, locale),
              safePalLabel(outcome.partnerSpecies, locale),
              safePalLabel(outcome.child, locale),
            ],
            paldeckCodes: [
              gameData.palsByInternal[outcome.parentSpecies]?.paldeckCode,
              gameData.palsByInternal[outcome.partnerSpecies]?.paldeckCode,
              gameData.palsByInternal[outcome.child]?.paldeckCode,
            ],
          },
          query,
        ),
      )
    : uniqueOutcomes;

  return (
    <Grid
      id="palworld-parent-results"
      className="palworld-parent-results-grid"
      w="full"
      maxW={CALCULATOR_CONTENT_MAX_WIDTH}
      mx="auto"
      templateColumns={{
        base: "minmax(0, 1fr) auto",
        lg: "auto minmax(16rem, 32rem) auto",
      }}
      columnGap={{ base: 3, lg: 4 }}
      rowGap={{ base: 3, lg: 4 }}
      alignItems="center"
      justifyContent="space-between"
    >
      <Heading
        as="h2"
        gridColumn={1}
        gridRow={1}
        fontSize={{ base: "xl", md: "2xl" }}
        color="var(--palworld-accent-contrast)"
      >
        {t("results.parent_lookup_title")}
      </Heading>
      {uniqueOutcomes.length > 0 ? (
        <ResultsSearchToolbar
          id="palworld-parent-results-search"
          resultsId="palworld-parent-results"
          value={query}
          label={t("results.search_label")}
          placeholder={t("results.parent_search_placeholder")}
          onQueryChange={onQueryChange}
        />
      ) : null}
      <Badge
        gridColumn={{ base: 2, lg: 3 }}
        gridRow={1}
        justifySelf="end"
        bg="var(--palworld-success-bg)"
        color="var(--palworld-success-fg)"
      >
        {t("results.parent_result_count", {
          count: hasQuery ? matchingOutcomes.length : uniqueOutcomes.length,
        })}
      </Badge>

      {uniqueOutcomes.length > 0 ? (
        <Stack gridColumn="1 / -1" gridRow={{ base: 3, lg: 2 }} gap={3}>
          {hasImportedSave ? (
            <span className="palworld-parent-inventory-legend">
              <span
                className="palworld-parent-inventory-legend__marker"
                aria-hidden="true"
              />
              {t("results.parent_inventory_legend")}
            </span>
          ) : null}

          {matchingOutcomes.length > 0 ? (
            <div className="palworld-formula-result-grid">
              {matchingOutcomes.map((outcome) => (
                <div
                  key={[
                    outcome.parentSpecies,
                    outcome.partnerSpecies,
                    outcome.child,
                  ].join(":")}
                  className="palworld-compact-formula-route"
                >
                  <div className="palworld-compact-formula-step">
                    <CompactFormulaPal
                      internalId={outcome.parentSpecies}
                      locale={locale}
                      position="parent1"
                      requiredGender={outcome.parentRequiredGender}
                      ownedCount={ownedCounts.get(outcome.parentSpecies)}
                      showInventoryStatus={hasImportedSave}
                    />
                    <span className="palworld-compact-formula-operator palworld-compact-formula-operator--plus">
                      +
                    </span>
                    <CompactFormulaPal
                      internalId={outcome.partnerSpecies}
                      locale={locale}
                      position="parent2"
                      requiredGender={outcome.partnerRequiredGender}
                      ownedCount={ownedCounts.get(outcome.partnerSpecies)}
                      showInventoryStatus={hasImportedSave}
                    />
                    <span className="palworld-compact-formula-operator palworld-compact-formula-operator--equals">
                      =
                    </span>
                    <CompactFormulaPal
                      internalId={outcome.child}
                      locale={locale}
                      position="child"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Text color="var(--palworld-canvas-fg-muted)" fontSize="sm">
              {t("results.no_matching_routes")}
            </Text>
          )}
        </Stack>
      ) : (
        <Alert.Root gridColumn="1 / -1" gridRow={2} status="info">
          <Alert.Indicator />
          <Alert.Description>{t("results.no_routes")}</Alert.Description>
        </Alert.Root>
      )}
    </Grid>
  );
}

function CompactFormulaPal({
  internalId,
  locale,
  position,
  requiredGender,
  ownedCount,
  showInventoryStatus = false,
}: {
  internalId: string;
  locale: string;
  position: "parent1" | "parent2" | "child";
  requiredGender?: PalworldBreedingRouteParent["requiredGender"];
  ownedCount?: number;
  showInventoryStatus?: boolean;
}) {
  const t = useTranslations("palworld-breeding-calculator");
  const label = safePalLabel(internalId, locale);
  const iconSource = palworldIconHref(internalId);
  const isOwned =
    showInventoryStatus && typeof ownedCount === "number" && ownedCount > 0;
  const isMissing = showInventoryStatus && !isOwned;
  const inventoryCount = isOwned ? ownedCount : 0;

  return (
    <span
      className={`palworld-compact-formula-pal palworld-compact-formula-pal--${position}${showInventoryStatus ? " palworld-compact-formula-pal--inventory" : ""}${isOwned ? " palworld-compact-formula-pal--owned" : ""}${isMissing ? " palworld-compact-formula-pal--missing" : ""}`}
    >
      <span className="palworld-compact-formula-avatar-wrap">
        <span
          className="palworld-compact-formula-avatar"
          aria-hidden="true"
          data-pal-icon-status={iconSource ? "available" : "missing"}
        >
          <PalIconImage
            key={iconSource?.src ?? internalId}
            src={iconSource?.src ?? null}
            srcSet={iconSource?.srcSet}
            sizes="44px"
            alt=""
            loading="lazy"
            decoding="async"
            fallback={label.slice(0, 1).toLocaleUpperCase(locale)}
          />
        </span>
        {showInventoryStatus ? (
          <span
            className={`palworld-compact-formula-inventory-count${isMissing ? " palworld-compact-formula-inventory-count--missing" : ""}`}
            aria-label={t("results.parent_inventory_count", {
              count: inventoryCount,
            })}
          >
            ×{inventoryCount}
          </span>
        ) : null}
      </span>
      <span className="palworld-compact-formula-details">
        <span className="palworld-compact-formula-name-row">
          <PaldeckBadge internalId={internalId} />
          <span className="palworld-compact-formula-name-line">
            <span className="palworld-compact-formula-label">{label}</span>
            <GenderMarker gender={requiredGender} />
          </span>
        </span>
      </span>
    </span>
  );
}

function CompactPal({
  internalId,
  locale,
}: {
  internalId: string;
  locale: string;
}) {
  return (
    <HStack gap={1.5} minW={0} maxW={{ base: "9.5rem", md: "14rem" }}>
      <PalAvatar internalId={internalId} locale={locale} size="sm" />
      <Stack gap={0} minW={0}>
        <Text
          fontSize="sm"
          fontWeight="800"
          color="var(--palworld-fg)"
          lineClamp={1}
        >
          {safePalLabel(internalId, locale)}
        </Text>
        <PaldeckBadge internalId={internalId} />
      </Stack>
    </HStack>
  );
}

export default function PalworldBreedingCalculatorPage({
  onLocaleChange,
}: PalworldBreedingCalculatorPageProps) {
  const t = useTranslations("palworld-breeding-calculator");
  const commonT = useTranslations("common");
  const locale = useLocale();
  const restoredSession = useMemo(
    () => readCalculatorSessionStateFromBrowser(),
    [],
  );
  const restoredShareState = useMemo(
    () => readCalculatorShareStateFromBrowser(),
    [],
  );
  const [status, setStatus] = useState<WorkbenchStatus>(
    restoredSession?.preparedUpload ? "ready" : "idle",
  );
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [calculationErrorMessage, setCalculationErrorMessage] = useState<
    string | null
  >(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [preparedUpload, setPreparedUpload] =
    useState<BreedingCalculatorPreparedOwnedPalsUpload | null>(
      restoredSession?.preparedUpload ?? null,
    );
  const [plan, setPlan] = useState<CalculationResult | null>(null);
  const [breedingQueryMode, setBreedingQueryMode] = useState<BreedingQueryMode>(
    restoredShareState?.view ?? "target",
  );
  const [targetSpecies, setTargetSpecies] = useState<string | null>(
    restoredShareState
      ? restoredShareState.view === "target"
        ? restoredShareState.child
        : null
      : (restoredSession?.targetSpecies ?? null),
  );
  const [targetSpeciesInvalid, setTargetSpeciesInvalid] = useState(false);
  const [startingSpecies, setStartingSpecies] = useState<string | null>(
    restoredShareState
      ? restoredShareState.view === "target"
        ? restoredShareState.parent
        : null
      : (restoredSession?.startingSpecies ?? null),
  );
  const [parentASpecies, setParentASpecies] = useState<string | null>(
    restoredShareState?.view === "parents" ? restoredShareState.parentA : null,
  );
  const [parentSpeciesInvalid, setParentSpeciesInvalid] = useState(false);
  const [parentBSpecies, setParentBSpecies] = useState<string | null>(
    restoredShareState?.view === "parents" ? restoredShareState.parentB : null,
  );
  const [submittedParentBreedingQuery, setSubmittedParentBreedingQuery] =
    useState<SubmittedParentBreedingQuery | null>(null);
  const [parentBreedingOutcomes, setParentBreedingOutcomes] = useState<
    PalworldParentBreedingOutcome[]
  >([]);
  const [parentBreedingDataStatus, setParentBreedingDataStatus] =
    useState<ParentBreedingDataStatus>("idle");
  const [selectedPassiveIds, setSelectedPassiveIds] = useState<string[]>(
    restoredShareState
      ? restoredShareState.view === "target"
        ? restoredShareState.passiveIds
        : []
      : (restoredSession?.selectedPassiveIds.slice(0, MAX_PASSIVE_SELECTION) ??
          []),
  );
  const [passivePickerOpen, setPassivePickerOpen] = useState(false);
  const [saveLocationsOpen, setSaveLocationsOpen] = useState(false);
  const [saveLocationKey, setSaveLocationKey] =
    useState<SaveLocationKey>("steam_windows");
  const [targetRouteQuery, setTargetRouteQuery] = useState("");
  const [parentRouteQuery, setParentRouteQuery] = useState("");
  const targetSpeciesInputRef = useRef<HTMLInputElement | null>(null);
  const parentASpeciesInputRef = useRef<HTMLInputElement | null>(null);
  const passivePickerInputRef = useRef<HTMLInputElement | null>(null);
  const passivePickerSectionRef = useRef<HTMLDivElement | null>(null);
  const passivePickerReturnFocusRef = useRef<HTMLElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const saveParserAbortRef = useRef<AbortController | null>(null);
  const saveParseRequestIdRef = useRef(0);
  const targetBreedingRequestIdRef = useRef(0);
  const parentBreedingRequestIdRef = useRef(0);
  const preserveSharedPassivesOnNextImportRef = useRef(
    restoredShareState?.view === "target" &&
      restoredShareState.passiveIds.length > 0 &&
      !restoredSession?.preparedUpload,
  );

  const palOptions = useMemo(() => createPalOptions(locale), [locale]);
  const palOwnedCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const pal of preparedUpload?.pals ?? []) {
      counts.set(pal.s, (counts.get(pal.s) ?? 0) + 1);
    }
    return counts;
  }, [preparedUpload]);
  const palOptionsWithOwnership = useMemo(
    () =>
      palOptions.map((option) => ({
        ...option,
        ownedCount: palOwnedCounts.get(option.value),
      })),
    [palOptions, palOwnedCounts],
  );
  const requestParentBreedingOutcomes = useCallback(async () => {
    if (!submittedParentBreedingQuery) return;

    const requestId = parentBreedingRequestIdRef.current + 1;
    parentBreedingRequestIdRef.current = requestId;
    setParentBreedingDataStatus("loading");
    setParentBreedingOutcomes([]);

    try {
      const payload = await loadParentShard(
        submittedParentBreedingQuery.parentSpecies,
        submittedParentBreedingQuery.partnerSpecies,
      );
      if (requestId !== parentBreedingRequestIdRef.current) return;

      const outcomes = sortParentBreedingOutcomes(payload.outcomes);
      setParentBreedingOutcomes(
        submittedParentBreedingQuery.reverse
          ? outcomes.map((outcome) => ({
              child: outcome.child,
              parentSpecies: outcome.partnerSpecies,
              partnerSpecies: outcome.parentSpecies,
              parentRequiredGender: outcome.partnerRequiredGender,
              partnerRequiredGender: outcome.parentRequiredGender,
            }))
          : outcomes,
      );
      setParentBreedingDataStatus("ready");
    } catch {
      if (requestId !== parentBreedingRequestIdRef.current) return;
      setParentBreedingDataStatus("error");
    }
  }, [submittedParentBreedingQuery]);

  useEffect(() => {
    if (!submittedParentBreedingQuery) {
      parentBreedingRequestIdRef.current += 1;
      setParentBreedingOutcomes([]);
      setParentBreedingDataStatus("idle");
      return;
    }

    void requestParentBreedingOutcomes();
  }, [requestParentBreedingOutcomes, submittedParentBreedingQuery]);

  const hasParentBreedingQuery = submittedParentBreedingQuery !== null;
  const showParentBreedingResults =
    breedingQueryMode === "parents" && submittedParentBreedingQuery !== null;
  const showTargetBreedingResults =
    breedingQueryMode === "target" && plan !== null;
  const calculatorControlsLocked =
    status === "planning" ||
    status === "parsing" ||
    parentBreedingDataStatus === "loading";
  const passiveOptions = useMemo(() => createPassiveOptions(locale), [locale]);
  const recommendedRouteKeys = useMemo(
    () =>
      new Set(
        (plan?.recommendedRouteIndexes ?? []).flatMap((index) => {
          const route = plan?.routes[index];
          return route ? [createPalworldRouteExecutionSignature(route)] : [];
        }),
      ),
    [plan?.recommendedRouteIndexes, plan?.routes],
  );
  const allRoutes = useMemo(() => {
    const seen = new Set<string>();
    const routeIdentity =
      plan?.mode === "formula"
        ? createPalworldFormulaRouteSignature
        : createPalworldRouteExecutionSignature;
    return sortRoutes(plan?.routes ?? [])
      .filter((route) => {
        const key = routeIdentity(route);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort(
        (left, right) =>
          Number(
            recommendedRouteKeys.has(
              createPalworldRouteExecutionSignature(right),
            ),
          ) -
          Number(
            recommendedRouteKeys.has(
              createPalworldRouteExecutionSignature(left),
            ),
          ),
      );
  }, [plan?.mode, plan?.routes, recommendedRouteKeys]);
  const totalRouteCount = allRoutes.length;
  const filteredTargetRouteCount = useMemo(
    () =>
      plan
        ? filterBreedingRoutesBySearch(
            allRoutes,
            plan.mode,
            targetRouteQuery,
            locale,
          ).length
        : 0,
    [allRoutes, locale, plan, targetRouteQuery],
  );

  const ownedPassiveSummary = useMemo(() => {
    if (!preparedUpload) return [];
    return summarizePalworldOwnedPassiveSkills(preparedUpload);
  }, [preparedUpload]);
  const passiveOptionsWithOwnership = useMemo(() => {
    const ownedCounts = new Map(
      ownedPassiveSummary.map((item) => [item.id, item.count]),
    );
    return passiveOptions.map((option) => ({
      ...option,
      ownedCount: ownedCounts.get(option.value),
    }));
  }, [ownedPassiveSummary, passiveOptions]);
  const ownedRouteSourcesById = useMemo(
    () =>
      new Map<string, PalworldBreedingRouteSource>(
        (preparedUpload?.pals ?? []).map((pal) => [
          pal.i,
          {
            id: pal.i,
            species: pal.s,
            gender: pal.g === "M" ? "Male" : pal.g === "F" ? "Female" : "",
            passiveIds: pal.p ?? [],
            ...(pal.l ? { slot: pal.l } : {}),
          },
        ]),
      ),
    [preparedUpload],
  );
  const passiveLockedMessage = t("calculator.passive_locked");
  const importSaveLinkLabel = t("calculator.import_save_link");
  const ownedInventoryExampleLabel = t("results.parent_inventory_count", {
    count: 3,
  });
  const missingInventoryExampleLabel = t("routes.parent_missing");
  const importSaveLinkIndex = passiveLockedMessage.indexOf(importSaveLinkLabel);
  const calculatorShareState = useMemo<CalculatorShareState>(
    () =>
      breedingQueryMode === "parents"
        ? {
            view: "parents",
            parentA: parentASpecies,
            parentB: parentBSpecies,
          }
        : {
            view: "target",
            child: targetSpecies,
            parent: startingSpecies,
            passiveIds: selectedPassiveIds,
          },
    [
      breedingQueryMode,
      parentASpecies,
      parentBSpecies,
      selectedPassiveIds,
      startingSpecies,
      targetSpecies,
    ],
  );
  const hasShareableQuery =
    calculatorShareState.view === "parents"
      ? Boolean(calculatorShareState.parentA || calculatorShareState.parentB)
      : Boolean(
          calculatorShareState.child ||
          calculatorShareState.parent ||
          calculatorShareState.passiveIds.length,
        );
  const shareButtonLabel = t(hasShareableQuery ? "share.query" : "share.tool");

  useEffect(() => {
    writeCalculatorSessionStateToBrowser({
      preparedUpload,
      targetSpecies,
      startingSpecies,
      selectedPassiveIds,
    });
  }, [preparedUpload, selectedPassiveIds, startingSpecies, targetSpecies]);

  useEffect(() => {
    const nextHash = buildCalculatorShareHash(calculatorShareState);
    if (window.location.hash === nextHash) return;
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${window.location.search}${nextHash}`,
    );
  }, [calculatorShareState]);

  useEffect(
    () => () => {
      saveParseRequestIdRef.current += 1;
      saveParserAbortRef.current?.abort();
    },
    [],
  );

  function handleTargetSpeciesChange(nextTargetSpecies: string | null) {
    if (nextTargetSpecies) setTargetSpeciesInvalid(false);
    if (nextTargetSpecies === targetSpecies) return;
    targetBreedingRequestIdRef.current += 1;
    setTargetSpecies(nextTargetSpecies);
    setPlan(null);
    setTargetRouteQuery("");
  }

  function handleBreedingQueryModeChange(nextMode: string | null) {
    if (nextMode !== "target" && nextMode !== "parents") return;
    if (nextMode === breedingQueryMode) return;
    setBreedingQueryMode(nextMode);
    setCalculationErrorMessage(null);
    setTargetSpeciesInvalid(false);
    setParentSpeciesInvalid(false);
  }

  function closeSaveDialog() {
    setSaveDialogOpen(false);
    if (status !== "parsing") return;

    saveParseRequestIdRef.current += 1;
    saveParserAbortRef.current?.abort();
    saveParserAbortRef.current = null;
    setSaveErrorMessage(null);
    setStatus(preparedUpload ? "ready" : "idle");
  }

  function clearImportedSave() {
    targetBreedingRequestIdRef.current += 1;
    setPreparedUpload(null);
    setSelectedPassiveIds([]);
    setPlan(null);
    setPassivePickerOpen(false);
    setTargetRouteQuery("");
    setSaveErrorMessage(null);
    setCalculationErrorMessage(null);
    setStatus("idle");
    setSaveDialogOpen(false);
  }

  async function handleSaveFiles(files: File[]) {
    const file = files[0];
    if (!file) return;

    saveParserAbortRef.current?.abort();
    const controller = new AbortController();
    const requestId = saveParseRequestIdRef.current + 1;
    saveParseRequestIdRef.current = requestId;
    saveParserAbortRef.current = controller;
    setStatus("parsing");
    setSaveErrorMessage(null);

    try {
      const prepared = await createPreparedUploadFromFile(
        file,
        controller.signal,
      );
      if (
        controller.signal.aborted ||
        requestId !== saveParseRequestIdRef.current
      ) {
        return;
      }
      setPreparedUpload(prepared);
      setStatus("ready");
      setPlan(null);
      if (preserveSharedPassivesOnNextImportRef.current) {
        preserveSharedPassivesOnNextImportRef.current = false;
      } else {
        setSelectedPassiveIds([]);
      }
      setPassivePickerOpen(false);
      setTargetRouteQuery("");
      setSaveDialogOpen(false);
    } catch (error) {
      if (
        controller.signal.aborted ||
        requestId !== saveParseRequestIdRef.current
      ) {
        return;
      }
      setStatus(preparedUpload ? "ready" : "idle");
      setSaveErrorMessage(t(mapSaveParserErrorToMessageKey(error)));
    } finally {
      if (requestId === saveParseRequestIdRef.current) {
        saveParserAbortRef.current = null;
      }
    }
  }

  function handleStartingSpeciesChange(nextStartingSpecies: string | null) {
    if (nextStartingSpecies === startingSpecies) return;
    targetBreedingRequestIdRef.current += 1;
    setStartingSpecies(nextStartingSpecies);
    setPlan(null);
    setTargetRouteQuery("");
  }

  function swapTargetAndStartingSpecies() {
    if (targetSpecies === startingSpecies) return;
    targetBreedingRequestIdRef.current += 1;
    setTargetSpecies(startingSpecies);
    setStartingSpecies(targetSpecies);
    setPlan(null);
    setTargetRouteQuery("");
    setCalculationErrorMessage(null);
  }

  function handleParentASpeciesChange(nextParentSpecies: string | null) {
    if (nextParentSpecies === parentASpecies) return;
    setParentSpeciesInvalid(false);
    setParentASpecies(nextParentSpecies);
    setSubmittedParentBreedingQuery(null);
    setParentRouteQuery("");
  }

  function handleParentBSpeciesChange(nextParentSpecies: string | null) {
    if (nextParentSpecies === parentBSpecies) return;
    setParentSpeciesInvalid(false);
    setParentBSpecies(nextParentSpecies);
    setSubmittedParentBreedingQuery(null);
    setParentRouteQuery("");
  }

  function swapParentSpecies() {
    if (parentASpecies === parentBSpecies) return;
    setParentASpecies(parentBSpecies);
    setParentBSpecies(parentASpecies);
    setSubmittedParentBreedingQuery(null);
    setParentRouteQuery("");
    setCalculationErrorMessage(null);
    setParentSpeciesInvalid(false);
  }

  function togglePassive(passiveId: string) {
    const selected = selectedPassiveIds.includes(passiveId);
    if (!selected && selectedPassiveIds.length >= MAX_PASSIVE_SELECTION) return;

    targetBreedingRequestIdRef.current += 1;
    setSelectedPassiveIds((current) =>
      selected
        ? current.filter((currentPassiveId) => currentPassiveId !== passiveId)
        : [...current, passiveId],
    );
    setPlan(null);
    setTargetRouteQuery("");
  }

  function openPassivePicker() {
    if (!preparedUpload) return;
    if (
      typeof document !== "undefined" &&
      document.activeElement instanceof HTMLElement
    ) {
      passivePickerReturnFocusRef.current = document.activeElement;
    }
    setPassivePickerOpen(true);
  }

  function closePassivePicker() {
    setPassivePickerOpen(false);
  }

  function resolvePassivePickerFinalFocus() {
    const returnTarget = passivePickerReturnFocusRef.current;
    return returnTarget?.isConnected
      ? returnTarget
      : passivePickerSectionRef.current;
  }

  const scrollResultsIntoView = useCallback(() => {
    const node = resultsRef.current;
    if (!node || typeof node.scrollIntoView !== "function") return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const schedule =
      typeof window !== "undefined" &&
      typeof window.requestAnimationFrame === "function"
        ? window.requestAnimationFrame
        : (callback: FrameRequestCallback) => window.setTimeout(callback, 0);

    schedule(() => {
      node.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  }, []);

  useEffect(() => {
    if (
      breedingQueryMode !== "parents" ||
      !submittedParentBreedingQuery ||
      (parentBreedingDataStatus !== "ready" &&
        parentBreedingDataStatus !== "error")
    ) {
      return;
    }

    scrollResultsIntoView();
  }, [
    breedingQueryMode,
    parentBreedingDataStatus,
    scrollResultsIntoView,
    submittedParentBreedingQuery,
  ]);

  useEffect(() => {
    if (breedingQueryMode !== "target" || !plan || status !== "ready") return;
    scrollResultsIntoView();
  }, [breedingQueryMode, plan, scrollResultsIntoView, status]);

  async function handlePlanRoutes() {
    if (status === "planning" || breedingQueryMode !== "target") return;

    const selectedTarget =
      targetSpecies ??
      findPalworldInternalIdByDisplayText(
        targetSpecies ?? "",
        gameData,
        locale,
      );
    if (!selectedTarget) {
      setTargetSpeciesInvalid(true);
      targetSpeciesInputRef.current?.focus();
      return;
    }

    setTargetSpeciesInvalid(false);
    setStatus("planning");
    setCalculationErrorMessage(null);
    setTargetRouteQuery("");
    const requestId = targetBreedingRequestIdRef.current + 1;
    targetBreedingRequestIdRef.current = requestId;

    try {
      await waitForNextPaint();
      let nextPlan: PalworldBreedingRoutesResponse;
      if (preparedUpload || startingSpecies) {
        const uploadPayload = preparedUpload ?? EMPTY_OWNED_PALS_PAYLOAD;
        const encoded = (
          await import("../../src/payload-codec")
        ).encodeOwnedPalsPayloadUpload(uploadPayload);
        const request = createPalworldBreedingRoutesFetchInput({
          apiBaseUrl: resolveBreedingRoutesApiBaseUrl(),
          encoded,
          mode: preparedUpload ? undefined : "formula",
          targetSpecies: selectedTarget,
          startingSpecies,
          passiveIds: preparedUpload ? selectedPassiveIds : [],
        });
        const response = await fetch(request.url, request.init);
        if (!response.ok) {
          const apiError = await readBreedingRoutesApiError(response);
          throw new Error(
            mapBreedingRoutesApiErrorToKey(response.status, apiError ?? null),
          );
        }
        nextPlan = parsePalworldBreedingRoutesResponse(await response.json());
      } else {
        const targetShard = await loadTargetShard(selectedTarget);
        nextPlan = createFormulaPlanFromTargetShard(
          targetShard,
          startingSpecies,
        );
      }

      if (requestId !== targetBreedingRequestIdRef.current) return;
      startTransition(() => {
        setPlan({
          ...nextPlan,
          mode: preparedUpload ? "inventory" : "formula",
        });
        setStatus("ready");
      });
    } catch (error) {
      if (requestId !== targetBreedingRequestIdRef.current) return;
      setStatus(preparedUpload ? "ready" : "idle");
      const errorKey =
        error instanceof Error && error.message.startsWith("error.")
          ? error.message
          : "error.api_unreachable";
      setCalculationErrorMessage(t(errorKey));
    }
  }

  async function handleSubmitBreedingQuery() {
    if (calculatorControlsLocked) return;

    if (breedingQueryMode === "target") {
      await handlePlanRoutes();
      return;
    }

    const parentSpecies = parentASpecies ?? parentBSpecies;
    if (!parentSpecies) {
      setParentSpeciesInvalid(true);
      parentASpeciesInputRef.current?.focus();
      return;
    }

    setParentSpeciesInvalid(false);
    setCalculationErrorMessage(null);
    setParentRouteQuery("");
    setSubmittedParentBreedingQuery({
      parentSpecies,
      partnerSpecies: parentASpecies ? parentBSpecies : null,
      reverse: !parentASpecies,
    });
  }

  async function handleShareCalculator() {
    const url = new URL(window.location.href);
    url.search = new URLSearchParams({ lang: locale }).toString();
    url.hash = buildCalculatorShareHash(calculatorShareState);

    if (shouldUseNativeShare()) {
      try {
        await navigator.share({ title: document.title, url: url.toString() });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(url.toString());
      appToaster.create({
        title: t("share.copied"),
        type: "success",
        duration: 4_000,
      });
    } catch {
      appToaster.create({
        title: t("share.failed"),
        type: "error",
        duration: 4_000,
      });
    }
  }

  return (
    <>
      <Box
        as="header"
        data-testid="palworld-floating-header"
        className="palworld-floating-header"
        aria-label="CrateX.app"
      >
        <HStack className="palworld-floating-header__inner">
          <Box asChild className="palworld-floating-header__brand">
            <Link href={buildCrateXGamesCategoryHref(locale)} target="_top">
              <img
                src={cratexLogo32Href}
                srcSet={`${cratexLogo32Href} 1x, ${cratexLogo64Href} 2x`}
                alt=""
                width={22}
                height={22}
                loading="eager"
                decoding="async"
              />
              <Text as="span">CrateX.app</Text>
            </Link>
          </Box>
          <HStack className="palworld-floating-header__actions" gap={2}>
            <HStack className="palworld-language-control" gap={1}>
              <AppIcon
                as={Languages}
                size="sm"
                color="var(--palworld-highlight)"
                flexShrink={0}
                aria-hidden="true"
              />
              <NativeSelect.Root size="sm" flex="1" minW={0}>
                <NativeSelect.Field
                  id="palworld-language"
                  name="palworld-language"
                  className="palworld-language-control__select"
                  value={locale}
                  aria-label={LANGUAGE_DISPLAY_NAMES[locale]}
                  borderWidth={0}
                  borderRadius={0}
                  bg="transparent"
                  color="var(--palworld-accent-contrast)"
                  fontWeight="800"
                  boxShadow="none"
                  ps={1}
                  _hover={{ bg: "transparent" }}
                  _focusVisible={{ outline: "none" }}
                  css={{
                    "& option": {
                      background: "#fff8e5",
                      color: "#17343b",
                    },
                  }}
                  onChange={(event) => {
                    void onLocaleChange?.(event.currentTarget.value as Locale);
                  }}
                >
                  {availableLocales.map((item) => (
                    <option key={item} value={item}>
                      {LANGUAGE_DISPLAY_NAMES[item]}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator color="var(--palworld-highlight)" />
              </NativeSelect.Root>
            </HStack>
            <AppTooltip content={shareButtonLabel}>
              <IconButton
                data-testid="share-calculator-link"
                className="palworld-share-control"
                type="button"
                variant="plain"
                aria-label={shareButtonLabel}
                onClick={() => void handleShareCalculator()}
              >
                <AppIcon as={Share2} size="sm" aria-hidden="true" />
              </IconButton>
            </AppTooltip>
          </HStack>
        </HStack>
        <BackToTopButton label={commonT("back_to_top")} />
      </Box>
      <Box
        as="main"
        colorPalette="gray"
        minH="100dvh"
        position="relative"
        overflow="clip"
        bg="var(--palworld-canvas)"
        color="var(--palworld-fg)"
        px={{ base: 3, md: 6 }}
        py={{ base: 4, md: 6 }}
      >
        <Stack
          gap={{ base: 5, md: 6 }}
          maxW="92rem"
          mx="auto"
          position="relative"
          zIndex={1}
        >
          <Box className="palworld-hero">
            {palworldAssetBaseHref ? (
              <picture className="palworld-hero-media" aria-hidden="true">
                <source
                  media="(max-width: 47.999rem)"
                  srcSet={palworldHero768Href ?? undefined}
                />
                <img
                  src={palworldHero1920Href ?? undefined}
                  srcSet={`${palworldHero1920Href} 1920w, ${palworldHero3840Href} 3840w`}
                  sizes="100vw"
                  alt=""
                  width={1920}
                  height={620}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                />
              </picture>
            ) : null}
            <Box className="palworld-hero-scrim" aria-hidden="true" />
            <Stack
              className="palworld-hero-copy"
              position="relative"
              zIndex={1}
              justify="flex-end"
              gap={3}
              minH={{ base: 0, md: "19.5rem" }}
              maxW="92rem"
              w="full"
              mx="auto"
              px={{ base: 3, md: 6 }}
              pt={{ base: 5, md: 4 }}
              pb={{ base: 6, md: 8 }}
            >
              <Heading
                as="h1"
                maxW="62rem"
                fontSize={{
                  base: "1.9rem",
                  sm: "2.15rem",
                  md: "2.5rem",
                  lg: "3rem",
                }}
                lineHeight={{ base: "1.08", md: "1" }}
                letterSpacing="0"
                color="var(--palworld-accent-contrast)"
              >
                {t("hero.title")}
              </Heading>
              <Text
                maxW="48rem"
                fontSize={{ base: "md", md: "lg" }}
                color="rgba(255, 248, 229, 0.86)"
                lineHeight="1.7"
              >
                {t("hero.subtitle")}
              </Text>
              <Text
                fontSize="sm"
                fontWeight="800"
                color="var(--palworld-highlight)"
              >
                {t("hero.data_badge", {
                  compatibility: PALWORLD_V1_METADATA.compatibility,
                  palCount: PALWORLD_V1_METADATA.palCount,
                  passiveCount: PALWORLD_V1_METADATA.passiveSkillCount,
                })}
              </Text>
            </Stack>
          </Box>

          {calculationErrorMessage ? (
            <FloatingErrorAlert
              testId="route-calculation-error"
              message={calculationErrorMessage}
              retryLabel={t("calculator.retry")}
              closeLabel={t("upload.close")}
              onRetry={() => void handlePlanRoutes()}
              onClose={() => setCalculationErrorMessage(null)}
            />
          ) : null}
          {showParentBreedingResults && parentBreedingDataStatus === "error" ? (
            <FloatingErrorAlert
              testId="parent-breeding-load-error"
              message={t("results.parent_load_error")}
              retryLabel={t("calculator.retry")}
              closeLabel={t("upload.close")}
              onRetry={() => void requestParentBreedingOutcomes()}
              onClose={() => setParentBreedingDataStatus("idle")}
            />
          ) : null}

          <Stack
            w="full"
            maxW={CALCULATOR_CONTENT_MAX_WIDTH}
            mx="auto"
            gap={{ base: 3, md: 4 }}
          >
            <Dialog.Root
              open={saveDialogOpen}
              onOpenChange={(details) => {
                if (details.open) {
                  setSaveDialogOpen(true);
                  return;
                }
                closeSaveDialog();
              }}
              lazyMount
              unmountOnExit
              closeOnInteractOutside={status !== "parsing"}
            >
              <Portal>
                <Dialog.Backdrop
                  bg="rgba(4, 38, 48, 0.66)"
                  _closed={{ pointerEvents: "none" }}
                />
                <Dialog.Positioner
                  p={{ base: 0, md: 4 }}
                  alignItems={{ base: "stretch", md: "center" }}
                >
                  <Dialog.Content
                    data-testid="palworld-save-dialog"
                    maxW={{ base: "none", md: "44rem" }}
                    h={{ base: "100dvh", md: "auto" }}
                    maxH={{ base: "100dvh", md: "calc(100dvh - 2rem)" }}
                    m={0}
                    w="full"
                    overflow="hidden"
                    borderWidth={{ base: 0, md: "1px" }}
                    borderColor="var(--palworld-border-muted)"
                    borderRadius={{ base: 0, md: "md" }}
                    bg="var(--palworld-surface)"
                    color="var(--palworld-fg)"
                    boxShadow="0 24px 72px rgba(4, 38, 48, 0.34)"
                  >
                    <Dialog.Header
                      flexShrink={0}
                      borderBottomWidth="1px"
                      borderColor="var(--palworld-border-muted)"
                    >
                      <HStack gap={3} w="full" align="start">
                        <Flex
                          w={10}
                          h={10}
                          flexShrink={0}
                          align="center"
                          justify="center"
                          borderRadius="md"
                          bg="var(--palworld-accent-solid)"
                          color="var(--palworld-highlight)"
                        >
                          <AppIcon
                            as={FileArchive}
                            size="md"
                            aria-hidden="true"
                          />
                        </Flex>
                        <Stack gap={0.5} flex="1" minW={0}>
                          <Dialog.Title fontSize="xl" fontWeight="900">
                            {preparedUpload
                              ? t("upload.ready_title")
                              : t("upload.title")}
                          </Dialog.Title>
                          {preparedUpload ? (
                            <Text
                              fontSize="sm"
                              color="var(--palworld-fg-muted)"
                            >
                              {t("upload.ready_action", {
                                count: preparedUpload.pals.length,
                              })}
                            </Text>
                          ) : null}
                        </Stack>
                        <Dialog.CloseTrigger asChild>
                          <CloseButton
                            size="sm"
                            aria-label={t("upload.close")}
                          />
                        </Dialog.CloseTrigger>
                      </HStack>
                    </Dialog.Header>
                    <Dialog.Body
                      flex="1"
                      minH={0}
                      overflowY="auto"
                      overscrollBehavior="contain"
                      py={4}
                    >
                      <Stack
                        data-testid="palworld-save-panel"
                        data-save-state={preparedUpload ? "ready" : status}
                        gap={4}
                      >
                        <FileDropzone
                          accept=".sav,application/octet-stream"
                          multiple={false}
                          inputId="palworld-save-file"
                          inputName="palworld-save-file"
                          inputAriaLabel={t("upload.input_label")}
                          surfaceVariant="workbench"
                          disabled={
                            status === "parsing" || status === "planning"
                          }
                          minH={
                            preparedUpload
                              ? { base: "6.5rem", sm: "5.5rem" }
                              : { base: "7rem", md: "10rem" }
                          }
                          padding={
                            preparedUpload
                              ? { base: 3, md: 3 }
                              : { base: 4, md: 5 }
                          }
                          rootProps={{
                            borderWidth: "1px",
                            borderColor: "var(--palworld-accent-border)",
                            bg: preparedUpload
                              ? "var(--palworld-surface-a56)"
                              : "var(--palworld-success-bg)",
                            borderRadius: "md",
                            _hover: {
                              borderColor:
                                "var(--palworld-upload-hover-border)",
                              bg: "var(--palworld-upload-hover-bg)",
                            },
                          }}
                          onFilesSelect={handleSaveFiles}
                        >
                          {preparedUpload ? (
                            <HStack gap={3} justify="center" textAlign="left">
                              <Flex
                                w={9}
                                h={9}
                                flexShrink={0}
                                align="center"
                                justify="center"
                                borderRadius="md"
                                bg="var(--palworld-accent-solid)"
                                color="var(--palworld-highlight)"
                              >
                                <AppIcon as={FileArchive} size="sm" />
                              </Flex>
                              <Stack gap={0.5} minW={0}>
                                <Text
                                  fontWeight="900"
                                  color="var(--palworld-fg)"
                                >
                                  {t("upload.replace_title")}
                                </Text>
                                <Text
                                  fontSize="sm"
                                  color="var(--palworld-fg-muted)"
                                  lineHeight="1.5"
                                >
                                  {t("upload.replace_description")}
                                </Text>
                              </Stack>
                            </HStack>
                          ) : (
                            <Stack gap={2} align="center" textAlign="center">
                              <Flex
                                w={10}
                                h={10}
                                align="center"
                                justify="center"
                                borderRadius="md"
                                bg="var(--palworld-accent-solid)"
                                color="var(--palworld-highlight)"
                              >
                                <AppIcon as={FileArchive} size="md" />
                              </Flex>
                              <Text fontWeight="900" color="var(--palworld-fg)">
                                {status === "parsing"
                                  ? t("upload.parsing")
                                  : t("upload.drop_title")}
                              </Text>
                            </Stack>
                          )}
                        </FileDropzone>

                        {status === "parsing" ? (
                          <Alert.Root status="info" aria-live="polite">
                            <AppIcon
                              as={LoaderCircle}
                              size="sm"
                              color="var(--palworld-loading-accent)"
                              animation="spin 1s linear infinite"
                              flexShrink={0}
                              aria-hidden="true"
                            />
                            <Alert.Description flex="1">
                              {t("upload.parsing")}
                            </Alert.Description>
                            <Button
                              type="button"
                              size="xs"
                              variant="outline"
                              flexShrink={0}
                              onClick={closeSaveDialog}
                            >
                              {t("upload.cancel")}
                            </Button>
                          </Alert.Root>
                        ) : null}

                        {saveErrorMessage ? (
                          <Alert.Root status="error" role="alert">
                            <Alert.Indicator />
                            <Alert.Description>
                              {saveErrorMessage}
                            </Alert.Description>
                          </Alert.Root>
                        ) : null}

                        {preparedUpload && status !== "parsing" ? (
                          <Stack gap={2.5}>
                            <Text
                              fontSize="sm"
                              color="var(--palworld-fg-muted)"
                              lineHeight="1.65"
                            >
                              {t("upload.payload_ready", {
                                count: preparedUpload.pals.length,
                              })}
                            </Text>
                            <HStack
                              justify="space-between"
                              align="center"
                              gap={3}
                              flexWrap="wrap"
                            >
                              <Text
                                flex="1 1 16rem"
                                fontSize="xs"
                                color="var(--palworld-fg-subtle)"
                                lineHeight="1.55"
                              >
                                {t("upload.clear_description")}
                              </Text>
                              <Button
                                data-testid="clear-imported-save"
                                type="button"
                                size="sm"
                                variant="outline"
                                color="var(--palworld-error-fg)"
                                borderColor="var(--palworld-error-border)"
                                onClick={clearImportedSave}
                              >
                                {t("upload.clear_action")}
                              </Button>
                            </HStack>
                          </Stack>
                        ) : null}

                        {!preparedUpload ? (
                          <Collapsible.Root
                            open={saveLocationsOpen}
                            onOpenChange={(details) =>
                              setSaveLocationsOpen(details.open)
                            }
                            ids={{
                              root: "palworld-save-locations-root",
                              trigger: "palworld-save-locations-trigger",
                              content: "palworld-save-locations",
                            }}
                          >
                            <Stack
                              gap={3}
                              borderTopWidth="1px"
                              borderColor="var(--palworld-border-muted)"
                              pt={3}
                            >
                              <Collapsible.Trigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  h="auto"
                                  minH={12}
                                  px={3}
                                  py={2.5}
                                  justifyContent="space-between"
                                  textAlign="left"
                                  borderColor="var(--palworld-warning-border)"
                                  bg="var(--palworld-warning-bg)"
                                  _hover={{
                                    borderColor:
                                      "var(--palworld-warning-hover-border)",
                                    bg: "var(--palworld-warning-hover-bg)",
                                  }}
                                >
                                  <HStack gap={2.5} align="start" minW={0}>
                                    <AppIcon
                                      as={FolderOpen}
                                      size="sm"
                                      color="var(--palworld-warning-fg)"
                                      flexShrink={0}
                                      aria-hidden="true"
                                    />
                                    <Stack gap={1} minW={0}>
                                      <Text
                                        fontSize="sm"
                                        fontWeight="900"
                                        color="var(--palworld-fg)"
                                      >
                                        {t("save_locations.title")}
                                      </Text>
                                      <Text
                                        display={{ base: "none", md: "block" }}
                                        fontSize="sm"
                                        color="var(--palworld-fg-muted)"
                                        lineHeight="1.6"
                                        whiteSpace="normal"
                                      >
                                        {t("save_locations.description")}
                                      </Text>
                                    </Stack>
                                  </HStack>
                                  <AppIcon
                                    as={ChevronDown}
                                    size="sm"
                                    color="var(--palworld-warning-fg)"
                                    flexShrink={0}
                                    transform={
                                      saveLocationsOpen
                                        ? "rotate(180deg)"
                                        : "rotate(0deg)"
                                    }
                                    transition="transform 160ms ease-out"
                                    aria-hidden="true"
                                  />
                                </Button>
                              </Collapsible.Trigger>

                              <Collapsible.Content animation="none">
                                <Stack gap={2} pt={1}>
                                  <SimpleGrid
                                    role="group"
                                    aria-label={t("save_locations.title")}
                                    columns={5}
                                    gap={1}
                                  >
                                    {SAVE_LOCATION_KEYS.map((key) => (
                                      <AppTooltip
                                        key={key}
                                        content={t(
                                          `save_locations.tabs.${key}`,
                                        )}
                                      >
                                        <Button
                                          type="button"
                                          size="xs"
                                          minW={0}
                                          h={14}
                                          px={1}
                                          gap={0.5}
                                          flexDirection="column"
                                          borderWidth="1px"
                                          borderColor={
                                            saveLocationKey === key
                                              ? "var(--palworld-accent-solid)"
                                              : "var(--palworld-border-strong)"
                                          }
                                          borderRadius="sm"
                                          bg={
                                            saveLocationKey === key
                                              ? "var(--palworld-accent-solid)"
                                              : "var(--palworld-surface-a82)"
                                          }
                                          color={
                                            saveLocationKey === key
                                              ? "var(--palworld-highlight)"
                                              : "var(--palworld-fg)"
                                          }
                                          fontSize="sm"
                                          fontWeight="900"
                                          whiteSpace="nowrap"
                                          aria-pressed={saveLocationKey === key}
                                          aria-label={t(
                                            `save_locations.tabs.${key}`,
                                          )}
                                          _hover={{
                                            borderColor:
                                              "var(--palworld-accent-border)",
                                            bg:
                                              saveLocationKey === key
                                                ? "var(--palworld-accent-solid-hover)"
                                                : "var(--palworld-accent-hover-bg)",
                                          }}
                                          _focusVisible={{
                                            outline:
                                              "2px solid var(--palworld-focus-ring)",
                                            outlineOffset: "2px",
                                          }}
                                          onClick={() =>
                                            setSaveLocationKey(key)
                                          }
                                        >
                                          <AppIcon
                                            as={SAVE_LOCATION_ICONS[key]}
                                            size="md"
                                            strokeWidth={2.25}
                                            flexShrink={0}
                                            aria-hidden="true"
                                          />
                                          {t(
                                            `save_locations.tabs_compact.${key}`,
                                          )}
                                        </Button>
                                      </AppTooltip>
                                    ))}
                                  </SimpleGrid>
                                  <Stack
                                    gap={2}
                                    borderWidth="1px"
                                    borderColor="var(--palworld-border-muted)"
                                    bg="var(--palworld-success-bg-soft)"
                                    borderRadius="sm"
                                    p={2.5}
                                  >
                                    {saveLocationKey === "game_pass" ? (
                                      <HStack
                                        gap={1.5}
                                        alignItems="flex-start"
                                        borderWidth="1px"
                                        borderColor="var(--palworld-warning-border-soft)"
                                        bg="var(--palworld-warning-bg-soft)"
                                        color="var(--palworld-warning-fg-soft)"
                                        borderRadius="sm"
                                        px={2}
                                        py={1.5}
                                      >
                                        <CircleAlert
                                          size={15}
                                          strokeWidth={2.2}
                                          aria-hidden="true"
                                        />
                                        <Text fontSize="xs" lineHeight="1.5">
                                          {t(
                                            "save_locations.items.game_pass.warning",
                                          )}
                                        </Text>
                                      </HStack>
                                    ) : null}
                                    <Box
                                      as="code"
                                      display="block"
                                      borderWidth="1px"
                                      borderColor="var(--palworld-border-soft)"
                                      bg="var(--palworld-surface-a80)"
                                      color="var(--palworld-fg)"
                                      borderRadius="md"
                                      px={2}
                                      py={1.5}
                                      fontSize="xs"
                                      lineHeight="1.55"
                                      overflowX="auto"
                                      whiteSpace="pre-wrap"
                                      overflowWrap="anywhere"
                                    >
                                      {t(
                                        `save_locations.items.${saveLocationKey}.path`,
                                      )}
                                    </Box>
                                    <Text
                                      fontSize="xs"
                                      color="var(--palworld-fg-soft)"
                                      lineHeight="1.55"
                                    >
                                      {t(
                                        `save_locations.items.${saveLocationKey}.note`,
                                      )}
                                    </Text>
                                  </Stack>
                                  <Text
                                    fontSize="xs"
                                    color="var(--palworld-fg-muted)"
                                  >
                                    {t("save_locations.backup_warning")}
                                  </Text>
                                </Stack>
                              </Collapsible.Content>
                            </Stack>
                          </Collapsible.Root>
                        ) : null}
                      </Stack>
                    </Dialog.Body>
                  </Dialog.Content>
                </Dialog.Positioner>
              </Portal>
            </Dialog.Root>

            <Stack
              data-testid="palworld-calculator-panel"
              data-workbench-mode={preparedUpload ? "inventory" : "formula"}
              position="relative"
              zIndex={2}
              mt={{ base: 0, md: "-7rem" }}
              gap={0}
              borderWidth="1px"
              borderColor="var(--palworld-workbench-border)"
              bg="var(--palworld-workbench-panel-bg)"
              borderRadius="md"
              p={{ base: 4, md: 5 }}
              boxShadow="var(--palworld-panel-shadow)"
            >
              <Tabs.Root
                data-testid="breeding-query-tabs"
                value={breedingQueryMode}
                onValueChange={(details) =>
                  handleBreedingQueryModeChange(details.value)
                }
              >
                <Tabs.List
                  display="grid"
                  w="full"
                  maxW="2xl"
                  gridTemplateColumns="repeat(2, minmax(0, 1fr))"
                  gap={2}
                  mx="auto"
                >
                  <Tabs.Trigger
                    data-testid="target-query-tab"
                    value="target"
                    disabled={calculatorControlsLocked}
                    cursor="pointer"
                    _disabled={{ cursor: "not-allowed" }}
                    minW={0}
                    minH={14}
                    px={{ base: 2, md: 4 }}
                    pt={2}
                    pb={3}
                    whiteSpace="normal"
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor="var(--palworld-border-soft)"
                    bg="var(--palworld-surface-a62)"
                    color="var(--palworld-fg-muted)"
                    _hover={{
                      bg: "var(--palworld-query-tab-hover-bg)",
                      borderColor: "var(--palworld-query-tab-hover-border)",
                      color: "var(--palworld-fg)",
                    }}
                    _focusVisible={{
                      outline: "3px solid var(--palworld-focus-ring)",
                      outlineOffset: "2px",
                    }}
                    _selected={{
                      bg: "var(--palworld-query-tab-selected-bg)",
                      color: "var(--palworld-fg)",
                      borderColor: "var(--palworld-accent-border)",
                      transform: "translateY(-1px)",
                      boxShadow:
                        "var(--palworld-inset-highlight), inset 0 -4px 0 var(--palworld-accent-border), 0 4px 10px rgba(4, 38, 48, 0.11)",
                      _hover: {
                        bg: "var(--palworld-query-tab-selected-hover-bg)",
                      },
                      _active: {
                        transform: "translateY(0)",
                      },
                    }}
                  >
                    <Flex
                      as="span"
                      w="full"
                      minW={0}
                      align="center"
                      justify="center"
                      gap={{ base: 1.5, md: 2.5 }}
                    >
                      <QueryModeIcon src={palworldTargetQueryIconHref} />
                      <Text
                        as="span"
                        minW={0}
                        fontSize={{ base: "sm", md: "md" }}
                        fontWeight="800"
                        lineHeight="1.3"
                        textAlign="center"
                        overflowWrap="anywhere"
                      >
                        {t("calculator.query_mode_target_tab")}
                      </Text>
                    </Flex>
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    data-testid="parent-query-tab"
                    value="parents"
                    disabled={calculatorControlsLocked}
                    cursor="pointer"
                    _disabled={{ cursor: "not-allowed" }}
                    minW={0}
                    minH={14}
                    px={{ base: 2, md: 4 }}
                    pt={2}
                    pb={3}
                    whiteSpace="normal"
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor="var(--palworld-border-soft)"
                    bg="var(--palworld-surface-a62)"
                    color="var(--palworld-fg-muted)"
                    _hover={{
                      bg: "var(--palworld-query-tab-hover-bg)",
                      borderColor: "var(--palworld-query-tab-hover-border)",
                      color: "var(--palworld-fg)",
                    }}
                    _focusVisible={{
                      outline: "3px solid var(--palworld-focus-ring)",
                      outlineOffset: "2px",
                    }}
                    _selected={{
                      bg: "var(--palworld-query-tab-selected-bg)",
                      color: "var(--palworld-fg)",
                      borderColor: "var(--palworld-accent-border)",
                      transform: "translateY(-1px)",
                      boxShadow:
                        "var(--palworld-inset-highlight), inset 0 -4px 0 var(--palworld-accent-border), 0 4px 10px rgba(4, 38, 48, 0.11)",
                      _hover: {
                        bg: "var(--palworld-query-tab-selected-hover-bg)",
                      },
                      _active: {
                        transform: "translateY(0)",
                      },
                    }}
                  >
                    <Flex
                      as="span"
                      w="full"
                      minW={0}
                      align="center"
                      justify="center"
                      gap={{ base: 1.5, md: 2.5 }}
                    >
                      <QueryModeIcon src={palworldParentsQueryIconHref} />
                      <Text
                        as="span"
                        minW={0}
                        fontSize={{ base: "sm", md: "md" }}
                        fontWeight="800"
                        lineHeight="1.3"
                        textAlign="center"
                        overflowWrap="anywhere"
                      >
                        {t("calculator.query_mode_parents_tab")}
                      </Text>
                    </Flex>
                  </Tabs.Trigger>
                </Tabs.List>

                <Text
                  data-testid="query-mode-description"
                  w="full"
                  maxW={{ base: "full", md: "29rem" }}
                  mx="auto"
                  mt={2}
                  px={0.5}
                  fontSize="sm"
                  lineHeight="1.5"
                  textAlign="center"
                  color="var(--palworld-fg-muted)"
                >
                  {breedingQueryMode === "target"
                    ? t("calculator.query_mode_target_description")
                    : t("calculator.query_mode_parents_description")}
                </Text>

                <Stack
                  data-testid="query-control-band"
                  gap={4}
                  mt={{ base: 4, md: 5 }}
                  px={{ base: 0, md: 1 }}
                  py={{ base: 4, md: 4.5 }}
                  borderTopWidth="1px"
                  borderBottomWidth="1px"
                  borderColor="var(--palworld-border-muted)"
                  bg="var(--palworld-surface-a28)"
                >
                  <Tabs.Content value="target" pt={0}>
                    <Grid
                      templateColumns={{
                        base: "minmax(0, 1fr)",
                        lg: "minmax(0, 1fr) auto minmax(0, 1fr)",
                      }}
                      gap={{ base: 2, lg: 3 }}
                      alignItems="start"
                    >
                      <Box>
                        <SearchCombobox
                          id="palworld-target-pal"
                          label={t("calculator.target_label")}
                          labelIconSrc={palworldChildLabelIconHref}
                          placeholder={t("calculator.target_placeholder")}
                          emptyText={t("combobox.no_results")}
                          options={palOptionsWithOwnership}
                          value={targetSpecies}
                          disabled={calculatorControlsLocked}
                          invalid={targetSpeciesInvalid}
                          errorText={
                            targetSpeciesInvalid
                              ? t("error.target_required")
                              : undefined
                          }
                          reserveErrorSpace
                          inputRef={targetSpeciesInputRef}
                          locale={locale}
                          onChange={handleTargetSpeciesChange}
                        />
                      </Box>
                      <SwapPalsButton
                        testId="swap-target-parent"
                        label={t("calculator.swap_selections")}
                        disabled={
                          calculatorControlsLocked ||
                          targetSpecies === startingSpecies
                        }
                        onClick={swapTargetAndStartingSpecies}
                      />
                      <Box>
                        <SearchCombobox
                          id="palworld-starting-pal"
                          label={t("calculator.starting_parent")}
                          labelIconSrc={palworldParentLabelIconHref}
                          placeholder={
                            preparedUpload
                              ? t("calculator.starting_parent_auto")
                              : t("calculator.starting_parent_any")
                          }
                          emptyText={t("combobox.no_results")}
                          options={palOptionsWithOwnership}
                          value={startingSpecies}
                          disabled={calculatorControlsLocked}
                          locale={locale}
                          onChange={handleStartingSpeciesChange}
                        />
                        {preparedUpload && !startingSpecies ? (
                          <Text
                            data-testid="starting-parent-auto-hint"
                            mt={1.5}
                            fontSize="xs"
                            color="var(--palworld-fg-muted)"
                            lineHeight="1.5"
                          >
                            {t("calculator.starting_parent_auto_hint")}
                          </Text>
                        ) : null}
                      </Box>
                    </Grid>
                  </Tabs.Content>

                  <Tabs.Content value="parents" pt={0}>
                    <Grid
                      templateColumns={{
                        base: "minmax(0, 1fr)",
                        lg: "minmax(0, 1fr) auto minmax(0, 1fr)",
                      }}
                      gap={{ base: 2, lg: 3 }}
                      alignItems="start"
                    >
                      <Box>
                        <SearchCombobox
                          id="palworld-parent-a"
                          label={t("calculator.parent_a")}
                          labelIconSrc={palworldParentLabelIconHref}
                          placeholder={t("calculator.parent_placeholder")}
                          emptyText={t("combobox.no_results")}
                          options={palOptionsWithOwnership}
                          value={parentASpecies}
                          disabled={calculatorControlsLocked}
                          invalid={parentSpeciesInvalid}
                          errorText={
                            parentSpeciesInvalid
                              ? t("error.parent_required")
                              : undefined
                          }
                          reserveErrorSpace
                          inputRef={parentASpeciesInputRef}
                          locale={locale}
                          onChange={handleParentASpeciesChange}
                        />
                      </Box>
                      <SwapPalsButton
                        testId="swap-parents"
                        label={t("calculator.swap_selections")}
                        disabled={
                          calculatorControlsLocked ||
                          parentASpecies === parentBSpecies
                        }
                        onClick={swapParentSpecies}
                      />
                      <Box>
                        <SearchCombobox
                          id="palworld-parent-b"
                          label={t("calculator.parent_b")}
                          labelIconSrc={palworldParentLabelIconHref}
                          placeholder={t("calculator.parent_placeholder")}
                          emptyText={t("combobox.no_results")}
                          options={palOptionsWithOwnership}
                          value={parentBSpecies}
                          disabled={calculatorControlsLocked}
                          locale={locale}
                          onChange={handleParentBSpeciesChange}
                        />
                      </Box>
                    </Grid>
                  </Tabs.Content>

                  <Stack
                    data-testid="query-followup-rows"
                    gap={3}
                    pt={3}
                    borderTopWidth="1px"
                    borderColor="var(--palworld-border-muted)"
                  >
                    {!preparedUpload ? (
                      breedingQueryMode === "target" ? (
                        <SaveImportPrompt
                          testId="passive-selection-locked"
                          linkTestId="passive-import-link"
                          prefix={
                            importSaveLinkIndex >= 0
                              ? passiveLockedMessage.slice(
                                  0,
                                  importSaveLinkIndex,
                                )
                              : undefined
                          }
                          linkLabel={
                            importSaveLinkIndex >= 0
                              ? importSaveLinkLabel
                              : passiveLockedMessage
                          }
                          suffix={
                            importSaveLinkIndex >= 0
                              ? passiveLockedMessage.slice(
                                  importSaveLinkIndex +
                                    importSaveLinkLabel.length,
                                )
                              : undefined
                          }
                          disabled={calculatorControlsLocked}
                          onClick={() => setSaveDialogOpen(true)}
                        />
                      ) : (
                        <SaveImportPrompt
                          testId="parent-save-import-prompt"
                          linkTestId="parent-save-import-link"
                          linkLabel={importSaveLinkLabel}
                          suffix={t("upload.action_suffix")}
                          inventoryExamples={{
                            owned: ownedInventoryExampleLabel,
                            missing: missingInventoryExampleLabel,
                          }}
                          disabled={calculatorControlsLocked}
                          onClick={() => setSaveDialogOpen(true)}
                        />
                      )
                    ) : null}

                    {preparedUpload ? (
                      <HStack
                        data-testid="shared-save-control"
                        gap={2}
                        w="full"
                        minW={0}
                        minH={10}
                        justify="space-between"
                        flexWrap="wrap"
                        px={3}
                        py={2}
                        borderWidth="1px"
                        borderColor="var(--palworld-success-border)"
                        borderRadius="sm"
                        bg="var(--palworld-success-bg-soft)"
                      >
                        <>
                          <Button
                            data-testid="imported-save-manage"
                            type="button"
                            size="sm"
                            variant="plain"
                            h="auto"
                            minW={0}
                            p={0}
                            color="var(--palworld-success-fg)"
                            disabled={calculatorControlsLocked}
                            onClick={() => setSaveDialogOpen(true)}
                          >
                            <AppIcon
                              as={FileArchive}
                              size="sm"
                              aria-hidden="true"
                            />
                            {t("upload.ready_action", {
                              count: preparedUpload.pals.length,
                            })}
                          </Button>
                          <HStack gap={3} flexShrink={0}>
                            <Button
                              data-testid="reread-imported-save"
                              type="button"
                              size="sm"
                              variant="plain"
                              h="auto"
                              p={0}
                              color="var(--palworld-success-fg)"
                              disabled={calculatorControlsLocked}
                              onClick={() => setSaveDialogOpen(true)}
                            >
                              <AppIcon
                                as={FolderOpen}
                                size="sm"
                                aria-hidden="true"
                              />
                              {t("upload.reread_action")}
                            </Button>
                            <Button
                              data-testid="clear-imported-save-shortcut"
                              type="button"
                              size="sm"
                              variant="plain"
                              h="auto"
                              p={0}
                              color="var(--palworld-error-fg)"
                              disabled={calculatorControlsLocked}
                              onClick={clearImportedSave}
                            >
                              <AppIcon as={X} size="sm" aria-hidden="true" />
                              {commonT("clear")}
                            </Button>
                          </HStack>
                        </>
                      </HStack>
                    ) : null}

                    {breedingQueryMode === "target" &&
                    (preparedUpload || selectedPassiveIds.length > 0) ? (
                      <Stack gap={3}>
                        <HStack gap={2} align="center" flexWrap="wrap">
                          <Text
                            fontSize="sm"
                            fontWeight="900"
                            color="var(--palworld-fg)"
                          >
                            {t("calculator.passives")}
                          </Text>
                          <Badge
                            bg="var(--palworld-success-bg)"
                            color="var(--palworld-success-fg)"
                          >
                            {t("calculator.passive_count", {
                              count: selectedPassiveIds.length,
                            })}
                          </Badge>
                        </HStack>

                        <Stack
                          ref={passivePickerSectionRef}
                          tabIndex={-1}
                          gap={3}
                        >
                          <SimpleGrid
                            data-testid="target-passive-slot-grid"
                            className="palworld-selected-passive-grid"
                            gap={2}
                          >
                            {Array.from(
                              { length: MAX_PASSIVE_SELECTION },
                              (_, index) => {
                                const passiveId = selectedPassiveIds[index];

                                if (passiveId) {
                                  return (
                                    <SelectedPassiveSkill
                                      key={passiveId}
                                      passiveId={passiveId}
                                      locale={locale}
                                      disabled={
                                        status === "planning" ||
                                        status === "parsing"
                                      }
                                      readOnly={!preparedUpload}
                                      onSelect={openPassivePicker}
                                      onRemove={() => togglePassive(passiveId)}
                                    />
                                  );
                                }

                                return (
                                  <Box
                                    key={`empty-passive-${index}`}
                                    data-testid="target-passive-slot"
                                    className="palworld-selected-passive"
                                    minW={0}
                                  >
                                    <Button
                                      data-testid="passive-picker-trigger"
                                      className="palworld-passive-slot-add"
                                      type="button"
                                      variant="outline"
                                      h="auto"
                                      minH={0}
                                      minW={0}
                                      p={0}
                                      borderColor="var(--palworld-border)"
                                      bg="var(--palworld-surface)"
                                      color="var(--palworld-fg-muted)"
                                      _hover={{
                                        borderColor:
                                          "var(--palworld-accent-border)",
                                        bg: "var(--palworld-surface-subtle)",
                                        color: "var(--palworld-accent)",
                                      }}
                                      aria-label={t(
                                        "calculator.passive_select_action",
                                      )}
                                      disabled={
                                        !preparedUpload ||
                                        status === "planning" ||
                                        status === "parsing"
                                      }
                                      onClick={openPassivePicker}
                                    >
                                      <AppIcon
                                        as={Plus}
                                        size="md"
                                        aria-hidden="true"
                                      />
                                    </Button>
                                    <Box
                                      as="span"
                                      w={8}
                                      h={8}
                                      aria-hidden="true"
                                    />
                                  </Box>
                                );
                              },
                            )}
                          </SimpleGrid>

                          <PassiveSkillPickerDialog
                            open={passivePickerOpen}
                            options={passiveOptionsWithOwnership}
                            selectedValues={selectedPassiveIds}
                            locale={locale}
                            inputRef={passivePickerInputRef}
                            finalFocusEl={resolvePassivePickerFinalFocus}
                            onToggle={togglePassive}
                            onClose={closePassivePicker}
                          />
                        </Stack>
                      </Stack>
                    ) : null}

                    <Stack
                      data-testid="query-submit-row"
                      w="full"
                      align="center"
                    >
                      <Button
                        data-testid="breeding-query-submit"
                        className="palworld-calculate-action"
                        type="button"
                        size="lg"
                        w={{ base: "full", md: "20rem" }}
                        maxW="full"
                        h="auto"
                        minH={12}
                        px={5}
                        py={3}
                        whiteSpace="normal"
                        textAlign="center"
                        lineHeight="1.35"
                        overflowWrap="anywhere"
                        bg="var(--palworld-accent-solid)"
                        color="var(--palworld-accent-contrast)"
                        borderWidth="1px"
                        borderColor="var(--palworld-accent-border)"
                        borderRadius="md"
                        _hover={{ bg: "var(--palworld-accent-solid-hover)" }}
                        _disabled={{
                          opacity: 0.56,
                          cursor: "not-allowed",
                        }}
                        disabled={calculatorControlsLocked}
                        loading={
                          status === "planning" ||
                          (breedingQueryMode === "parents" &&
                            hasParentBreedingQuery &&
                            parentBreedingDataStatus === "loading")
                        }
                        onClick={handleSubmitBreedingQuery}
                      >
                        <AppIcon as={Search} size="sm" aria-hidden="true" />
                        <Text as="span" minW={0} overflowWrap="anywhere">
                          {status === "planning" ||
                          (breedingQueryMode === "parents" &&
                            hasParentBreedingQuery &&
                            parentBreedingDataStatus === "loading")
                            ? t("calculator.planning")
                            : breedingQueryMode === "target" &&
                                targetSpecies &&
                                preparedUpload
                              ? t("calculator.plan_inventory")
                              : t("calculator.plan_formula")}
                        </Text>
                      </Button>
                    </Stack>
                  </Stack>
                </Stack>
              </Tabs.Root>
            </Stack>
          </Stack>

          <Box
            ref={resultsRef}
            w="full"
            maxW={CALCULATOR_CONTENT_MAX_WIDTH}
            mx="auto"
            scrollMarginTop="calc(4.25rem + env(safe-area-inset-top))"
          />
          {showParentBreedingResults &&
          parentBreedingDataStatus === "loading" ? (
            <HStack
              data-testid="parent-breeding-loading"
              w="full"
              maxW={CALCULATOR_CONTENT_MAX_WIDTH}
              mx="auto"
              gap={3}
              borderWidth="1px"
              borderColor="var(--palworld-loading-border)"
              borderRadius="md"
              bg="var(--palworld-loading-bg)"
              color="var(--palworld-loading-fg)"
              px={4}
              py={3}
              aria-live="polite"
            >
              <AppIcon
                as={LoaderCircle}
                size="sm"
                color="var(--palworld-loading-accent)"
                animation="spin 1s linear infinite"
                aria-hidden="true"
              />
              <Text fontSize="sm">{t("results.parent_loading")}</Text>
            </HStack>
          ) : null}
          {showParentBreedingResults && parentBreedingDataStatus === "ready" ? (
            <ParentBreedingResults
              outcomes={parentBreedingOutcomes}
              locale={locale}
              query={parentRouteQuery}
              ownedCounts={palOwnedCounts}
              hasImportedSave={preparedUpload !== null}
              onQueryChange={setParentRouteQuery}
            />
          ) : null}
          {showTargetBreedingResults ? (
            <Stack
              id="palworld-target-results"
              w="full"
              maxW={CALCULATOR_CONTENT_MAX_WIDTH}
              mx="auto"
              gap={4}
            >
              <HStack
                justify="space-between"
                align="start"
                gap={3}
                flexWrap="wrap"
              >
                <Stack gap={1}>
                  <Heading
                    as="h2"
                    fontSize={{ base: "xl", md: "2xl" }}
                    color="var(--palworld-accent-contrast)"
                  >
                    {t("results.title")}
                  </Heading>
                  {plan.mode === "inventory" ? (
                    <Text
                      color="var(--palworld-canvas-fg-muted)"
                      fontSize="sm"
                      lineHeight="1.65"
                    >
                      {t("results.summary", {
                        inventoryCount: plan.inventoryCount,
                      })}
                    </Text>
                  ) : null}
                </Stack>
                <HStack gap={2} flexWrap="wrap">
                  <Badge
                    bg="var(--palworld-success-bg)"
                    color="var(--palworld-success-fg)"
                  >
                    {t("results.route_count", {
                      count: normalizeResultsSearchText(targetRouteQuery)
                        ? filteredTargetRouteCount
                        : totalRouteCount,
                    })}
                  </Badge>
                </HStack>
              </HStack>

              {plan.mode === "inventory" &&
              plan.desiredPassiveIds.length > 0 ? (
                <HStack
                  data-testid="inventory-inheritance-notice"
                  gap={2}
                  align="start"
                  color="var(--palworld-canvas-fg-muted)"
                >
                  <AppIcon
                    as={CircleAlert}
                    size="sm"
                    mt={0.5}
                    flexShrink={0}
                    aria-hidden="true"
                  />
                  <Text fontSize="xs" lineHeight="1.55">
                    {t("routes.inheritance_notice")}
                  </Text>
                </HStack>
              ) : null}
              {plan.mode === "formula" && plan.startingSpecies ? (
                <HStack
                  data-testid="formula-starting-parent-notice"
                  gap={2}
                  align="start"
                  color="var(--palworld-canvas-fg-muted)"
                >
                  <AppIcon
                    as={CircleAlert}
                    size="sm"
                    mt={0.5}
                    flexShrink={0}
                    aria-hidden="true"
                  />
                  <Text fontSize="xs" lineHeight="1.55">
                    {t("results.formula_starting_parent", {
                      pal: safePalLabel(plan.startingSpecies, locale),
                    })}
                  </Text>
                </HStack>
              ) : null}

              <SearchTruncationNotice searchMeta={plan.searchMeta} />

              {totalRouteCount === 0 && plan.ownedTargetSources.length === 0 ? (
                resolveBreedingSearchResultVisibility(plan.searchMeta)
                  .showDefinitiveNoRoutes ? (
                  <Alert.Root status="info">
                    <Alert.Indicator />
                    <Alert.Description>
                      {plan.mode === "inventory" &&
                      startingSpecies &&
                      !palOwnedCounts.has(startingSpecies)
                        ? t("results.starting_parent_not_owned", {
                            pal: safePalLabel(startingSpecies, locale),
                          })
                        : t("results.no_routes")}
                    </Alert.Description>
                  </Alert.Root>
                ) : null
              ) : (
                <Stack gap={5}>
                  {plan.mode === "inventory" &&
                  plan.ownedTargetSources.length > 0 ? (
                    <HStack
                      gap={3}
                      align="start"
                      borderWidth="1px"
                      borderColor="var(--palworld-result-success-border)"
                      bg="var(--palworld-result-success-bg)"
                      borderRadius="md"
                      p={3.5}
                    >
                      <AppIcon
                        as={CheckCircle2}
                        size="md"
                        color="var(--palworld-success-fg)"
                        flexShrink={0}
                      />
                      <Stack gap={0.5}>
                        <Text fontWeight="900" color="var(--palworld-fg)">
                          {t("results.target_already_owned", {
                            count: plan.ownedTargetSources.length,
                          })}
                        </Text>
                        <Text
                          fontSize="sm"
                          color="var(--palworld-fg-muted)"
                          lineHeight="1.6"
                        >
                          {t("results.target_already_owned_description")}
                        </Text>
                      </Stack>
                    </HStack>
                  ) : null}

                  {totalRouteCount > 0 ? (
                    <Stack gap={3}>
                      <ResultsSearchToolbar
                        id="palworld-breeding-results-search"
                        resultsId="palworld-target-results"
                        value={targetRouteQuery}
                        label={t("results.search_label")}
                        placeholder={t("results.search_placeholder")}
                        onQueryChange={setTargetRouteQuery}
                      />
                      <OwnedRouteSourcesContext.Provider
                        value={ownedRouteSourcesById}
                      >
                        <RouteCollection
                          key={createPalworldRouteCollectionRevision(plan)}
                          routes={allRoutes}
                          locale={locale}
                          mode={plan.mode}
                          desiredPassiveIds={plan.desiredPassiveIds}
                          query={targetRouteQuery}
                          searchMeta={plan.searchMeta}
                          recommendedRouteKeys={recommendedRouteKeys}
                        />
                      </OwnedRouteSourcesContext.Provider>
                    </Stack>
                  ) : null}
                </Stack>
              )}
            </Stack>
          ) : null}

          <Box
            as="footer"
            borderTopWidth="1px"
            borderColor="rgba(255, 248, 229, 0.24)"
            pt={4}
            pb={2}
          >
            <Stack gap={2} color="rgba(255, 248, 229, 0.76)">
              <HStack gap={3} flexWrap="wrap">
                <Text
                  fontSize="sm"
                  fontWeight="800"
                  color="var(--palworld-accent-contrast)"
                >
                  {t("open_source.title")}
                </Text>
                <Link
                  href="https://github.com/cratexnet/palworld-save-reader"
                  target="_blank"
                  rel="external noopener noreferrer"
                >
                  <Text as="span" fontSize="sm" textDecoration="underline">
                    {t("open_source.source")}
                  </Text>
                </Link>
                <Link
                  href="/games/palworld/breeding/app/COPYING"
                  target="_blank"
                  rel="license noopener noreferrer"
                >
                  <Text as="span" fontSize="sm" textDecoration="underline">
                    {t("open_source.license")}
                  </Text>
                </Link>
              </HStack>
              <Text fontSize="xs" lineHeight="1.6">
                {t("open_source.description")} {t("open_source.unofficial")}
              </Text>
            </Stack>
          </Box>
        </Stack>
      </Box>
    </>
  );
}

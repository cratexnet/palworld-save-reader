import {
  createPalworldV1CatalogGameData,
  PALWORLD_V1_METADATA,
} from "../../src/data/palworld-v1-catalog";
import { applyRuntimeGameLocalizations } from "../../src/palworld-localization";
import type { RuntimeLanguagePack } from "./i18n";

export const gameData = createPalworldV1CatalogGameData();
export { PALWORLD_V1_METADATA };

export function applyRuntimeLanguagePack(pack: RuntimeLanguagePack) {
  applyRuntimeGameLocalizations(gameData, pack);
}

# Palworld Save Reader

Open-source browser-side Palworld save reader used by the CrateX.app Palworld
Breeding Calculator.

This repository is the public save-reading and thin-client boundary for the
calculator. Its independent capability is to inspect a `Level.sav` locally in
the browser, extract owned Pal inventory rows, and build an anonymized compact
gzip payload. It also contains the browser UI and API contracts needed to
display calculator results.

The current release is `0.1.0`.

It intentionally does not contain the private server-side breeding route search
implementation.

## Boundary

Included:

- Palworld `.sav` header parsing, zlib decompression, and the repository-owned
  `palworld-ooz` GPL Oodle decoder.
- GVAS subset extraction for owned Pals and passive skills.
- Compact owned-Pals payload encoding/decoding.
- Public breeding-routes API request/response TypeScript contracts.
- Palworld 1.0 catalog with 299 selectable Pals and 115 passive skills. This
  includes 288 numbered Pals and 11 unnumbered Terraria collaboration Pals.
- Static-data client and schemas for direct child/parent and parent/parent
  formula lookups.
- The English standalone UI catalog.
- React and Chakra UI standalone calculator interface.

Excluded:

- Private 1-3 generation route planning and ranking logic.
- Private route search, ranking, API policy, account, billing, and internal
  CrateX.app infrastructure code.
- CrateX.app translations and deployment language packs.
- Versioned direct-breeding formula shards. Clean builds fetch the public
  read-only CrateX.app dataset by default; deployments may override its base URL.
- Raw save upload handling. Raw `.sav` files should stay local to the browser.

## Oodle saves

Palworld `PlM` saves need Oodle decompression. The decoder is loaded only when a
selected save requires it:

```ts
import {
  createPreparedOwnedPalsUploadFromSaveBytes,
  encodeOwnedPalsPayloadUpload,
} from "palworld-save-reader/public-client";
import { loadOozWasmPalworldOodleDecoder } from "palworld-save-reader/ooz-wasm";

const saveBytes = new Uint8Array(await file.arrayBuffer());
const prepared = createPreparedOwnedPalsUploadFromSaveBytes({
  saveBytes,
  oodleDecoder: await loadOozWasmPalworldOodleDecoder(),
});

const encoded = encodeOwnedPalsPayloadUpload(prepared);
const uploadBody = encoded.body;
```

Generated Pal IDs use per-upload values such as `pal-1`; raw save instance UUIDs
are not included in the upload payload.

## License

The source code is licensed under GPL-3.0-or-later. See `LICENSE`.

The generated Palworld 1.0 catalog includes source attribution in
`src/data/palworld-v1.LICENSE.txt`. The reduced `palworld-ooz` decoder includes
its complete preferred source, build instructions, upstream attribution, and
modification notice under `vendor/palworld-ooz/`.

This repository does not redistribute Palworld artwork, Pal icons, game UI
textures, or CrateX.app logo files. See `BRAND_AND_ASSET_NOTICE.md` and
`THIRD_PARTY_NOTICES.md`.

This is an unofficial fan-made project and is not affiliated with Pocketpair.

## Development

```bash
corepack enable
pnpm install
pnpm test
pnpm type-check
pnpm build
pnpm build:app
```

Browser workbench:

```bash
pnpm dev:app
pnpm build:app
```

A clean checkout enables English only and reads direct-breeding formula shards
from the public CrateX.app endpoint. A deployment can enable additional locales
or use another compatible shard host without bundling them into this source tree:

```bash
VITE_PALWORLD_AVAILABLE_LOCALES="en,de,ja" \
VITE_PALWORLD_LANGUAGE_PACK_BASE_URL="/games/palworld/breeding/language-packs/v1" \
VITE_PALWORLD_BREEDING_DATA_BASE_URL="https://cratex.app/games/palworld/breeding/data/v2" \
pnpm build:app
```

CrateX.app uses the following exact browser-build configuration before copying
the independent artifact into its production static mount:

```bash
VITE_PALWORLD_AVAILABLE_LOCALES="en,zh-TW,zh-CN,ja,ko,th,id,vi,fr,de,es,es-MX,it,pl,pt-BR,ru,tr" \
VITE_PALWORLD_ASSET_BASE_URL="/games/palworld/breeding/assets" \
VITE_PALWORLD_LANGUAGE_PACK_BASE_URL="/games/palworld/breeding/language-packs/v1" \
VITE_PALWORLD_BREEDING_DATA_BASE_URL="/games/palworld/breeding/data/v2" \
pnpm build:app
```

Each deployment language pack is a versioned JSON file containing UI messages,
shared labels, optional language display names, Pal names, and passive-skill
names and descriptions. Missing, invalid, or unreachable packs fall back to the
bundled English UI.

`VITE_PALWORLD_BREEDING_DATA_BASE_URL` overrides the public hosted shard origin
used by no-save formula and parent-pair queries. Save-derived planning still uses
the configured API endpoint.

The public build uses letter avatars, CSS passive-skill surfaces, and code-owned
icons. A deployment may provide a separate Palworld asset package by setting
`VITE_PALWORLD_ASSET_BASE_URL` before `pnpm build:app`. The base URL may contain
`pals/`, `hero/`, and `passives/` directories using the filenames referenced by
the client. Those optional files are not part of this repository or its GPL
license.

The production app is built with the static base
`/games/palworld/breeding/app/`. CrateX.app copies that independent
artifact into its static mount; it does not bundle this frontend into the
private Web application. CrateX.app supplies its visual assets, runtime language
packs, and versioned breeding-data shards as separate deployment data.

The hosted CrateX.app breeding-routes API is anonymous but origin-restricted and
rate-limited service. This repository contains its request and response
contracts, not the private route-search implementation or a promise of
unrestricted third-party API access.

To smoke-test a copied local save without uploading the raw `.sav`:

```bash
pnpm smoke:real-save /path/to/Level.sav
```

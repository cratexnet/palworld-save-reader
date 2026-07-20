# Third-party notices

## Palworld catalog data

The generated Palworld 1.0 catalog is derived from `tylercamp/palcalc` commit
`431b217b0f78bbef400baaa3aea20c8e99e9444c`, Copyright 2024 Tyler Camp, under
the MIT License. The complete license text is preserved in
`src/data/palworld-v1.LICENSE.txt`.

Formula cross-check and supplemental source metadata record their source URLs
and capture dates in `src/data/palworld-v1-catalog.ts`. The public catalog
contains English names and descriptions only. Facts and names related to
Palworld remain subject to the rights of their respective owners.

## Palworld Oodle decoder

`vendor/palworld-ooz` is derived from `SnosMe/ooz-wasm` commit
`ebed82851988add824e092dc4db320c8fa39aaca`, package version `2.0.0`, by
Alexander Drozdov under `GPL-3.0-or-later`.

The retained decompressor implementation in `vendor/palworld-ooz/lib/kraken.cpp`
is Copyright (C) 2016, Powzix and includes its original GPL notice. This project
modified that source on 2026-07-13 to remove the LZNA and Bitknit decoder paths.
The fork retains decoder types 6 (Kraken), 10 (Mermaid), and 12 (Leviathan).
See `vendor/palworld-ooz/NOTICE.md` for the complete upstream and modification
record and `vendor/palworld-ooz/LICENSE` for the GPL text.

## Bundled browser dependencies

The production build includes runtime code from React, React DOM, Chakra UI,
Ark UI, Emotion, Zag, Floating UI, Lucide, fflate, and their transitive
dependencies. These packages are distributed under permissive licenses,
including MIT, Apache-2.0, BSD-3-Clause, ISC, and 0BSD.

Vite derives the exact dependency set from each production bundle and emits
the complete copyright notices and license texts as
`dist-app/THIRD_PARTY_LICENSES.md`. Distributions of the built application must
retain that generated file. The vendored GPL decoder is documented separately
above because Vite's browser-bundle license collector does not include worker
dependencies.

## Palworld and CrateX.app marks

Palworld is a trademark of Pocketpair, Inc. This project is unofficial and is
not affiliated with or endorsed by Pocketpair.

CrateX.app names and wordmarks are not granted under the software license. See
`BRAND_AND_ASSET_NOTICE.md`.

# Third-party visual assets

## KayKit — Character Pack: Adventurers 1.0 (Mage)

- **Creator:** Kay Lousberg / KayKit Game Assets
- **Original source:** https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0
- **Asset:** `addons/kaykit_character_pack_adventures/Characters/gltf/Mage.glb`
- **Source commit (immutable):** `672074b73ba276876a19e8816ecdc5241817ab47`
- **Git blob SHA-1:** `c89f19f6e707f6e07e4632a08876bd6d0172b082`
- **Upstream license:** Creative Commons Zero (CC0), https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0/blob/672074b73ba276876a19e8816ecdc5241817ab47/LICENSE.txt
- **Size:** 3,589,240 bytes before bundling
- **Usage:** optional QUEST RUN WebGL prototype. The existing authored SVG remains the full-function 2D fallback.
- **Retrieval:** `npm run vendor:3d` downloads this exact file from GitHub's pinned source commit and validates GLB structure and Git blob hash. Vite copies it into the built site's `characters/kaykit/mage.glb`. This avoids manually creating or uploading a character illustration, does not require a runtime request to GitHub, and does not alter game scoring.
- **Cost:** no monetary purchase or license attribution requirement for this specific original model. Credit is provided voluntarily.
- **Scope:** the CC0 claim applies to **this named pack**, not all KayKit products or third-party addons. No animation retargeting, paid model, or other artwork was added.
- **Performance and accessibility:** 3D model is downloaded by the browser only in QUEST RUN with 3D enabled. WebGL failure, reduced motion, FX OFF or the user's 2D selection uses existing SVG. The large 3D model is not installed into the PWA app-shell precache, so first offline access to 3D may show 2D instead.

## KayKit — Character Pack: Skeletons 1.0 (enemy 3D prototypes)

- **Creator:** Kay Lousberg / KayKit Game Assets
- **Official source:** https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Skeletons-1.0
- **License:** CC0 / Creative Commons Zero; verified in the original author's [LICENSE.txt](https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Skeletons-1.0/blob/15b62b9bad122f72926c10fb14d622c73819fa54/LICENSE.txt)
- **Pinned upstream commit:** `15b62b9bad122f72926c10fb14d622c73819fa54`
- **Exact GLB binary blobs:**
  - Stage 1 — `Skeleton_Minion.glb` → `public/characters/kaykit/skeleton_minion.glb` — 4,814,296 bytes; Git blob `3b7e7ee4f1c8dd6dd99ddad27824ef1dc52ff12d`
  - Stage 2 — `Skeleton_Warrior.glb` → `public/characters/kaykit/skeleton_warrior.glb` — 4,863,620 bytes; Git blob `769e85c9e4cee8d1bd0952ddb3e9d26293144581`
  - Boss — `Skeleton_Mage.glb` → `public/characters/kaykit/skeleton_mage.glb` — 4,761,048 bytes; Git blob `5f85aea26b4f33b88080d6eb57d25d1ae5d84d14`
- **Provenance:** `addons/kaykit_character_pack_skeletons/Characters/gltf/` in the exact pinned commit.
- **Delivery:** existing `npm run vendor:3d` fetches and verifies exact GLB binaries (size, embedded JSON scene and no external texture/buffer dependency, Git blob SHA) before `vite build`. The browser only loads the current stage model if 3D mode is active; it does not fetch GitHub at runtime.
- **Scope:** Generic skeleton visuals are an **art prototype**, not custom sculpts of CACHE ARMOR, FAILOVER PHOENIX, LATENCY TITAN, COST LEVIATHAN or ARCHITECT DRAGON. Those logical enemy names, in-run HP and damage rules remain unchanged. The 2D SVG still shows the original monsters when 3D is disabled or unavailable. Assets are not monetized or sold separately.
- **Mobile:** these three optional models total 14.44 MB uncompressed; no 3D model is bundled in the initial HTML/CSS/JS or forced into the PWA app-shell cache. Android GPU and cache budgets remain unmeasured.

### Supply-chain notes

- Fetch is performed during the existing build; failed or mutated input aborts the build.
- The validated output is created under `public/characters/kaykit/` and ignored by Git, while the built Pages artifact contains the verified binary.
- No new GitHub workflow or additional token/credential permission is required.
- A future change to the creator's pack, commit, license or loader must revalidate this file and the original license.

## Gobkit — Free CC0 characters (QUEST RUN, 18 GLBs)

- **Original creator / licensor:** Gobkit / Alsomind Tech Co., Ltd.
- **Original source:** https://github.com/Ariescar/gobkit-free-assets
- **CC0 1.0 license:** https://github.com/Ariescar/gobkit-free-assets/blob/4e73c68fa6e8ca9d948fcc0ce7215c830a022c3b/LICENSE
- **Immutable source commit:** `4e73c68fa6e8ca9d948fcc0ce7215c830a022c3b`
- **Assets:** 10 files in `animal/` and 8 in `minion/`. Exact source paths, sizes and Git blob SHA-1 values are pinned in `scripts/vendor-gobkit-models.mjs`.
- **Verification:** `npm run vendor:3d` fetches the fixed raw files at build time and rejects altered blob hashes, unexpected bytes, GLB container errors, missing authored animations, and external textures. Verified binaries are bundled under `public/characters/gobkit/`; browser never fetches models from GitHub.
- **Animation:** original model has one baked track; segment idle 0–29 / attack 30–59 / dead 60–89 (24fps nominal), rather than playing all sequences in one loop.
- **Usage:** CC0 enemy visuals are provisional stand-ins for the original CERT//OVERDRIVE enemy IDs. No change to AWS study grading, logical names, HP or XP.
- **Credit:** visible in Settings → 使用素材・ライセンス, although not required for CC0. Three.js MIT licensing remains separate.
- **Performance:** ~2.05 MB combined on disk, only the current enemy is requested; Android GPU utilization is unmeasured.


### Phoenix firebird rendering (derived from the verified Gobkit Duck GLB)

- The game's `phoenix` visual reuses the pinned **Gobkit `animal/Duck.glb`** (CC0) as its animated body. The flame-colored body material overrides and stylized 3D wings, tail, crest and sparks are created locally in `src/reborn/phoenix3DAccent.ts` with Three.js geometry.
- There is **no additional external asset, network endpoint, or license**. The original imported GLB mesh/texture cache is never modified; overridden materials and added geometry are clone-local and disposed on unmount.
- Credits to Gobkit/Alsomind Tech remain available in Settings; this is a derived stylized firebird, **not** an officially authored Gobkit Phoenix model.

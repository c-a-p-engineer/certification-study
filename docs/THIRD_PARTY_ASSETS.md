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

### Supply-chain notes

- Fetch is performed during the existing build; failed or mutated input aborts the build.
- The validated output is created under `public/characters/kaykit/` and ignored by Git, while the built Pages artifact contains the verified binary.
- No new GitHub workflow or additional token/credential permission is required.
- A future change to the creator's pack, commit, license or loader must revalidate this file and the original license.

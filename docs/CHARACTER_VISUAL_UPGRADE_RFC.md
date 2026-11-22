# OVERDRIVE Character Visual & Game Feel — Technology RFC

Status: **researched proposal / NOT YET IMPLEMENTED**  
Date: 2026-11-22 JST  
Owner: project-specific technical research; user-visible product behavior remains governed by [SPECIFICATION.md](SPECIFICATION.md).

## 1. Decision

**Recommended sequence:**
1. **Art quality first**: switch the existing SVG-only main character to original layered raster character art (transparent WebP/PNG), while retaining SVG as the loading and accessibility fallback. Do not replace the React quiz UI.
2. **Motion second**: use bounded CSS transforms/opacity first; evaluate **Motion for React** only when a stateful timeline/choreography clearly reduces code and improves outcomes.
3. **Game renderer third**: run a **PixiJS v8 + @pixi/react** isolated prototype for an actual battle-only scene (characters, impact, particles and backgrounds) once art assets exist. Do not replace all screens or answer input with Canvas.
4. **Rigging alternatives**: assess **Rive** only if branded free-tier splash, authoring workflow, published-file policies and possible paid use are acceptable. **Spine** and **Live2D** are a later licensing/production decision, not free defaults.
5. **3D option**: **three.js + @pixiv/three-vrm / React Three Fiber** is a separate experiment for VRM characters, not a default upgrade for a small offline learning app.

**Reasoning:** A render engine cannot improve the face, silhouette, lighting, clothing detail or pose design of an underdeveloped source asset. For this game, high-quality assets with real answer-linked behavior have higher expected benefit than an engine migration.

### Grounded current baseline (inspected on master 3a0017ce, 2026-11-22)

- React + TypeScript + Vite application, GitHub Pages/static/PWA/offline workflow.
- Main character: hand-authored React SVG in src/reborn/PlayerAvatar.tsx with four slots (hair, outfit, weapon, head), and animations in src/reborn/characterStage.css.
- Battle: src/reborn/BattleStage.tsx, src/reborn/questBattleEngine.ts; distinct in-run HP, combo and hit events. Enemy: existing MonsterArt SVG.
- HOME wardrobe: src/reborn/AvatarCloset.tsx, cosmetic unlocks from unique correctly answered non-exam question IDs in src/reborn/avatarCollection.ts.
- Question grading and XP are owned by applyStudyAttempt; visual event handlers must not become alternative grading writers.
- No PixiJS, Rive, Motion, Spine or 3D runtime was added by this RFC. Live character art, FPS, memory and total asset sizes have **not** been benchmarked on a physical Android device.

## 2. Library and engine comparison (official sources checked 2026-11-22)

| Option | What it really does | Best use in OVERDRIVE | Main costs / limitations | Verdict |
| --- | --- | --- | --- | --- |
| **Layered WebP/PNG + CSS** | Better authored art plus lightweight transform/opacity animation and compositing | Hero portrait, equip previews, readable battle characters | Requires well-prepared original separate art layers; CSS is insufficient for deep mesh deformation | **P0: adopt first** |
| **Motion for React (motion/react)** | State-driven layout, springs, gestures and sequenced interaction motion; MIT repository | Head bob, anticipation, recoil, camera shake, equip reveal, one-shot battle timeline | Extra library; does not draw a high-quality character; keep event flow deterministic | **P0 experiment; install only if simpler than CSS** |
| **PixiJS v8 + @pixi/react** | 2D WebGL/WebGPU/Canvas rendering of sprites, AnimatedSprite, texture atlases, effects, particles; React integration | Real battle theater with layered character textures, hit sparks, backgrounds and loot | GPU initialization, Canvas lifecycle, SSR/offline loading, batching, Android performance, mount/teardown; higher maintenance | **P1 battle-scene vertical slice** |
| **Phaser v4** | Full 2D game framework: scene lifecycle, cameras, input, timelines, physics and animation | If QUEST RUN evolves into genuine navigable dungeon/arcade action | Duplicates React routing/UI state, more integration complexity for quiz-only screens | **Defer** |
| **Rive React WebGL2** | Rigged animated graphics and state machines using .riv authored assets | Expressive reusable main-character rig, UI state machine | Free exports currently show Rive splash; removing requires an eligible paid plan; tooling/asset creation effort; evaluate publishing constraints | **Conditional P2** |
| **Spine + spine-pixi-v8** | Industry-style 2D skeletal animation with skins/attachments | Art-rich hero and monster with expressive battle animations | Editor / runtime license eligibility and pricing must be reviewed before adoption; artist/rigger work | **Defer pending cost approval** |
| **Live2D Cubism SDK for Web** | Mesh-deformed illustrated 2D models | Expressive anime portrait, mouth/face/eye reactions | Proprietary SDK/Editor terms and potential publication license; custom integration; creator labor | **Defer pending license review** |
| **dotLottie web/React** | Plays packaged stateful/vector motion; MIT player | Rare loot reveal, medal badge, UI accents, finish animation | Not a general replacement for layered equip sprites; WASM/load overhead | **P1 for isolated UI effects only** |
| **Three.js + @pixiv/three-vrm (or R3F)** | Renders VRM 3D avatars; code MIT, **models have independent rights** | Optional real-time 3D hero / collectible pose viewer | Modeling, rigging, heavier phone GPU cost, new asset pipeline, potentially awkward 2D quiz integration | **Separate experiment** |

**Cost policy:** Treat library OSS license, editor license, artwork/model rights, hosting, runtime branding and commercial redistribution as **separate**. Zero price for a runtime does not mean zero cost to author the model. Do not install billing-dependent services or buy tools without approval.

### Official skills that are actually relevant

1. **PixiJS official skills** — https://github.com/pixijs/pixijs-skills (MIT): core v8, sprites / AnimatedSprite, assets and spritesheets, containers, performance, particles, filters. This is the best directly technical skill **if PixiJS is selected**. Official guidance documents the optional install command “npx skills add https://github.com/pixijs/pixijs-skills”; **not executed**. Inspect the selected SKILL.md and installer/manifest before use, rather than importing the whole pack as an always-on rule.
2. **Motion AI Kit** — https://github.com/motiondivision/ai-kit and https://motion.dev/docs/ai-kit-install (free MIT /motion skill, with a separate paid Motion+ feature tier). It covers event timelines, choreography and reduced-motion patterns. Installer “npx motion-ai” is **not executed**. The existing project/core motion guidelines already overlap in design principles; favor targeted reference of current Motion APIs before adding another persistent skill.
3. **LottieFiles motion-design skill** — https://github.com/LottieFiles/motion-design-skill (MIT): anticipation, timing, easing, choreography, meaningful action/reaction and motion QA. Useful as an art-direction checklist rather than a rendering engine. Do not duplicate a broad persistent skill if existing ui-motion-design and dopagaki guidance already cover the objective.
4. **PixiJS official spritesheet reference** — https://github.com/pixijs/pixijs-skills/blob/main/skills/pixijs-scene-sprite/references/animated-sprite.md : concrete playback, restart, frame completion, and pitfalls around loading textures before use.

**Skill retention decision:** no new global Tsuzuri skill now. Current core already has ui-motion-design, dopagaki-engagement-design and human-centered-interface-design. The material gap is **project-specific character asset production/verification**. If a real renderer prototype passes, add a scoped project skill under .agents/skills for the chosen asset spec, state machine, fallback and mobile tests. Do not install remote execution code on a research-only task.

## 3. Visual direction — “premium anime 2.5D”

- Maintain a legible anime face and original visual identity rather than aiming for photorealistic skin or generic 3D.
- Player: detailed hair clumps, multi-tone eyes, expression shapes, believable costume materials (cloth, leather, metal, luminous accents), accessory silhouettes; avoid extreme visual noise under 120px render size.
- Hero images and battle images share the **same character ID** and silhouette, but have separate crops/compositions: HOME portrait 3/4 body, BATTLE three-quarter full-body, REWARD close-up, CLOSET readable equipment preview.
- Define exact anchor points (head, eyes, neck, torso, left/right hands, hips, shoes and feet baseline); common canvas size, transparency, equal scale, and export bounds for every option.
- Export original artwork as transparent layers: body base, back hair, face/eyes/blink, front hair, outer costume, forearm/hand, weapon, head accessory, shadow and aura.
- Layer order must be per pose, not assumed globally: some swords and arms must render in front of the torso, others behind.
- Equip cosmetics use visual **skins/attachments**; an asset must be composable on the relevant pose. A high-resolution flat image is not automatically an animation rig or a modular equip layer.
- Maintain one optional static flattened preview per costume for low-memory devices and a no-WebGL fallback. Do not require canvas context creation for the HOME portrait.

### Asset contract for a prototype

Proposed directory (not yet created):

    public/characters/hero/v2/{manifest.json,portrait.webp,avatar-low.webp,body.webp,hair/*.webp,outfit/*.webp,weapon/*.webp,head/*.webp,faces/*.webp,fx/*.webp}
    public/characters/enemies/v2/{boss-id}/{idle.webp,hit.webp,defeat.webp,...}

Manifest fields: character ID / art version / author and rights / dimensions / anchor and layer z-order / compatible slots and poses / asset paths / optional low-res fallback / checksum. Use URLs under the Vite base path, avoiding GitHub Pages absolute-root bugs.

A single original art concept should be approved by visual inspection at **80px, 160px and 300px** before producing the 12-equipment production atlas. Otherwise every cosmetic creates rework.

## 4. Game feel must have causality

Gameplay state is source of truth; animations consume **events**, not imaginary meters. Example:

| Real event | Animation chain | Persistent effect |
| --- | --- | --- |
| Question displayed | Idle blink, cloth/hair micro-motion, breathing | None |
| Choice selected | Eye focus, hand charge, short anticipation | No correct/incorrect disclosure |
| Correct answer | Player wind-up → weapon slash → enemy hit flash → actual HP update → damage number | Only existing canonical answer writer updates study XP |
| Incorrect answer | Enemy counterattack → player stagger → actual run HP update | No extra punishment |
| Combo reaches 3 or 5 | Aura shape or weapon effect changes, impact scale rises | Reflects existing combo/game rule only |
| Boss reaches zero HP | Break armor → knockback → defeat pose → reward reveal | Only actual battle win |
| Cosmetic acquired | Flash of item silhouette → resolved item card → Equip/Keep choice | Deterministic cosmetic entitlement based on distinct correct IDs |
| Exam question | Calm pose only, no hints, no extra reward sounds | No normal practice XP or boss damage |

Suggested single visual event schema for future coding: kind, eventId, timestamp, pose, damage, combo, milestone, actor and target. Visual presentation may run independently with cancelable queues; the question answer and XP must never wait for, or depend upon, the animation. Race conditions and double-taps must not generate extra hits or unlocks.

## 5. Game ideas: ranked backlog

**P0 — visible character and answer-driven satisfaction (first short release)**

| ID | Mechanic | Player-visible purpose | Trigger / constraint |
| --- | --- | --- | --- |
| G01 | Expressive face set | Face changes by event (neutral, thinking, ready, cheerful, hurt, victorious) | No correct-answer spoilers before commit |
| G02 | Idle animation that matters | Blink, subtle breathing and occasional glance toward selected UI | Slow, low-amplitude, disabled under reduced motion |
| G03 | Wind-up and release | Choice → prepare; commit → slash; enemy damage → recoil | No input delay; correct commit required |
| G04 | Real hit-stop / impact | 50–90ms **visual-only** hit stop and layered impact card | Do not freeze timer or input |
| G05 | Enemy character identity | Distinct colors, silhouette, facial expressions, reactions per boss | No black silhouette regression |
| G06 | HOME favorite view | Always-visible beautifully authored avatar portrait | Same equip state as battle |
| G07 | Cloak/hair/material response | Short follow-through after movement gives 2.5D feel | Lightweight local transform |
| G08 | Equipment silhouette preview | See how a weapon or jacket changes the character before equipping | Clear locked/unlocked state |
| G09 | Boss entrance card | Dramatic encounter silhouette, name, HP bar | Can skip immediately |
| G10 | Contextual expression speech bubble | One short situational quip after a result, not on every tap | Does not cover choices or teach incorrect claims |

**P1 — progression, discovery and game identity**

| ID | Mechanic | Player-visible purpose | Trigger / constraint |
| --- | --- | --- | --- |
| G11 | Boss multi-phase **visual** states | Armor cracks, boss changes pose at HP thresholds | Only when actual boss HP crosses threshold; answer key unchanged |
| G12 | Unique boss loot | Guaranteed boss-themed cosmetic skin/shard | Anti-farming: real unique question records; daily cooldown if needed |
| G13 | Cosmetic album / codex | Discovered items shown with artist notes and original lore | Locked previews must not falsely imply odds |
| G14 | Equip presets | One-tap battle / study / casual outfit switching | Same owned items, no paid presets |
| G15 | Avatar affinity | Friendlier interactions after mastery milestones, not false relationship meters | Never tied to guilt or mandatory login streaks |
| G16 | Combo visuals | Different attack silhouette at 3, 5, 10 combo | Preserve actual score formula |
| G17 | Stage environment | Security fortress, resilient skyline, network tunnel, cost labyrinth | Background gradients / still parallax before GPU scene |
| G18 | Collectible banner | Finished mission visually reveals confirmed item milestone | One-shot, skippable, no fake random gacha |
| G19 | Quiz weapon families | Blade slashes, staff spells, orb pulses | Gameplay balance optional; visuals initially cosmetic |
| G20 | Loot crafting by knowledge | Convert **verified distinct solved concepts** to cosmetic unlock progress | Protect idempotent XP; avoid farmable currency |
| G21 | Personal best run trophy | Battle medals and outfit cosmetic tied to a genuine PB | Display truthful best, no leaderboard claim |
| G22 | Rare achievement scene | Full-screen illustrated victory for genuine completed run | Skip / motion settings / no endless loop |

**P2 — future expanded adventure, only if P0/P1 play well**

| ID | Mechanic | Player-visible purpose | Constraint |
| --- | --- | --- | --- |
| G23 | Roster of playable archetypes | Different character poses and cosmetic identities | Art production cost scales sharply |
| G24 | Companion mascot with job | Companion spots completed objectives and celebrates | Do not claim fake rival or AI intelligence |
| G25 | Dynamic stage camera | Small tilt, zoom and directional recoil for boss fights | Content still legible at 320px |
| G26 | Enemy attack telegraphs | Indicates boss will counterattack on next miss | Must correspond to an actual game rule |
| G27 | Branching run with collectible maps | Route selection changes environment/encounters | No fake choice where outcomes identical |
| G28 | Seasonal sets | Temporary free cosmetics and thematic bosses | No loss aversion or daily punishment |
| G29 | Asynchronous challenge card | Share seed and result image/text voluntarily | No backend required initially; no fake leaderboard |
| G30 | 3D model showcase | Rotate user-owned VRM hero in optional view | Separate 3D opt-in; never main quiz critical path |
| G31 | In-game animation gallery | Replay earned moves and boss-finisher scenes | Animation player must be lazy-loaded |
| G32 | Showcase screenshot/export | Share character look plus source-of-truth milestone | Remove learner-sensitive metrics by default |

## 6. Recommended technical architecture

    StudyAttempt / BattleEngine / AvatarCollection (existing authoritative data)
                 |
              GameEvent
                 |
          VisualDirector (cancelable state machine, no grading logic)
             /     |     \
          HOME    BATTLE   RESULT
           |         |       |
       LayeredArt  PixiCandidate  RiveCandidate
             \     |      /
           Static / SVG Fallback

- Do not bind visual frame updates to React state on every frame. Use CSS/Motion for small DOM layer choreography, canvas renderer's own ticker for actual sprites, and React only for discrete events.
- Do not instantiate PixiJS/Three on the landing screen. Lazy-load battle scene modules after route selection, prefetch after user intent when appropriate.
- Render text, buttons, answers and accessible status as React DOM above/below Canvas so keyboard and screen readers are not lost.
- On document hidden, pause ambient animation and GPU ticker; on restore, reconcile visual state to canonical HP / question index, never re-award.
- FX OFF / reduced motion: static art + values; HIGH: fewer VFX; MAXIMUM: full one-shot VFX. All modes retain a voluntary stop.
- Preserve offline cache versioning and asset fallback; network load failures must not block answering questions or progress save.
- Library dependencies should be pinned and license reviewed; assets require their own rights ledger even when using an MIT renderer.

## 7. Vertical-slice and acceptance gates

**Slice A — art replacement (default next implementation)**

- Make exactly 1 hero and 1 enemy in the approved premium anime 2.5D style, plus idle/attack/hurt/celebrate frames or layers and 2 different equip looks.
- Preserve the existing full game, XP, anti-farming, avatar collection, route logic and backup format.
- At 80px, the identity/silhouette and active weapon remain recognizable; at 300px, eyes, hair and material quality are clearly improved.
- At 320px-wide viewport, question text and 44px targets remain readable; at 360px and 400px, no clipping.
- With reduced motion or FX OFF, static character, HP values and choices work correctly.
- Verify author/license and assets. No generated image is considered a rigged model unless separated and verified.

**Slice B — Motion vs CSS**

- A/B implement same discrete event sequence (idle→anticipation→attack→hit→return) with CSS-only and Motion for React.
- Evaluate source readability, SSR/offline rendering, interaction latency, bundle delta, measured animation FPS and reduced-motion behavior. Do not select Motion merely because it exists.

**Slice C — PixiJS battle-only vertical slice**

- Render 1 hero + 1 boss + layered costume + damage popup + 1 particle effect from sprite atlas. Preserve all answer buttons in React DOM.
- Verify WebGL context loss/restoration and low-end fallback, asset preloading, memory footprint, scroll/resize responsiveness and lifecycle cleanup.
- Only migrate additional encounters if it has a demonstrable advantage over Slice B. Avoid turning quiz UI into a full Phaser game by default.

**Suggested experimental targets, not measured claims:** ≥ 50 FPS on the test Android device during battle, no frame requiring blocked answer taps, < 250 KB added JS for the initial art-only implementation, and approximately ≤ 2 MB of first-load hero art. Measure on real target hardware before treating these as gates; revise if art quality requires another tradeoff.

## 8. Official research sources (verified at review date)

- PixiJS v8 sprite/atlas/asset: https://pixijs.com/8.x/guides/components/scene-objects and https://pixijs.com/8.x/guides/components/assets
- PixiJS mobile performance: https://pixijs.com/8.x/guides/concepts/performance-tips
- Pixi React integration: https://github.com/pixijs/pixi-react
- Official PixiJS AI skills and MIT license: https://github.com/pixijs/pixijs-skills
- Motion React docs + MIT source: https://motion.dev/docs/react-animation and https://github.com/motiondivision/motion
- Motion AI Kit / free skill vs Motion+ distinction: https://motion.dev/docs/ai-kit-install
- Rive runtime support: https://github.com/rive-app/rive-docs/blob/main/feature-support.mdx
- Rive free splash, paid branding removal, CLI: https://rive.app/pricing
- Phaser 4 and React integration: https://www.phaser.io/oss/docs
- Spine PixiJS v8 and license: https://us.esotericsoftware.com/spine-pixi and https://en.esotericsoftware.com/spine-runtimes-license
- Live2D Cubism web SDK and release license: https://www.live2d.com/sdk/download/web/ and https://www.live2d.com/sdk/license/
- VRM + Three integration and separate code license: https://github.com/pixiv/three-vrm
- LottieFiles motion-design skill / MIT: https://github.com/LottieFiles/motion-design-skill
- dotLottie web player: https://github.com/LottieFiles/dotlottie-web
- MDN animation performance: https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Animation_performance_and_frame_rate

## 9. Decision status / non-goals

- **Decided:** Preserve React learning UX, use original high-quality layered 2D art first, keep cosmetic rewards deterministic and learning records authoritative, try PixiJS on a contained scene rather than a full rewrite.
- **Open:** exact final art direction/approved hero illustration, whether image parts can be separated consistently, tested phone rendering budgets, long-term renderer, licenses that incur costs.
- **Not performed:** installation of packages or external AI skills, artwork creation, performance measurement, migration, billable tool use or production release. This RFC is a research/implementation plan, not shipped behavior.

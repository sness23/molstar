# Spec: Coloring Interface for Mol* (inspired by ChimeraX `color`/`rainbow`)

**Goal:** Enable an AI-driven UI and command layer for Mol* that reproduces (and cleanly abstracts) the ChimeraX coloring feature set. No code here—just the product/tech spec another AI can implement.

---

## 1) Scope & Objects

**Renderable targets**

* **Atomic models**: atoms/bonds, cartoons/ribbons, per-atom molecular surface patches.
* **Surfaces**: molecular surfaces and non-molecular meshes (e.g., volume isosurfaces).
* **Labels**: 2D/3D (optional in v1; 3D first).
* **Pseudobonds** and **rings/nucleotide glyphs** (optional in v1; plan API).

**Selection granularity**

* Model(s) → Chain(s) → Residue(s) → Atom(s)
* Additional logical filters: secondary structure (helix/sheet/coil), polymer vs ligand/ion/solvent, residue ranges, named sets.

**Target masks (display channels)**

* `atoms` (a), `bonds` (b), `cartoons|ribbons` (c|r), `surfaces` (s), `pseudobonds` (p), `rings` (f), `labels` (l), `all` (abcspfl).
* Bonds support **halfbond** mode (each half tinted by its atom) vs **full-bond** (independent bond color).

---

## 2) Color Modes (feature parity)

### A. Simple Coloring

**What:** Assign a single color or scheme to selected items.
**Inputs:**

* `colorSpec`: named color, hex, rgba, or scheme (`byelement|byatom`, `byhet`, `bychain`, `bynucleotide`, `bymodel`, `byidentity|bypolymer`, `random`, `fromatoms|fromcartoons` → surface patch inheritance).
* `targets`: mask (see §1).
* `halfbond`: true/false (affects bond appearance).
* `transparency`: 0–100% (0 opaque, 100 fully transparent).

### B. Sequential Coloring (Rainbow)

**What:** Map an ordered palette across:

* `residues` (default): per-residue gradient within each biopolymer chain.
* `chains`: one gradient per chain entity; non-biopolymers unaffected.
* `polymers`: same biopolymer sequence → same color across models.
* `structures`: different color per atomic model.

**Inputs:** `level`, `palette`, optional `targets`, `transparency`.
**Behavior:** If selection is narrowed, the full palette maps to that subset only.

### C. Color Modification

**What:** Adjust existing colors.
**Channels:** `hue ±angle`, `saturation/lightness/whiteness/blackness/red/green/blue` with `+/-/* percent` or absolute set; `contrast [percent]` (0→no change, 100→max contrast to black/white).
**Inputs:** selection + targets.

### D. Coloring by Attribute (Value Mapping)

**What:** Continuous mapping of numerical attributes to colors.
**Attribute levels:** `atom`, `residue`, `chain`, `model`.
**Built-ins:** e.g., `bfactor`. Support user-defined attributes (e.g., map-sampled values).
**Inputs:**

* `attribute` (+ level disambiguator if needed).
* `palette` (+ `range low,high` or `full`), `average residue` (color atoms/surface by per-residue mean); `targets`, `transparency`, `noValueColor`.
* Optional `key: true` to draw a legend (UI overlay).

### E. Surface Coloring by Map Value

**What:** Color surfaces using volume data values. Variants:

* `sample`: trilinear values at surface vertices; `offset d` or `offset start,end,step` (averaging).
* `electrostatic`: like `sample`, defaults `offset=1.4Å`, `range=-10..10` (SAS rationale).
* `gradient`: color by |∇map| (gradient norm).

**Inputs:** surface selection, `mapRef` (if not same as surface), `palette`, `range`, `offset`, `outsideColor`, `update` (auto-recompute on shape changes), optional legend.

### F. Surface Coloring by Distance

**What:** Color surfaces by geometric distance fields:

* `radial`: distance from a point.
* `cylindrical`: distance from an axis (point + direction).
* `height`: distance from a plane (point + normal).

**Inputs:** `center`, `axis`, `coordinateSystem` (model reference), `palette`, `update`, optional legend.

### G. Coloring by Zone (Nearest-feature Transfer)

**What:** Color surfaces to match nearby atoms/markers within `cutoff` (Å).
**Inputs:** `near atomSelection`, `distance cutoff` (suggest ≥ 2.8 Å for mol surfaces), `bondPointSpacing` (augment atom sites along bonds), `farColor` (color or `keep`), `sharpEdges` (subdivide for crisp borders), `update`.
**Notes:** Use to transfer attribute-colored atoms to clipped surface caps.

### H. Remove Per-Vertex Surface Coloring

**What:** `single`—clear vertex colors (value, zone, coulombic, mlp, atomic-patch inheritance) and revert to model’s single color.

### I. Image-Based Surface Coloring (Texture Mapping)

**What:** Paste an image onto a surface via UVs.
**Inputs:** `file` (image path or `none` to clear), `coords`: `pole|south|sphere|vertexcolors`, `modulate` (multiply image over current color or replace), `writeColors outFile` (bake current vertex colors into an image for other tools).
**Notes:** UV assignment policy differs by `coords`; `vertexcolors` creates a unique UV per color region.

---

## 3) Palettes

**Forms supported**

1. **Named palettes**: `rainbow`, `redwhiteblue|redblue`, `bluewhitered|bluered`, `cyanwhitemaroon|cyanmaroon`, `grayscale|gray`, domain-specific (`alphafold`, `esmfold`, `pae`, `paegreen`, `paecontacts`), **ColorBrewer** (`paired-10`, `pastel2-4`, `piyg`, allow `^name` to reverse).
2. **Explicit list:** `color1:color2:...` (evenly spaced).
3. **Anchored pairs:** `"v1,color1:v2,color2:..."` (no `^` reversal recommended).
4. **External fetch:** `colourlovers-id | "Name" | "Name by Author"` (cache + license guard).

**Options:** `range low,high | full`. For sequential modes, `0..1` implicit per scope.

---

## 4) Color Names & Introspection

* **Define:** `color name <cname> <colorSpec>` (user-defined; persist in session).
* **Delete:** `color delete <cname|custom>` (cannot delete built-ins).
* **List:** `color list [all|builtin|custom]` (with swatches).
* **Show:** `color show <cname>` → rgba.

---

## 5) Parameter Semantics & Defaults

* **Transparency:** percent; overrides palette alpha when provided.
* **Halfbond:** default true for bonds; false reveals independent bond color. Respect `targets` (and `p` for pseudobonds).
* **Update:** default true for surface colorings sensitive to geometry; recompute on morph/clip/isosurface changes.
* **Electrostatic offset:** default 1.4 Å; for caps or cross-structure fields use 0 or negative per note.

---

## 6) UI/UX Design (for Mol*)

**A. Command Layer**

* Provide a **single `color` verb** with submodes: `simple`, `sequential|rainbow`, `modify`, `byAttribute`, `map {sample|electrostatic|gradient}`, `distance {radial|cylindrical|height}`, `zone`, `single`, `image`.
* Keep **positional style** plus **named options**; allow short synonyms (`seq`, `elec`, `pal`, `targ`, `ave residue`, `range`, `offset`).

**B. Panels**

* **Color Panel** with tabs mirroring modes A–I.
* **Selection chip** summarizing the current atom-spec.
* **Targets toggle bar** (a/b/c/s/p/f/l/all).
* **Palette picker** (named, ColorBrewer dropdown, custom editor, reverse toggle).
* **Legend (Key)**: on/off; draggable overlay.

**C. Surface-specific Controls**

* Offset numeric control (supports list for start,end,step).
* Distance controls: center/axis pickers, model CS dropdown.
* Zone controls: cutoff slider, sharp edges checkbox, farColor swatch, bondPointSpacing.

**D. Attribute Browser**

* List attributes by level with min/max; allow range clamp, averaging mode.
* “No value → color” fallback.

**E. Presets & Recipes**

* Quick buttons: *By element*, *By chain*, *Rainbow residues*, *Electrostatic*, *B-factor (blue-white-red)*, *Reset surface to single color*.

**F. State & Undo**

* Record operations as **idempotent actions**; support undo/redo.
* Store user colors and fetched palettes in session; persist optionally.

---

## 7) Data Model & API (abstract)

```yaml
ColorRequest:
  selection: AtomSpec | SurfaceSpec | ModelSpec
  mode:
    kind: simple | sequential | modify | attribute | map | distance | zone | single | image
    params: # per-kind (see below)
  targets: [atoms, bonds, cartoons, surfaces, pseudobonds, rings, labels] # optional
  halfbond: bool # optional
  transparency: 0..100 # optional
  legend: bool # optional

ModeParams:
  simple:
    colorSpec: Named | Hex | RGBA | Scheme(byElement|byHet|byChain|byNucleotide|byModel|byIdentity|random|fromAtoms|fromCartoons)

  sequential:
    level: residues|chains|polymers|structures
    palette: PaletteSpec

  modify:
    channel: hue|saturation|lightness|whiteness|blackness|red|green|blue|contrast
    op: add|sub|mul|set
    value: number

  attribute:
    attribute: {name: string, level?: atom|residue|chain|model}
    palette: PaletteSpec
    range: {low?: number, high?: number, full?: boolean}
    averageResidue: bool
    noValueColor?: ColorSpec

  map:
    variant: sample|electrostatic|gradient
    mapRef?: MapId
    palette: PaletteSpec
    range?: {low?: number, high?: number, full?: boolean}
    offset?: number | {start: number, end: number, step: number}
    outsideColor?: ColorSpec
    update?: bool

  distance:
    variant: radial|cylindrical|height
    center?: Vec3
    axis?: Vec3
    coordinateSystem?: ModelId
    palette: PaletteSpec
    update?: bool

  zone:
    near: AtomSpec|MarkerSpec
    cutoff: number # Å
    sharpEdges?: bool
    bondPointSpacing?: number
    farColor?: ColorSpec | "keep"
    update?: bool

  single:
    # no params

  image:
    file: string | "none"
    coords?: pole|south|sphere|vertexcolors
    modulate?: bool
    writeColors?: string
```

**PaletteSpec**

* `name` (with `reverse?: bool`) **or**
* `colors: [ColorSpec...]` **or**
* `anchors: [{value: number, color: ColorSpec}...]`
* optional `range` (for numeric mappings); for sequential, implicit `[0,1]`.

---

## 8) Selection Grammar (AtomSpec)

* Chain: `/A` or `/A,B`; Secondary structure: `& helix`, `& sheet`.
* Residues: `:12`, `:260-275`, ranges/sets.
* Combined examples:

  * `/D & helix` (chain D helices)
  * `/A,B:12,260-275` (res ranges in chains A,B)
  * `pbonds` (pseudobonds pseudo-selector)
  * `#4` (model ID), `#1 & protein` (exclude solvent/ions/ligands)

Provide both a typed selector UI and a text box; show live count preview.

---

## 9) Behavioral Notes / Rules

* **Targets precedence:** For simple/attribute modes, `what/targets` must appear **before** other trailing options in command syntax. For modify, targets can come at end (parity cue).
* **Palette vs transparency:** explicit `transparency` wins over palette alpha.
* **Sequential scoping:** Palette always spans the specified scope subset.
* **Attribute averaging:** When using atom attributes but targeting cartoons, default to **per-residue mean** unless `averageResidue: false` is set (expose toggle).
* **Range defaulting:** `full` means min/max across current selection (be careful to exclude solvent/ions if the user filtered atoms; reflect actual subset).
* **Surface caps:** To color caps by attribute, first color atoms, then `zone` to transfer onto caps.

---

## 10) Validation & Errors

* Reject `attribute` requests where attribute missing on all items; suggest `noValueColor` or checking selection.
* Clamp transparency to 0–100.
* When `image.coords` requires UVs, generate and persist per-surface; warn when conflicting with later per-vertex coloring.
* External palette fetch: enforce license; cache; graceful fallback to local palette.
* `zone` with too small cutoff on mol surfaces: soft warning with recommended ≥2.8 Å.

---

## 11) Example User Stories (for QA)

1. **Cartoon-only chain tint**
   `/D & helix` → `simple(color="sky blue", targets=["cartoons"])`

2. **Atoms-only residue highlights**
   `/A,B:12,260-275` → `simple(color="hot pink", targets=["atoms"])`

3. **Rainbow residues**
   `selection=all protein` → `sequential(level="residues")`

4. **Chain window gradient**
   `:1-50` → `sequential(level="residues", palette="rainbow")` (subset)

5. **Per-polymer cartoon gradient**
   `sequential(level="polymers", targets=["cartoons"], palette="cornflowerblue:red:gold")`

6. **B-factor map**
   `attribute(name="bfactor", selection="/A", palette="bluewhitered", range=2..30, targets=["atoms","cartoons"], averageResidue=true)`

7. **Electrostatic surface**
   `map(electrostatic, surface=#1, mapRef=#2, palette="redwhiteblue", range=-10..10, offset=1.4)`

8. **Zone to atoms with crisp borders**
   `zone(surf=#1, near=protein atoms, cutoff=3.0, sharpEdges=true, farColor="keep")`

9. **Reset surface vertex colors**
   `single(surfModel=#5)`

10. **Texture map**
    `image(surf=#3, file="earth.png", coords="sphere", modulate=false)`

---

## 12) Implementation Priorities (Phased)

**Phase 1 (MVP):** Simple, Sequential, Attribute, Zone, Single; palette system; targets; halfbond; transparency; legends.
**Phase 2:** Map-based (sample/electrostatic/gradient); Distance fields.
**Phase 3:** Modify (HSL/HWB/RGB channels); Image mapping; named color CRUD; external palettes.
**Phase 4:** 2D labels, pseudobonds/rings styling parity; advanced UV baking.

---

## 13) Testing Matrix (abbrev)

* Selections: whole model / chain / residue ranges / atom filters.
* Targets masks combos (atoms+surfaces, cartoons only, bonds halfbond on/off).
* Palettes: named, reversed, explicit, anchored; legend correctness; range clamping.
* Attribute: missing values, `averageResidue` toggles, solvent excluded.
* Surface: offset arrays; update on morph/clip; outsideColor applied.
* Zone: cutoff sweep; sharpEdges; farColor keep vs override.
* Modify: channel ops correctness; contrast behavior.
* Image: coords variants; modulate vs replace; bake & re-import.

---

This spec captures the command surface, parameters, UI affordances, data model, and edge-case behavior needed to recreate ChimeraX-style coloring workflows inside Mol*.



---
name: design
description: Design system do DownFast. Use quando estiver criando ou modificando componentes de UI, estilos CSS, cores, tipografia, elevacao, ou qualquer elemento visual do frontend. Aplica as regras do design system "Digital Kineticist" automaticamente.
user-invocable: true
---

# Design System Document

## 1. Overview & Creative North Star: "The Digital Kineticist"

The "Digital Kineticist" is the creative north star for this design system. In a category often cluttered with aggressive ads and chaotic interfaces, this system treats media downloading as a high-end editorial experience. We reject the "utilitarian tool" aesthetic in favor of a sophisticated, high-velocity workspace.

To break the "template" look, this system utilizes **Intentional Asymmetry** and **Tonal Depth**. Instead of rigid, centered grids, we use sweeping horizontal movements and overlapping "glass" layers that mimic the flow of data. The experience should feel like a premium command center—authoritative, silent, and incredibly fast.

---

## 2. Colors: Tonal Architecture

This system uses a Material 3-inspired tonal palette to move away from flat hex codes and toward a living hierarchy of light and shadow.

### The "No-Line" Rule

**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning. Structural boundaries must be defined solely through background color shifts. For example, a `surface_container_low` sidebar sitting against a `background` main stage provides all the definition needed.

### Surface Hierarchy & Nesting

Treat the UI as a series of physical layers. Use the surface tiers to create "nested" depth:

- **Base:** `surface` (#f9f9ff)
- **Lowered Areas (Search/Inputs):** `surface_container_low` (#f3f3fa)
- **Standard Cards:** `surface_container_lowest` (#ffffff)
- **Elevated Modals:** `surface_bright` (#f9f9ff)

### The "Glass & Gradient" Rule

To elevate the "media-focused" feel, floating elements (like download progress overlays) should use **Glassmorphism**.

- **Formula:** `surface_container_lowest` at 70% opacity + `backdrop-blur: 12px`.
- **Signature Textures:** For primary CTAs, use a subtle linear gradient from `primary` (#001370) to `primary_container` (#172a92) at a 135-degree angle. This adds "soul" and visual weight that a flat fill cannot achieve.

---

## 3. Typography: Editorial Authority

We use a high-contrast typographic scale to separate metadata from action.

- **Display & Headlines (Manrope):** Chosen for its geometric precision. Use `display-md` for landing states and `headline-sm` for category headers. These should feel like magazine headlines—bold and commanding.
- **Title & Body (Be Vietnam Pro):** This typeface offers a modern, tech-forward readability. `title-md` is the workhorse for file names, while `body-sm` handles technical metadata (kb/s, file size).
- **Labels (Manrope):** Used exclusively for buttons and micro-copy. Its wide tracking in uppercase adds a premium, "utility-chic" feel.

---

## 4. Elevation & Depth: The Stacking Principle

We convey hierarchy through **Tonal Layering** rather than structural lines or heavy drop shadows.

- **Ambient Shadows:** When a "floating" effect is required (e.g., a hovering download card), use an extra-diffused shadow: `box-shadow: 0 12px 32px -4px rgba(25, 28, 32, 0.06)`. Note the 6% opacity; it should be felt, not seen.
- **The "Ghost Border" Fallback:** If a border is required for accessibility in high-density areas, use `outline_variant` (#c6c5d5) at **20% opacity**. Never use 100% opaque borders.
- **The Layering Rule:** An inner container must always be a "higher" surface tier than its parent. If the background is `surface_container`, the card must be `surface_container_lowest`.

---

## 5. Components: Functional Elegance

### Buttons (Archivo / Manrope Labels)

- **Primary:** Gradient fill (`primary` to `primary_container`), `on_primary` text. 12px rounded corners.
- **Secondary:** `secondary_container` fill with `on_secondary_container` text. Use for "Add URL" or "Filter" actions.
- **Tertiary:** No fill, `primary` text. Use for "Cancel" or "Clear History."

### Chips (Categorization)

- **Media Type Chips:** Use `surface_container_high` with `label-md` text. When active, transition to `secondary_fixed` (#66ff8d) with a subtle scale transform (1.05x).

### Input Fields

- **URL Bar:** Use `surface_container_low`. No border. On focus, transition the background to `surface_container_lowest` and add a 2px "Ghost Border" of `primary` at 30% opacity.

### Cards & Lists (The Core App Logic)

- **Forbid Dividers:** Do not use lines to separate download items. Use `spacing-4` (0.9rem) of vertical white space and a subtle background hover state (`surface_container_highest` at 40% opacity) to define rows.
- **Progress Bars:** The background track should be `surface_variant`. The active fill must be the vibrant `secondary` (#006e2f) to signal "Fast/Healthy" status.

### Custom Component: The "Media Previewer"

A large-scale card using `surface_container_lowest` with an aspect-ratio locked image container. The metadata should be right-aligned to create an intentional asymmetrical balance against the thumbnail.

---

## 6. Do’s and Don’ts

### Do

- **DO** use whitespace as a functional tool. If elements feel crowded, increase the spacing token rather than adding a border.
- **DO** use `secondary` (#04d361) sparingly. It is a high-energy accent; overusing it will diminish the "Professional" feel of the deep navy.
- **DO** align icons and text on a precise optical center, not just a mathematical one.

### Don't

- **DON'T** use pure black (#000000) for text. Always use `on_surface` (#191c20) to maintain tonal softness.
- **DON'T** use "Standard" 4px or 6px corners. Stick strictly to the **md (12px)** and **lg (16px)** tokens to maintain the "Modern Soft" identity.
- **DON'T** use traditional "Material Blue." Only use the specified deep navy (`primary`) to ensure the brand feels premium and custom-coded.

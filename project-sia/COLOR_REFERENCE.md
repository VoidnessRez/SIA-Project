# Color Reference — SIA Project (Frontend)

This document lists the color tokens (CSS variables) and hard-coded color values used across the frontend (source files under `frontend/`). For each color I show the hex / rgba value, a short suggested meaning, and the main files where it appears.

---

## 1) CSS variables (authoritative)
Defined in `src/darkMode.css` (default :root + `.dark-mode` overrides)

- Light (default) -- :root
  - --bg-primary: #ffffff            — primary page background
  - --bg-secondary: #f9fafb         — cards / panel backgrounds
  - --bg-tertiary: #f3f4f6          — input/tertiary surfaces
  - --text-primary: #111827         — main text color
  - --text-secondary: #6b7280       — secondary text / muted
  - --text-tertiary: #9ca3af        — placeholder / tertiary text
  - --border-color: #e5e7eb         — borders / separators
  - --shadow: rgba(0,0,0,0.1)       — small shadows
  - --shadow-lg: rgba(0,0,0,0.15)   — larger shadows

- Dark (when `.dark-mode` class is present)
  - --bg-primary: #1a1a2e
  - --bg-secondary: #16213e
  - --bg-tertiary: #0f0f1e
  - --text-primary: #f0f4f8
  - --text-secondary: #c5d2e0
  - --text-tertiary: #95a5b8
  - --border-color: rgba(255,255,255,0.12)
  - --shadow: rgba(0,0,0,0.3)
  - --shadow-lg: rgba(0,0,0,0.5)
  - --accent-color: #7c7ff1        — primary accent (dark-mode override)
  - --success-color: #10b981       — success (green)
  - --warning-color: #f59e0b       — warning / accent (amber)
  - --danger-color: #ef4444        — danger / error (red)

Note: some components supply fallback values or other accent variants (see below).

---

## 2) Primary accent / brand gradients
Used for nav hover, buttons, avatars, CTAs, etc.
- Gradient stops frequently used:
  - #667eea (blue-violet)
  - #764ba2 (purple)
  - Usage: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
  - Files: `src/components/Header.css`, `src/pages/Products.css`, `src/AdminAuth/AdminAuthModal.css`, many components for CTA/avatars

- Other accent fallback values found:
  - --accent-color fallback in Header: #7c3aed  (Header CSS uses `var(--accent-color, #7c3aed)`)
  - Accent hover used: #6d28d9
  - Another accent in dark variables: #7c7ff1 (see darkMode.css)

---

## 3) Hard-coded neutral / backgrounds / borders / text
(Non-variable hex color usages found in CSS files)

- Whites / very light
  - #ffffff — pure white (header background, cards) — `Header.css`, `AdminAuthModal.css`
  - #f8f9fa — page / container background (Products page, header search box) — `Products.css`, `Header.css`
  - #f8f9ff — subtle light variant — `Products.css`
  - #f3f4f6 — also appears as tertiary background (matches variable) — `darkMode.css`
  - #f0f0f0 — subtle border or muted bg — `Products.css`

- Light greys / borders
  - #e9ecef — border & input borders (Products header, search box) — `Products.css`, `Header.css`
  - #e5e7eb — border color in :root variable (matches) — `darkMode.css`
  - #dee2e6 — used as subtle border in Admin modal — `AdminAuth/AdminAuthModal.css`
  - #adb5bd — muted border color — `AdminAuth/AdminAuthModal.css`
  - #ddd — generic light border — `AdminAuth/AdminAuthModal.css`

- Dark greys / text
  - #333333 (`#333`) — body / darker text — `Products.css`, `AdminAuth` files
  - #2c3e50 — logo text color — `Header.css`
  - #5a6c7d — nav link color — `Header.css`
  - #7f8c8d — secondary text (logo subtitle, user greeting) — `Header.css`
  - #666666 (`#666`) — muted text in admin modal — `AdminAuth/AdminAuthModal.css`
  - #555555 (`#555`) — used in admin CSS

---

## 4) Danger / Error reds
- #dc3545 — bootstrap-like danger (used for warning/error text) — `AdminAuth/AdminAuthModal.css`
- #c82333 — darker red used in gradient stop for danger button — `Products.css`
- #ef4444 — `--danger-color` in dark variables (global danger token) — `darkMode.css`

---

## 5) Success & Warning (green / amber)
- #10b981 — `--success-color` (green) — `darkMode.css`
- #f59e0b — `--warning-color` (amber) — `darkMode.css`

---

## 6) RGBA / overlay / shadows (commonly used)
- rgba(0, 0, 0, 0.08)   — small header/card shadow — `Header.css` box-shadow
- rgba(0, 0, 0, 0.1)    — `--shadow` in variables (light shadow)
- rgba(0, 0, 0, 0.15)   — `--shadow-lg` (light large shadow)
- rgba(0, 0, 0, 0.2)    — hover/CTA shadow (`Header.css` nav hover uses rgba(102,126,234,0.2) + <others>)
- rgba(0, 0, 0, 0.3)    — `--shadow` in dark mode (deeper)
- rgba(0, 0, 0, 0.5)    — `--shadow-lg` in dark mode
- rgba(0, 0, 0, 0.6)    — auth modal overlay background — `src/components/AuthModal.css`
- rgba(124,127,241,0.12) & rgba(118,75,162,0.08) — subtle gradient overlay in product modal (dark theme)
- rgba(220,53,69,0.1)   — light red background for errors in admin modal
- rgba(176,0,32,0.12)   & rgba(176,0,32,0.24) — admin-auth error backgrounds/borders (darkmode)
- rgba(102,126,234,0.1/0.4) — focus/ring and hover glow on blue accents (Products, Header)

---

## 7) Named colors / tokens used inline
- white, black, transparent — used in small places (defaults)

---

## 8) Where to change colors (authoritative locations)
If you want to change global color palette, edit `src/darkMode.css` (these variables are the source-of-truth):
- Light tokens under `:root`
- Dark tokens under `.dark-mode`

Replace or harmonize `--accent-color` and `--accent-hover` there and update any hard-coded accent hexs used in gradients (search for `#667eea`, `#764ba2`, `#7c3aed`, `#6d28d9`) to keep a consistent brand.

---

## 9) Quick deduplicated list (alphabetical by hex / rgba)
- #111827 (text-primary in light root)
- #1a1a2e (dark bg primary)
- #16213e (dark bg secondary)
- #0f0f1e (dark bg tertiary)
- #2c3e50 (logo text)
- #333333 (#333 body/darker text)
- #555555 (#555 admin)
- #666666 (#666 muted text)
- #7f8c8d (muted)
- #5a6c7d (nav link)
- #9ca3af (text-tertiary)
- #6b7280 (text-secondary)
- #95a5b8 (dark-mode tertiary)
- #f8f9fa (light background/search box)
- #f8f9ff (light subtle bg)
- #f3f4f6 (bg-tertiary)
- #f0f0f0 (very subtle)
- #e9ecef (borders / inputs)
- #e5e7eb (var border-color)
- #dee2e6 (admin borders)
- #adb5bd (muted border)
- #ddd (border)
- #ffffff (white)
- #667eea (accent gradient stop / blue)
- #764ba2 (accent gradient stop / purple)
- #7c3aed (accent fallback used in header)
- #7c7ff1 (accent color in dark variables)
- #6d28d9 (accent hover)
- #c82333 (danger gradient stop)
- #dc3545 (danger red)
- #ef4444 (danger token)
- #10b981 (success)
- #f59e0b (warning)
- rgba(0,0,0,0.08)
- rgba(0,0,0,0.1)
- rgba(0,0,0,0.15)
- rgba(0,0,0,0.2)
- rgba(0,0,0,0.3)
- rgba(0,0,0,0.5)
- rgba(0,0,0,0.6)
- rgba(124,127,241,0.12)
- rgba(118,75,162,0.08)
- rgba(102,126,234,0.1)
- rgba(102,126,234,0.4)
- rgba(220,53,69,0.1)
- rgba(176,0,32,0.12)
- rgba(176,0,32,0.24)

---

## 10) Next steps / suggestions
- Replace repeated hard-coded hexes in component CSS with variables (e.g. `--accent-color`, `--danger-color`, `--success-color`) for easier theming.
- Decide a single canonical `--accent-color` (and its hover/ring variants) and replace the multiple accent hex fallbacks (#667eea/#7c3aed/#7c7ff1) to keep brand consistent.
- Consider generating a simple tokens file (JSON) for design-system usage and to power any future styleguide/components.

---

If you'd like, I can:
- Normalize all component hard-coded hexes to variables in one PR,
- Produce a small style token JSON and `COLOR_PALETTE.md`, or
- Create a playground page that shows all colors with their names/usages.

Tell me which you prefer and I'll do it next. 

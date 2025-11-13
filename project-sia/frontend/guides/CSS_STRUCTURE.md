# Inventory Component CSS Structure

## Overview
This folder uses a **modular CSS architecture** with shared styles and component-specific styles.

## File Structure

```
inventory/
├── Shared.css                    # ⭐ COMMON/SHARED STYLES
├── Accessories.css               # Accessories component styles
├── SpareParts.css                # SpareParts component styles
├── LowStockAlerts.css            # LowStockAlerts component styles
├── RestockManagement.css         # RestockManagement component styles
├── ReturnedItems.css             # ReturnedItems component styles
├── ItemPickup.css                # ItemPickup component styles
├── BrandsManagement.css          # BrandsManagement component styles
├── Accessories.jsx
├── SpareParts.jsx
├── LowStockAlerts.jsx
├── RestockManagement.jsx
├── ReturnedItems.jsx
├── ItemPickup.jsx
└── BrandsManagement.jsx
```

## How It Works

### Shared.css (Main CSS File)
Contains all **common and reusable styles**:
- CSS Variables (colors, spacing)
- Component layout styles
- Table styles
- Modal styles
- Form styles
- Button styles
- Status badges
- Responsive design

### Component CSS Files
Each component has its own CSS file that:
1. **Imports** `Shared.css` at the top
2. Contains **component-specific styles** below the import

Example:
```css
/* Accessories.css */
@import './Shared.css';

/* Add component-specific styles here */
.accessories-specific-class {
  /* styles */
}
```

## Usage in Components

### Import in JSX
```javascript
// Accessories.jsx
import './Accessories.css';

const Accessories = () => {
  // component code
};
```

## Debugging Guide

✅ **Easy debugging because:**
- One common file (`Shared.css`) for all shared styles
- No CSS conflicts or duplication
- Component-specific issues isolated in their own CSS files
- Easy to find and modify styles
- Clear separation of concerns

## When to Add Styles

### In Shared.css
- Global theme colors
- Common component layouts
- Reusable classes (`.modal`, `.form-group`, `.button`, etc.)
- Responsive breakpoints
- CSS variables

### In Component CSS
- Unique component styling
- Component-specific animations
- Component layout overrides
- Component-specific colors/themes

## CSS Variables Available

```css
:root {
  --inv-primary: #667eea;
  --inv-primary-dark: #5568d3;
  --inv-secondary: #764ba2;
  --inv-success: #48bb78;
  --inv-danger: #f56565;
  --inv-warning: #ed8936;
  /* ... and more */
}
```

Use these in component CSS files:
```css
.my-component {
  color: var(--inv-primary);
  background: var(--inv-gray-50);
}
```

---

**Need to add new inventory component?**
1. Create component file (e.g., `NewComponent.jsx`)
2. Create stylesheet (e.g., `NewComponent.css`)
3. Import `./Shared.css` in the new CSS file
4. Import your CSS in the JSX component
5. Add component-specific styles in the CSS file

Happy debugging! 🎨

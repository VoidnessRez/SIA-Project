# Mejia Spareparts - Motorcycle Parts E-Commerce Platform

A modern e-commerce website for motorcycle spare parts and accessories built with React and Vite.

## 🎯 Features

### 📱 Pages Implemented

#### 1. **Home Page** (`/`)
- Hero section with call-to-action buttons
- Statistics showcase (500+ products, 1200+ customers, etc.)
- Featured products grid
- Clean, modern design

#### 2. **Products Page** (`/products`)
- **Advanced Filtering System:**
  - Search by name, SKU, or description
  - Filter by category (Parts/Accessories)
  - Filter by brand (Honda, Suzuki, Yamaha, Kawasaki, Universal)
  - Filter by part type (Brake System, Engine, Electrical, etc.)
  - Filter by price range
- **Sorting Options:**
  - Featured
  - Price: Low to High / High to Low
  - Name (A-Z)
  - Rating
- **Product Features:**
  - Product cards with images, ratings, stock info
  - Quick View modal with image gallery
  - Add to cart functionality
  - SKU tracking
  - Stock status indicators

#### 3. **Brands Page** (`/brands`)
- **Three Categories:**
  - Motorcycle Brands (Honda, Suzuki, Yamaha, Kawasaki)
  - Parts Manufacturers (NGK, Brembo, K&N, DID, IRC, Denso, Motolite)
  - Accessory Brands (Shoei, Alpinestars, Progrip, Givi, Oxford)
- Brand information cards with:
  - Brand logos and descriptions
  - Available products
  - Specialty areas
  - Company details (established date, country)
- Statistics dashboard
- "Why Choose Our Brands" section with features

#### 4. **Orders Page** (`/orders`)
- Order history tracking
- **Order Statistics:**
  - Total orders count
  - Delivered orders
  - Shipped orders
  - Total amount spent
- **Filter Tabs:**
  - All Orders
  - Processing
  - Shipped
  - Delivered
- **Order Details Modal:**
  - Complete order information
  - Item list with images
  - Shipping address
  - Payment method
  - Tracking number
  - Order summary with totals
- **Action Buttons:**
  - Reorder (for delivered orders)
  - Track Package (for shipped orders)
  - Download Receipt

#### 5. **Contact Page** (`/contact`)
- **Contact Information:**
  - Email: mejiaspareparts@gmail.com
  - Phone: +63 912 345 6789
  - Facebook: @MejiaSpareparts
  - Location: Manila, Philippines
- **Contact Form:**
  - Name, email, phone fields
  - Subject dropdown (Product Inquiry, Order Status, etc.)
  - Message textarea
- **Business Hours Display:**
  - Monday-Friday: 8:00 AM - 6:00 PM
  - Saturday: 9:00 AM - 5:00 PM
  - Sunday: Closed
- **FAQ Section** with common questions
- **Social Media Links** (Facebook, Instagram, Twitter, Email)
- **Quick Links** (Track Order, FAQ, Return Policy, Shipping Info)

### 🎨 Design Features

- **Responsive Design:** Works on desktop, tablet, and mobile
- **Modern UI/UX:** Clean gradient designs, smooth animations
- **Navigation:**
  - Fixed header with active link highlighting
  - Mobile-friendly hamburger menu
  - React Router for seamless page transitions
- **Floating Cart:** Always visible shopping cart button
- **User Profile Section:** Welcome message and logout button
- **Search Functionality:** Global search in header

## 🛠️ Technologies Used

- **React 19.1.1** - Frontend framework
- **Vite 7.1.7** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **ESLint** - Code linting
- **CSS3** - Styling with modern features (Grid, Flexbox, Animations)

## 📦 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Header.jsx/css         # Main navigation header
│   │   ├── HeroSection.jsx/css    # Homepage hero section
│   │   ├── ProductGrid.jsx/css    # Product display grid
│   │   ├── StatsSection.jsx/css   # Statistics cards
│   │   └── FloatingCart.jsx/css   # Shopping cart button
│   ├── pages/
│   │   ├── Products.jsx/css       # Products catalog page
│   │   ├── Brands.jsx/css         # Brands showcase page
│   │   ├── Orders.jsx/css         # Order history page
│   │   └── Contact.jsx/css        # Contact information page
│   ├── dashboard/
│   │   └── Dashboard.jsx/css      # Main dashboard/home page
│   ├── main.jsx                   # App entry point with routing
│   └── index.css                  # Global styles
├── public/
│   └── vite.svg                   # Vite logo
├── index.html                     # HTML entry point
├── package.json                   # Dependencies
├── vite.config.js                 # Vite configuration
└── eslint.config.js              # ESLint configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js (>= 18.0.0)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/VoidnessRez/SIA-Project.git
cd SIA-Project/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:5173
```
(or the port shown in your terminal)

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎯 Features Breakdown

### Products Page Highlights
- **15 sample products** with detailed information
- **Multiple filter options** for easy product discovery
- **Quick View modal** with image carousel
- **Real-time filtering** and sorting
- **SKU tracking** for inventory management
- **Stock level indicators** (Low Stock warning)

### Brands Page Highlights
- **16 brands** across three categories
- **Detailed brand information** including establishment dates
- **Specialty tagging** for easy identification
- **Statistics overview** showing brand distribution
- **Why Choose section** highlighting benefits

### Orders Page Highlights
- **5 sample orders** with different statuses
- **Order status tracking** (Processing, Shipped, Delivered, Cancelled)
- **Detailed order modal** with complete information
- **Action buttons** based on order status
- **Statistics dashboard** showing order metrics

### Contact Page Highlights
- **Multiple contact methods** (Email, Phone, Facebook)
- **Working contact form** with validation
- **Business hours display** with day-specific timing
- **6-item FAQ section** answering common questions
- **Social media integration** with direct links
- **Quick links** for common customer needs

## 🎨 Design System

### Colors
- Primary: `#667eea` (Purple Blue)
- Secondary: `#764ba2` (Deep Purple)
- Success: `#28a745` (Green)
- Warning: `#ffc107` (Yellow)
- Info: `#17a2b8` (Cyan)
- Danger: `#dc3545` (Red)

### Typography
- Font Family: system-ui, Avenir, Helvetica, Arial, sans-serif
- Heading weights: 600-700
- Body weight: 400-500

### Spacing
- Consistent padding and margins using rem units
- Responsive spacing that adjusts for mobile

## 📱 Responsive Breakpoints

- Mobile: `< 768px`
- Tablet: `768px - 1024px`
- Desktop: `> 1024px`

## 🔄 Future Enhancements

- [ ] Shopping cart state management
- [ ] User authentication
- [ ] Payment integration
- [ ] Order placement functionality
- [ ] Product reviews and ratings
- [ ] Wishlist feature
- [ ] Live chat support
- [ ] Email notifications
- [ ] Admin dashboard
- [ ] Inventory management

## 👥 Contact Information

**Mejia Spareparts and Accessories**
- 📧 Email: mejiaspareparts@gmail.com
- 📱 Phone: +63 912 345 6789
- 📘 Facebook: @MejiaSpareparts
- 📍 Location: Manila, Philippines

## 📄 License

ISC

## 🙏 Acknowledgments

- React team for the amazing framework
- Vite team for the blazing-fast build tool
- All the motorcycle parts manufacturers we feature

---

**Note:** This is a front-end demonstration. Backend integration and actual e-commerce functionality need to be implemented for production use.

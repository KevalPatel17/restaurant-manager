# ☕ Musafir Cafe & Roasters — Frontend Web Application

[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_%26_Realtime-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-WAHA_Gateway-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://waha.devlike.pro/)

The frontend web application for **Musafir Cafe & Roasters**, powering public customer QR ordering, kitchen display workflows, personal live order tracking, and administrative cafe management.

---

## 🚀 Key Features

### 🛍️ 1. Customer Experience
- **11 Categorized Menu Sections** (`/menu`, `/menu/:categoryId`):
  - `COFFEE`, `TEA`, `BREAKFAST`, `SNACKS`, `SANDWICHES`, `PASTA`, `PIZZA`, `DESSERTS`, `COLD BEVERAGES`, `MOCKTAILS`, `COMBOS`.
  - 2-per-row horizontal split category cards with gold-accented buttons and styled icons.
  - 3-column wide food cards with dietary tags (`Vegetarian`, `Bestseller`, `SPECIAL ★`), prices, and quantity steppers (`[ - ] [ 1 ] [ + ]`).
  - Automatic scroll-to-top on route changes.
- **Interactive Cookie Box Builder** (`/cookies`): Custom 6-slot artisan cookie box customizer with real-time slot animations and 1-tap ordering.
- **Table QR Ordering** (`?table=X`): Auto-locks customer table number for dine-in orders.
- **Travel Tokens Loyalty Program**: Automatic 10 tokens per ₹100 spent with instant reward redemption.
- **Culinary Gallery** (`/gallery`): 23 authentic dish & beverage photos with category filters and interactive full-screen Lightbox.
- **Live Order Status Tracker** (`/my-order/:orderId`): Real-time progress updates with printable/downloadable digital invoices.
- **Legal Compliance Pages**: [`/privacy-policy`](/privacy-policy) and [`/terms-of-service`](/terms-of-service).

### 👨‍🍳 2. Kitchen Display System (KDS) (`/kitchen`)
- Dark high-contrast theme (`#0E1217`) optimized for kitchen tablets.
- **3 Workflow Columns**: Incoming Orders ➔ Brewing & Preparation ➔ Ready for Table.
- **Audio Bell Chimes** on new orders via Web Audio API.
- Item-level prep checklists and live elapsed timers.

### 📺 3. Order Status TV Display (`/order-status`)
- Customer-facing TV board with real-time animated status stepper.
- Real-time instant sync via Supabase Realtime + BroadcastChannel API.

### 🛠️ 4. Responsive Admin Management Portal (`/admin`)
- **Performance Overview**: Gross revenue, total orders, active queue, and WAHA gateway status.
- **Live Orders Manager**: Batch actions, status updates, invoice viewer, and customer contact.
- **Menu & Stock Manager**: Add/edit/delete menu items and categories with instant image upload and compression.
- **Tables & QR Generator**: Standee generator with downloadable and printable QR codes for each table.
- **Customer CRM**: Manage customer token balances and order history.
- **Settings**: WAHA WhatsApp integration credentials, GPay UPI ID, cafe GST, and address management.

---

## 🔐 Default Admin Credentials

| Parameter | Value |
| :--- | :--- |
| **Login URL** | `/login` or `/admin` |
| **Email** | `admin@musafir.cafe` |
| **Password** | `Musafir@2026` |
| **Cafe Mobile** | `+91 75554 17487` |

---

## ⚙️ Getting Started (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in this directory:
```env
VITE_SUPABASE_URL=https://pxzlpugghtcvotozroiy.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production
```bash
npm run build
```

---

## 🎨 Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, React Router v6, React Hot Toast, Canvas Confetti, QRCode.
- **Backend & Database**: Supabase (PostgreSQL, Row Level Security, Realtime Subscriptions).
- **Communication**: BroadcastChannel API (cross-tab sync) & WAHA WhatsApp REST API.
- **Typography**: Lobster, Playfair Display, Lato.

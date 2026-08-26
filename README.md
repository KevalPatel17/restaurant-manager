# ☕ Musafir Cafe & Roasters — Restaurant & Cafe Management System

> **🌐 Live Production URL**: [https://musafir-cafe-7sx.pages.dev/](https://musafir-cafe-7sx.pages.dev/)

A modern, high-performance cafe ordering, kitchen display, and administrative management web application built with **React (Vite), Tailwind CSS, Supabase (PostgreSQL + Realtime), and WAHA (WhatsApp Gateway)**.

---

## 🚀 Key Features

### 🛍️ 1. Customer Experience
- **Artisan Menu & Catalog** (`/menu`, `/menu/:categoryId`): Categorized menu cards with live stock availability (86'd status), dietary badges, and instant add-to-cart.
- **Interactive Cookie Box Builder** (`/cookies`): Custom 6-slot artisan cookie box builder with drag-and-drop and 1-tap ordering.
- **Table QR Ordering** (`?table=1`): Customers scan the table standee QR to automatically lock their table number for ordering.
- **Cart & UPI Checkout**: Slide-out cart drawer supporting Cash and dynamic Google Pay / PhonePe UPI QR generation.

### 👨‍🍳 2. Kitchen Display System (KDS) (`/kitchen`)
- Dark black/emerald high-contrast theme (`#0E1217`) optimized for kitchen tablets and wall monitors.
- **3 Workflow Columns**: Incoming Orders ➔ Brewing & Preparation ➔ Ready for Table.
- **1-Click "Almost Ready" Action** (`⚡ Almost Ready`): Instantly updates kitchen tickets and alerts customer TV displays.
- **Live Sound Chimes & Digital Clock**: Audio notifications for new orders and active prep timers.
- **Admin Auth Guarded**: Secured via admin authentication session.

### 📺 3. Order Status TV Display (`/order-status`)
- Customer-facing TV board with smooth 3-stage animated status stepper (*Order Placed ➔ In The Kitchen ➔ Ready For Table*).
- Highlighted green glowing badge for orders in `⚡ ALMOST READY` state.
- **0ms Instant Sync**: Uses Supabase Realtime + BroadcastChannel API for zero-latency cross-tab updates.

### 🛠️ 4. Responsive Admin Management Portal (`/admin`)
- **Performance Overview**: Gross revenue, total order count, active queue, and WAHA gateway health.
- **Menu & Stock Manager**: 1-click 86'd (out of stock) toggling, item creation, pricing, and category mapping.
- **Category Manager**: Create, edit, and organize menu sections.
- **Tables & QR Generator**: Standee generator with downloadable and printable QR codes for each table.
- **Orders & Invoicing**: Live status stepper, thermal / A4 printable GST bill invoice modal, and 1-click WhatsApp receipt dispatcher.
- **Guest CRM**: Contact directory with customer order histories.
- **Settings**: WAHA WhatsApp integration credentials, GPay UPI ID, cafe GST, and address management.

---

## 🔐 Default Admin Credentials

| Parameter | Value |
| :--- | :--- |
| **Login URL** | `/login` or `/admin` |
| **Email** | `admin@musafir.cafe` |
| **Password** | `Musafir@2026` |

---

## 📱 Application Routes

| Route | Page / Feature | Access |
| :--- | :--- | :--- |
| `/` | Homepage & Roastery Showcase | Public |
| `/menu` | Full Menu Directory | Public |
| `/menu/:categoryId` | Dynamic Category Items | Public |
| `/cookies` | Build Your Own Cookie Box | Public |
| `/our-story` | Brand Heritage & Story | Public |
| `/login` | Staff & Admin Sign In | Public |
| `/admin` | Full Admin Management Portal | 🔒 Admin Auth |
| `/kitchen` | Kitchen KDS Screen | 🔒 Admin Auth |
| `/order-status` | Customer Order Status Board | 🔒 Admin Auth |

---

## ⚙️ Getting Started (Local Development)

### 1. Install Dependencies
```bash
cd new-design
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the `new-design` folder (if not present):
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Start Development Server
```bash
npm run dev -- --port 5174
```
Open [http://localhost:5174](http://localhost:5174) in your browser.

### 4. Build for Production
```bash
npm run build
```

---

## 💬 WhatsApp (WAHA) Gateway Configuration

Musafir Cafe includes automated WhatsApp order updates and digital invoice receipts powered by [WAHA](https://waha.devlike.pro/).

- **Local WAHA Dashboard**: `http://localhost:3000/dashboard`
- **Default Username**: `admin`
- **Default Password**: `admin`
- **Default API Key**: `musafir123`

---

## 🎨 Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, React Router v6, React Hot Toast, Canvas Confetti, QRCode.
- **Backend & Database**: Supabase (PostgreSQL, Row Level Security, Realtime Subscriptions).
- **Communication**: BroadcastChannel API (cross-tab sync) & WAHA WhatsApp REST API.
- **Typography**: Playfair Display, Lobster, Lato.

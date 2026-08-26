import { Routes, Route } from 'react-router-dom'
import AnnouncementBar from './components/AnnouncementBar'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import OurStory from './pages/OurStory'
import Menu from './pages/Menu'
import CategoryDetail from './pages/CategoryDetail'
import Cookies from './pages/Cookies'
import AdminLogin from './pages/AdminLogin'
import AdminPanel from './pages/AdminPanel'
import KitchenDisplay from './pages/KitchenDisplay'
import OrderStatus from './pages/OrderStatus'
import { CartProvider } from './context/CartContext'
import { Toaster } from 'react-hot-toast'

import CartDrawer from './components/CartDrawer'

// Shared layout: announcement bar + navbar + page content + footer + cart drawer
function Layout({ children }) {
  return (
    <>
      <AnnouncementBar />
      <Navbar />
      {children}
      <Footer />
      <CartDrawer />
    </>
  )
}

function App() {
  return (
    <CartProvider>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/our-story" element={<Layout><OurStory /></Layout>} />
        <Route path="/menu" element={<Layout><Menu /></Layout>} />
        <Route path="/menu/:categoryId" element={<Layout><CategoryDetail /></Layout>} />
        <Route path="/cookies" element={<Layout><Cookies /></Layout>} />
        <Route path="/login" element={<Layout><AdminLogin /></Layout>} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/kitchen" element={<KitchenDisplay />} />
        <Route path="/order-status" element={<OrderStatus />} />
      </Routes>
    </CartProvider>
  )
}

export default App

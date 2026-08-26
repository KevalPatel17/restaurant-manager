import { useState, useRef, useEffect } from 'react'
import { Link, useSearchParams, useLocation } from 'react-router-dom'
import {
  FiUser,
  FiShoppingCart,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiMenu,
  FiX,
} from 'react-icons/fi'
import { FaFacebookF, FaInstagram, FaTwitter } from 'react-icons/fa'
import Logo from './Logo'
import { useCart } from '../context/CartContext'

// About Us dropdown links
const aboutLinks = [
  { name: 'Our Menu', path: '/menu' },
  { name: 'Our Story', path: '/our-story' },
  { name: 'Artisan Cookies', path: '/cookies' },
  { name: 'Staff Portal', path: '/login' },
]

// Main sub-nav links matching requested tabs
const navLinks = [
  { name: 'Our Menu', path: '/menu' },
  { name: 'Our Story', path: '/our-story' },
  { name: 'Cookies', path: '/cookies' },
]

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileAboutOpen, setMobileAboutOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const navScrollRef = useRef(null)

  const { cartCount, cartTotal, setIsCartOpen, tableNumber, setTableNumber } = useCart()
  const [searchParams] = useSearchParams()
  const location = useLocation()

  // Sync table parameter from URL (?table=1). If no table in URL on /menu, clear tableNumber for normal online ordering
  useEffect(() => {
    const tableParam = searchParams.get('table')
    if (tableParam) {
      if (tableParam !== tableNumber) {
        setTableNumber(tableParam)
      }
    } else if (location.pathname === '/menu') {
      if (tableNumber) {
        setTableNumber(null)
      }
    }
  }, [searchParams, location.pathname, tableNumber, setTableNumber])

  const handleScrollNav = (direction) => {
    if (navScrollRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220
      navScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  return (
    <header className="bg-black relative z-50">

      {/* ─── 1. MOBILE & MD SCREEN HEADER ROW (lg:hidden) ─── */}
      <div className="flex lg:hidden items-center justify-between px-4 sm:px-6 py-3.5 bg-black border-b border-white/10">
        {/* Left: Hamburger Icon */}
        <button
          className="text-white text-2xl p-1.5 hover:opacity-80 transition-opacity"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu drawer"
        >
          <FiMenu />
        </button>

        {/* Center: Brand Logo */}
        <div className="flex-1 flex justify-center items-center gap-2">
          <Logo text="Musafir Cafe" />
          {tableNumber ? (
            <span className="bg-green text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              T#{tableNumber}
            </span>
          ) : (
            <></>
          )}
        </div>

        {/* Right: Cart Icon with Badge */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative text-white p-1.5 hover:opacity-80 transition-opacity flex items-center justify-center cursor-pointer"
          aria-label="Shopping Cart"
        >
          <FiShoppingCart className="text-2xl" />
          <span className="absolute -top-1 -right-1.5 bg-green text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow">
            {cartCount}
          </span>
        </button>
      </div>

      {/* ─── 2. LARGE DESKTOP HEADER ROW 1 (hidden lg:flex) ─── */}
      <div className="hidden lg:flex items-center justify-between px-8 xl:px-12 py-5 bg-black border-b border-white/10">
        {/* Left: Brand Logo & Order Mode Badge */}
        <div className="flex items-center gap-4">
          <Logo text="Musafir Cafe" />
          {tableNumber ? (
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
              <span>Ordering for <strong className="text-white font-bold">Table #{tableNumber}</strong></span>
            </div>
          ) : (
            <></>
          )}
        </div>

        {/* Right: Account & Cart Buttons */}
        <div className="flex items-center gap-3">
          {/* Account Button (Outlined Pill) */}
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/70 text-white font-sans text-sm font-normal hover:bg-white/10 hover:border-white transition-all"
          >
            <FiUser className="text-base" />
            <span>Staff Portal</span>
          </Link>

          {/* Cart Button (Solid White Pill) */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white text-[#1C201D] font-sans text-sm font-semibold shadow-sm hover:bg-[#F7F4EE] transition-all cursor-pointer"
          >
            <FiShoppingCart className="text-base text-green" />
            <span>${cartTotal.toFixed(2)} ({cartCount})</span>
          </button>
        </div>
      </div>

      {/* ─── 3. LARGE DESKTOP SUB-NAV LINKS (hidden lg:flex) ─── */}
      <div className="bg-black hidden lg:flex items-center justify-center px-6 xl:px-12 py-3.5 relative border-t border-white/5">
        {/* About Us with dropdown */}
        <div
          className="relative mr-6 lg:mr-8"
          onMouseEnter={() => setAboutOpen(true)}
          onMouseLeave={() => setAboutOpen(false)}
        >
          <button
            onClick={() => setAboutOpen((prev) => !prev)}
            className="flex items-center gap-1.5 text-white font-sans text-sm font-normal hover:opacity-80 transition-opacity whitespace-nowrap py-1 cursor-pointer"
          >
            <span>About Us</span>
            <FiChevronDown
              className={`text-xs ml-0.5 transition-transform duration-200 ${
                aboutOpen ? 'rotate-180 text-white' : ''
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {aboutOpen && (
            <div className="absolute top-full left-0 pt-2 z-50">
              <div className="bg-[#111111] min-w-[200px] shadow-[0_12px_32px_rgba(0,0,0,0.7)] py-2 rounded-lg border border-white/15">
                {aboutLinks.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setAboutOpen(false)}
                    className="block text-white/90 font-sans text-[13px] px-5 py-2 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex items-center gap-6 lg:gap-8">
          {navLinks.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className="text-white font-sans text-sm font-normal hover:opacity-80 transition-opacity whitespace-nowrap py-1"
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* ─── 4. MOBILE & TABLET SLIDE-OUT DRAWER (Slides from LEFT) ─── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden animate-fade-in">
          {/* Dark Backdrop Overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setMobileOpen(false)}
          />

          {/* White Drawer Container (Slides from left) */}
          <div className="absolute left-0 top-0 h-full w-[290px] sm:w-[320px] bg-white text-[#1C1C1C] flex flex-col shadow-2xl z-50 transition-transform duration-300">

            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAE5DC]">
              <h3 className="font-serif text-lg font-normal text-[#1C1C1C]">
                Menu
              </h3>
              <button
                className="text-[#333] hover:text-black text-xl p-1 transition-colors cursor-pointer"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu drawer"
              >
                <FiX />
              </button>
            </div>

            {/* Menu Items List */}
            <nav className="flex-1 overflow-y-auto divide-y divide-[#EAE5DC] text-[#2A2A2A]">

              {/* About Us Expandable Item */}
              <div>
                <button
                  onClick={() => setMobileAboutOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between px-6 py-3.5 text-left font-sans text-sm text-[#2A2A2A] hover:bg-[#FAF8F4] transition-colors cursor-pointer"
                >
                  <span>About Us</span>
                  <FiChevronRight
                    className={`text-sm text-[#777] transition-transform duration-200 ${
                      mobileAboutOpen ? 'rotate-90 text-black' : ''
                    }`}
                  />
                </button>

                {/* Sublinks Accordion */}
                {mobileAboutOpen && (
                  <div className="bg-[#FAF8F4] py-1 border-t border-[#EAE5DC] divide-y divide-[#EAE5DC]/60">
                    {aboutLinks.map((item) => (
                      <Link
                        key={item.name}
                        to={item.path}
                        onClick={() => setMobileOpen(false)}
                        className="block px-8 py-2.5 font-sans text-xs text-[#555] hover:text-black hover:bg-white transition-colors"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Nav Items */}
              {navLinks.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className="block px-6 py-3.5 font-sans text-sm text-[#2A2A2A] hover:bg-[#FAF8F4] transition-colors font-medium"
                >
                  {item.name}
                </Link>
              ))}

              {/* Staff Portal Row */}
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 px-6 py-3.5 font-sans text-sm text-[#2A2A2A] hover:bg-[#FAF8F4] transition-colors"
              >
                <FiUser className="text-base text-[#444]" />
                <span>Staff Portal</span>
              </Link>
            </nav>

            {/* Social Icons at Bottom */}
            <div className="px-6 py-5 border-t border-[#EAE5DC] flex items-center gap-5 text-[#333]">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="hover:opacity-60 transition-opacity text-sm"
                aria-label="Facebook"
              >
                <FaFacebookF />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="hover:opacity-60 transition-opacity text-sm"
                aria-label="Instagram"
              >
                <FaInstagram />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="hover:opacity-60 transition-opacity text-sm"
                aria-label="Twitter"
              >
                <FaTwitter />
              </a>
            </div>

          </div>
        </div>
      )}

    </header>
  )
}

export default Navbar

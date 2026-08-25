import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Coffee, ChefHat, QrCode, Shield, MapPin, ChevronDown } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartCount, setIsCartOpen, tableNumber, setTableNumber, tablesList } = useCart();

  const isCustomerMenu = location.pathname === '/menu' || location.pathname === '/';

  const handleTableChange = (e) => {
    const newTable = e.target.value;
    setTableNumber(newTable);
    if (isCustomerMenu) {
      navigate(`/menu?table=${newTable}`, { replace: true });
    }
  };

  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-[#DF9B52]/20 shadow-sm transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Title */}
        <Link to={`/menu?table=${tableNumber}`} className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#DF9B52] shadow-sm bg-white p-0.5">
            <img
              src="/logo.jpg"
              alt="Musafir Cafe Logo"
              className="w-full h-full object-contain group-hover:scale-105 transition-transform"
            />
          </div>
          <div>
            <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[#1E130D] block leading-tight">
              Musafir Cafe
            </span>
            <span className="text-[10px] tracking-widest uppercase font-semibold text-[#C86D3B] block">
              Artisan Brews & Dining
            </span>
          </div>
        </Link>

        {/* Center / Right Navigation Controls */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          
          {/* Interactive Table Selection Dropdown in Navbar */}
          {isCustomerMenu && (
            <div className="relative flex items-center bg-[#F4EDE4] text-[#2C1810] px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold border border-[#DF9B52]/30 shadow-inner hover:border-[#C86D3B] transition-colors">
              <MapPin className="w-3.5 h-3.5 text-[#C86D3B] mr-1.5 flex-shrink-0" />
              <select
                value={tableNumber}
                onChange={handleTableChange}
                className="bg-transparent text-[#2C1810] font-bold text-xs focus:outline-none cursor-pointer pr-4 appearance-none"
                aria-label="Select dining table"
              >
                {tablesList.map((t) => (
                  <option key={t.table_number} value={t.table_number} className="bg-white text-black">
                    Table #{t.table_number} {t.table_label ? `(${t.table_label})` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-[#7A6F68] absolute right-2 pointer-events-none" />
            </div>
          )}

          {/* Quick Nav Links */}
          <nav className="hidden md:flex items-center space-x-1 text-sm font-medium text-[#7A6F68]">
            <Link
              to={`/menu?table=${tableNumber}`}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                location.pathname === '/menu'
                  ? 'text-[#C86D3B] bg-[#C86D3B]/10 font-semibold'
                  : 'hover:text-[#1E130D]'
              }`}
            >
              Menu
            </Link>
            <Link
              to="/kitchen"
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-colors ${
                location.pathname === '/kitchen'
                  ? 'text-[#C86D3B] bg-[#C86D3B]/10 font-semibold'
                  : 'hover:text-[#1E130D]'
              }`}
            >
              <ChefHat className="w-4 h-4" />
              <span>Barista KDS</span>
            </Link>
            <Link
              to="/qr"
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-colors ${
                location.pathname === '/qr'
                  ? 'text-[#C86D3B] bg-[#C86D3B]/10 font-semibold'
                  : 'hover:text-[#1E130D]'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>QR Standees</span>
            </Link>
            <Link
              to="/admin"
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-colors ${
                location.pathname.startsWith('/admin')
                  ? 'text-[#C86D3B] bg-[#C86D3B]/10 font-semibold'
                  : 'hover:text-[#1E130D]'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Admin</span>
            </Link>
          </nav>

          {/* Floating Cart Trigger Button */}
          {isCustomerMenu && (
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-full bg-[#1E130D] text-white hover:bg-[#C86D3B] transition-colors shadow-md active:scale-95"
              aria-label="Open Order Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#C86D3B] text-white rounded-full text-xs font-bold flex items-center justify-center border-2 border-[#FDF8F2] animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>
          )}

        </div>
      </div>
    </header>
  );
}

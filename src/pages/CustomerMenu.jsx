import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Sparkles, Coffee, AlertCircle, ShoppingBag, SlidersHorizontal, MapPin, ChevronDown, User, Phone, Edit3 } from 'lucide-react';
import CategoryTabs from '../components/CategoryTabs';
import MenuItemCard from '../components/MenuItemCard';
import Cart from '../components/Cart';
import GuestCheckinModal from '../components/GuestCheckinModal';
import { api } from '../lib/api';
import { useCart } from '../context/CartContext';

export default function CustomerMenu() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    cartCount,
    cartTotal,
    setIsCartOpen,
    tableNumber,
    setTableNumber,
    tablesList,
    customerInfo,
    isCheckinModalOpen,
    setIsCheckinModalOpen,
  } = useCart();

  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState('ALL'); // ALL, Vegan, Gluten-Free, Musafir Special
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync table from URL query
  useEffect(() => {
    const tableFromUrl = searchParams.get('table');
    if (tableFromUrl) {
      setTableNumber(tableFromUrl);
    }
  }, [searchParams, setTableNumber]);

  // Show check-in popup if customer hasn't provided name/phone yet
  useEffect(() => {
    if (!customerInfo?.phone && !sessionStorage.getItem('musafir_checkin_dismissed')) {
      const timer = setTimeout(() => {
        setIsCheckinModalOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [customerInfo, setIsCheckinModalOpen]);

  // Handle table switch from dropdown
  const handleTableSelect = (e) => {
    const newTable = e.target.value;
    setTableNumber(newTable);
    setSearchParams({ table: newTable });
  };

  // Fetch Categories & Menu Items directly from Supabase
  useEffect(() => {
    async function loadMenuData() {
      try {
        setLoading(true);
        setError(null);

        const [cats, items] = await Promise.all([
          api.getCategories(),
          api.getAllMenuItems(),
        ]);

        setCategories(cats || []);
        setMenuItems(items || []);
      } catch (err) {
        console.error('Menu load error:', err);
        setError('Unable to load cafe menu. Please refresh or ask your server.');
      } finally {
        setLoading(false);
      }
    }
    loadMenuData();
  }, []);

  // Filter items by category, search text, and dietary tags
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      // Category filter
      if (selectedCategory !== 'all' && item.category_id !== selectedCategory) {
        return false;
      }

      // Dietary filter
      if (dietaryFilter !== 'ALL') {
        if (dietaryFilter === 'Special' && !item.is_special) return false;
        if (dietaryFilter === 'Vegan' && (!item.dietary_tags || !item.dietary_tags.includes('Vegan'))) return false;
        if (dietaryFilter === 'Gluten-Free' && (!item.dietary_tags || !item.dietary_tags.includes('Gluten-Free'))) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = item.description && item.description.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) return false;
      }

      return true;
    });
  }, [menuItems, selectedCategory, dietaryFilter, searchQuery]);

  // Count items per category
  const categoryCounts = useMemo(() => {
    const counts = { all: menuItems.length };
    categories.forEach((cat) => {
      counts[cat.id] = menuItems.filter((item) => item.category_id === cat.id).length;
    });
    return counts;
  }, [categories, menuItems]);

  return (
    <div className="min-h-screen bg-[#FDF8F2] pb-24">
      
      {/* Hero Welcome Banner */}
      <section className="relative bg-[#1E130D] text-white pt-8 pb-10 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#DF9B52_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#C86D3B]/25 text-[#ECC980] border border-[#C86D3B]/40 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sanctuary for Travelers & Coffee Connoisseurs</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Musafir Cafe Menu
              </h1>
              <p className="text-white/70 text-xs sm:text-sm mt-1 max-w-md">
                Handcrafted single-origin pour-overs, botanical tisanes, and artisan sourdough brunch.
              </p>

              {/* Guest Profile Pill */}
              <div className="mt-3 flex items-center space-x-2 text-xs">
                <button
                  onClick={() => setIsCheckinModalOpen(true)}
                  className="bg-white/10 hover:bg-white/20 border border-white/15 px-3 py-1.5 rounded-full flex items-center space-x-1.5 transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-[#ECC980]" />
                  <span>
                    {customerInfo?.name ? customerInfo.name : 'Guest Check-in'}
                    {customerInfo?.phone ? ` (${customerInfo.phone})` : ''}
                  </span>
                  <Edit3 className="w-3 h-3 text-[#ECC980] ml-1" />
                </button>
              </div>
            </div>

            {/* Table Selection Dropdown Card */}
            <div className="bg-white/10 backdrop-blur-md border border-[#DF9B52]/40 rounded-2xl p-3.5 shadow-lg min-w-[220px]">
              <div className="flex items-center justify-between text-[11px] text-[#ECC980] uppercase font-bold tracking-wider mb-1">
                <span className="flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-[#DF9B52]" />
                  <span>Dining Table</span>
                </span>
                <span className="text-[10px] lowercase text-white/60">(change)</span>
              </div>
              
              <div className="relative mt-1">
                <select
                  value={tableNumber}
                  onChange={handleTableSelect}
                  className="w-full bg-[#1E130D] text-[#ECC980] font-serif font-bold text-sm sm:text-base py-2 pl-3 pr-8 rounded-xl border border-[#DF9B52]/50 focus:outline-none focus:ring-2 focus:ring-[#ECC980] cursor-pointer appearance-none shadow-inner"
                  aria-label="Select table location"
                >
                  {tablesList.map((t) => (
                    <option key={t.table_number} value={t.table_number} className="bg-[#1E130D] text-white">
                      Table #{t.table_number} • {t.table_label || 'Seat'}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-[#ECC980] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

          </div>

          {/* Search & Dietary Bar */}
          <div className="mt-6 flex flex-col md:flex-row gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A6F68]" />
              <input
                type="text"
                placeholder="Search specialty coffees, toasts, pastries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white text-[#2A2521] placeholder-[#7A6F68] text-sm focus:outline-none focus:ring-2 focus:ring-[#DF9B52] shadow-md"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#7A6F68] hover:text-[#1E130D]"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Quick Dietary Filters */}
            <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
              {[
                { id: 'ALL', label: 'All Diets' },
                { id: 'Special', label: '⭐ Musafir Special' },
                { id: 'Vegan', label: '🌿 Vegan' },
                { id: 'Gluten-Free', label: '🌾 Gluten-Free' },
              ].map((diet) => (
                <button
                  key={diet.id}
                  onClick={() => setDietaryFilter(diet.id)}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shadow-sm ${
                    dietaryFilter === diet.id
                      ? 'bg-[#C86D3B] text-white ring-1 ring-[#ECC980]'
                      : 'bg-white/10 hover:bg-white/20 text-white/90 border border-white/10'
                  }`}
                >
                  {diet.label}
                </button>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        
        {/* Category Tabs */}
        <div className="sticky top-16 z-30 bg-[#FDF8F2]/95 backdrop-blur-md pt-2 pb-3">
          <CategoryTabs
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            counts={categoryCounts}
          />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="my-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-center space-x-3 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Skeleton Loaders */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mt-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-3xl overflow-hidden border border-[#F4EDE4] shadow-sm animate-pulse">
                <div className="h-44 sm:h-48 bg-[#F4EDE4]" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-[#F4EDE4] rounded-md w-3/4" />
                  <div className="h-3 bg-[#F4EDE4] rounded-md w-full" />
                  <div className="h-3 bg-[#F4EDE4] rounded-md w-2/3" />
                  <div className="pt-3 flex justify-between items-center">
                    <div className="h-5 bg-[#F4EDE4] rounded-md w-16" />
                    <div className="h-8 bg-[#F4EDE4] rounded-xl w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          /* Empty Search / Filter Result */
          <div className="py-16 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#F4EDE4] mx-auto flex items-center justify-center text-[#C86D3B]">
              <Coffee className="w-8 h-8" />
            </div>
            <h3 className="font-serif font-bold text-xl text-[#1E130D]">No Cafe Items Found</h3>
            <p className="text-sm text-[#7A6F68] max-w-sm mx-auto">
              We couldn't find any items matching "{searchQuery}". Try selecting another category or clearing your filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setDietaryFilter('ALL');
              }}
              className="px-4 py-2 rounded-xl bg-[#1E130D] text-white text-xs font-bold shadow-md hover:bg-[#C86D3B] transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          /* Menu Items Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mt-4">
            {filteredItems.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        )}

      </main>

      {/* Floating Bottom Cart Bar for Quick Mobile Access */}
      {cartCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-30 animate-slide-up">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-[#1E130D] hover:bg-[#C86D3B] text-white p-4 rounded-2xl shadow-cafe-card flex items-center justify-between transition-all active:scale-[0.99] border border-[#DF9B52]/40"
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <ShoppingBag className="w-6 h-6 text-[#ECC980]" />
                <span className="absolute -top-1.5 -right-2 bg-[#C86D3B] text-white rounded-full text-[10px] font-bold w-4 h-4 flex items-center justify-center border border-black">
                  {cartCount}
                </span>
              </div>
              <div className="text-left">
                <span className="block text-xs uppercase tracking-wider font-semibold text-[#DF9B52]">
                  Your Order (Table #{tableNumber})
                </span>
                <span className="block font-bold text-sm">
                  {cartCount} item{cartCount > 1 ? 's' : ''} added
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="font-serif font-bold text-lg text-[#ECC980]">
                ${cartTotal.toFixed(2)}
              </span>
              <span className="bg-[#DF9B52] text-[#1E130D] px-3 py-1.5 rounded-xl text-xs font-bold">
                Review & Order →
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Cart Drawer Component */}
      <Cart />

      {/* Guest Check-in Modal on QR scan */}
      <GuestCheckinModal
        isOpen={isCheckinModalOpen}
        onClose={() => {
          setIsCheckinModalOpen(false);
          sessionStorage.setItem('musafir_checkin_dismissed', 'true');
        }}
      />

    </div>
  );
}

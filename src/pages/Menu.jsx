import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { IMAGES } from '../constants/images'
import Reveal from '../components/Reveal'
import { api } from '../lib/api'
import { supabase, isSupabaseReady } from '../lib/supabase'
import { useCart } from '../context/CartContext'
import foodImg from '../assets/images/food.png'
import {
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Gift,
  Coffee,
  Leaf,
  Utensils,
  Cookie,
  Sandwich,
  UtensilsCrossed,
  Pizza,
  Cake,
  GlassWater,
} from 'lucide-react'
import CustomerCaptureModal from '../components/CustomerCaptureModal'
import RewardRedemptionModal from '../components/RewardRedemptionModal'

// Curated high-resolution photos and concise descriptions matching reference design
const DEFAULT_CATEGORY_DATA = [
  {
    id: 'coffee',
    name: 'COFFEE',
    description: 'From classic brews to specialty creations, made with passion.',
    photo_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    download_btn_text: 'EXPLORE COFFEE ➔',
  },
  {
    id: 'tea',
    name: 'TEA',
    description: 'A perfect blend of aroma, taste and wellness in every sip.',
    photo_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
    download_btn_text: 'EXPLORE TEA ➔',
  },
  {
    id: 'breakfast',
    name: 'BREAKFAST',
    description: 'Wholesome and delicious start to your perfect day.',
    photo_url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
    download_btn_text: 'EXPLORE BREAKFAST ➔',
  },
  {
    id: 'snacks',
    name: 'SNACKS',
    description: 'Light bites and tasty treats to keep you going.',
    photo_url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80',
    download_btn_text: 'EXPLORE SNACKS ➔',
  },
  {
    id: 'sandwiches',
    name: 'SANDWICHES',
    description: 'Artisanal grilled sourdough sandwiches and gourmet toasties.',
    photo_url: '/food/gallery-13.jpg',
    download_btn_text: 'EXPLORE SANDWICHES ➔',
  },
  {
    id: 'pasta',
    name: 'PASTA',
    description: 'Authentic Italian pastas tossed in rich savory sauces.',
    photo_url: '/food/gallery-17.jpg',
    download_btn_text: 'EXPLORE PASTA ➔',
  },
  {
    id: 'pizza',
    name: 'PIZZA',
    description: 'Hand-tossed wood-fired pizzas with fresh mozzarella & toppings.',
    photo_url: '/food/gallery-6.jpg',
    download_btn_text: 'EXPLORE PIZZA ➔',
  },
  {
    id: 'desserts',
    name: 'DESSERTS',
    description: 'Decadent brownies, waffles, cakes, and artisan sweets.',
    photo_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
    download_btn_text: 'EXPLORE DESSERTS ➔',
  },
  {
    id: 'cold-beverages',
    name: 'COLD BEVERAGES',
    description: 'Chilled cold brews, blended frappes, and refreshing shakes.',
    photo_url: '/food/gallery-2.jpg',
    download_btn_text: 'EXPLORE COLD BEVERAGES ➔',
  },
  {
    id: 'mocktails',
    name: 'MOCKTAILS',
    description: 'Signature handcrafted coolers, spritzers, and fusions.',
    photo_url: '/food/gallery-3.jpg',
    download_btn_text: 'EXPLORE MOCKTAILS ➔',
  },
  {
    id: 'combos',
    name: 'COMBOS',
    description: 'Curated meal combinations and chef special platters.',
    photo_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
    download_btn_text: 'EXPLORE COMBOS ➔',
  },
]

// Category icon resolver
function getCategoryIcon(name) {
  const lower = (name || '').toLowerCase()
  if (lower.includes('coffee') || lower.includes('espresso')) {
    return <Coffee className="w-5 h-5 text-[#B87A44]" />
  }
  if (lower.includes('tea') || lower.includes('matcha') || lower.includes('chai')) {
    return <Leaf className="w-5 h-5 text-[#B87A44]" />
  }
  if (lower.includes('breakfast') || lower.includes('brunch') || lower.includes('egg')) {
    return <Utensils className="w-5 h-5 text-[#B87A44]" />
  }
  if (lower.includes('snack') || lower.includes('fry') || lower.includes('fries')) {
    return <Cookie className="w-5 h-5 text-[#B87A44]" />
  }
  if (lower.includes('sandwich') || lower.includes('panini') || lower.includes('toastie')) {
    return <Sandwich className="w-5 h-5 text-[#B87A44]" />
  }
  if (lower.includes('pasta') || lower.includes('spaghetti')) {
    return <UtensilsCrossed className="w-5 h-5 text-[#B87A44]" />
  }
  if (lower.includes('pizza')) {
    return <Pizza className="w-5 h-5 text-[#B87A44]" />
  }
  if (lower.includes('dessert') || lower.includes('cake') || lower.includes('bake') || lower.includes('waffle')) {
    return <Cake className="w-5 h-5 text-[#B87A44]" />
  }
  if (lower.includes('cold') || lower.includes('smoothie') || lower.includes('shake') || lower.includes('frappe')) {
    return <GlassWater className="w-5 h-5 text-[#B87A44]" />
  }
  if (lower.includes('mocktail') || lower.includes('cooler') || lower.includes('mojito')) {
    return <Sparkles className="w-5 h-5 text-[#B87A44]" />
  }
  if (lower.includes('combo')) {
    return <Gift className="w-5 h-5 text-[#B87A44]" />
  }
  return <Coffee className="w-5 h-5 text-[#B87A44]" />
}

// Smart image resolver based on category name
function getCategoryImage(cat) {
  if (cat.photo_url) return cat.photo_url
  if (cat.image_url) return cat.image_url

  const lower = (cat.name || '').toLowerCase()
  if (lower.includes('coffee') || lower.includes('brew') || lower.includes('espresso')) {
    return 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80'
  }
  if (lower.includes('tea') || lower.includes('matcha') || lower.includes('chai')) {
    return 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80'
  }
  if (lower.includes('breakfast') || lower.includes('brunch') || lower.includes('egg')) {
    return 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80'
  }
  if (lower.includes('snack') || lower.includes('fry') || lower.includes('fries') || lower.includes('nacho')) {
    return 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80'
  }
  if (lower.includes('sandwich') || lower.includes('panini') || lower.includes('toastie')) {
    return '/food/gallery-13.jpg'
  }
  if (lower.includes('pasta') || lower.includes('spaghetti') || lower.includes('penne')) {
    return '/food/gallery-17.jpg'
  }
  if (lower.includes('pizza')) {
    return '/food/gallery-6.jpg'
  }
  if (lower.includes('dessert') || lower.includes('cake') || lower.includes('bake') || lower.includes('waffle')) {
    return 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80'
  }
  if (lower.includes('cold') || lower.includes('smoothie') || lower.includes('shake') || lower.includes('frappe')) {
    return '/food/gallery-2.jpg'
  }
  if (lower.includes('mocktail') || lower.includes('cooler') || lower.includes('mojito')) {
    return '/food/gallery-3.jpg'
  }
  if (lower.includes('combo')) {
    return 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80'
  }
  return 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80'
}

// Single Category Showcase Card (Matching exact reference design: 2 per line, horizontal split)
function CategoryShowcaseCard({ category }) {
  const navigate = useNavigate()
  const { tableNumber } = useCart()
  const imageUrl = getCategoryImage(category)
  const categoryName = (category.name || 'Menu').toUpperCase()
  const icon = getCategoryIcon(category.name)
  const description =
    category.description ||
    'Handcrafted artisanal selections made fresh every morning with organic ingredients.'

  const targetCategorySlug =
    category.id || encodeURIComponent((category.name || 'food').toLowerCase().replace(/\s+/g, '-'))

  const handleOpenListing = () => {
    navigate(`/menu/${targetCategorySlug}${tableNumber ? `?table=${tableNumber}` : ''}`)
  }

  return (
    <div
      onClick={handleOpenListing}
      className="w-full bg-white border border-[#E8E2D9] rounded-2xl overflow-hidden grid grid-cols-2 min-h-[165px] h-[175px] xs:h-[185px] sm:h-[195px] md:h-[205px] shadow-xs hover:shadow-xl hover:border-[#1C1C1C]/40 transition-all duration-300 cursor-pointer group"
    >
      {/* Left Column: Icon + Title, Concise Description, Explore Button */}
      <div className="p-3 xs:p-4 sm:p-5 md:p-6 flex flex-col justify-between items-start text-left bg-white h-full overflow-hidden">
        <div className="w-full">
          {/* Icon + Title Header */}
          <div className="flex items-center space-x-1.5 xs:space-x-2">
            <span className="shrink-0 scale-90 xs:scale-100">{icon}</span>
            <h2 className="font-serif text-sm xs:text-base sm:text-lg md:text-[19px] font-bold text-[#1C1C1C] tracking-wide group-hover:text-[#B87A44] transition-colors truncate">
              {categoryName}
            </h2>
          </div>

          <p className="font-sans font-light text-muted text-[11px] xs:text-xs sm:text-[12px] leading-snug xs:leading-relaxed line-clamp-2 mt-1 xs:mt-2">
            {description}
          </p>
        </div>

        <div className="pt-1.5 xs:pt-2 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleOpenListing()
            }}
            className="bg-[#1C1C1C] hover:bg-black group-hover:bg-[#1C1C1C] text-[#D4A373] group-hover:text-[#E8C547] font-sans text-[9px] xs:text-[10px] sm:text-[10.5px] font-bold tracking-wider uppercase px-2.5 xs:px-3.5 sm:px-4 py-1 xs:py-1.5 sm:py-2 rounded-full transition-all duration-200 inline-flex items-center space-x-1 shadow-xs active:scale-95 cursor-pointer truncate max-w-full"
          >
            <span className="truncate">EXPLORE</span>
            <span className="text-[10px] xs:text-xs">➔</span>
          </button>
        </div>
      </div>

      {/* Right Column: High-Res Category Image */}
      <div className="w-full h-full overflow-hidden bg-[#FAF8F4] relative">
        <img
          src={imageUrl}
          alt={categoryName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=800&q=80'
          }}
        />
      </div>
    </div>
  )
}

function Menu() {
  const [searchParams] = useSearchParams()
  const {
    cartCount,
    cartTotal,
    setIsCartOpen,
    tableNumber,
    setTableNumber,
    customerSession,
    setIsCustomerCaptureOpen,
    setIsRewardModalOpen,
  } = useCart()
  const [categories, setCategories] = useState(DEFAULT_CATEGORY_DATA)
  const [loading, setLoading] = useState(true)

  // Sync table parameter from URL (?table=1). If no table param, clear tableNumber for online ordering
  useEffect(() => {
    const tableParam = searchParams.get('table')
    if (tableParam) {
      if (tableParam !== tableNumber) {
        setTableNumber(tableParam)
      }
      // Trigger Customer Capture if not identified and not skipped
      if (!customerSession.isIdentified && !customerSession.isGuest) {
        setIsCustomerCaptureOpen(true)
      }
    } else {
      if (tableNumber) {
        setTableNumber(null)
      }
    }
  }, [searchParams, tableNumber, setTableNumber, customerSession, setIsCustomerCaptureOpen])

  // Fetch dynamic categories from Supabase
  const loadDynamicCategories = async () => {
    try {
      const data = await api.getCategories()
      if (data && data.length > 0) {
        setCategories(data)
      }
    } catch (err) {
      console.warn('Could not load categories from Supabase, using defaults:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDynamicCategories()

    // Realtime category sync with Supabase
    if (isSupabaseReady && supabase) {
      const catChannel = supabase
        .channel('public-categories-showcase')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
          loadDynamicCategories()
        })
        .subscribe()

      return () => {
        supabase.removeChannel(catChannel)
      }
    }
  }, [])

  return (
    <div className="bg-[#FAF8F4] min-h-screen pb-20">

      {/* HERO BANNER WITH HARDWARE-ACCELERATED STICKY PARALLAX (Works on Mobile & Desktop) */}
      <section className="parallax-window min-h-[340px] md:min-h-[380px] flex flex-col items-center justify-center text-center px-6 bg-[#1C130D]">
        <div className="parallax-fixed-layer">
          <img
            src={foodImg}
            alt="Menu Hero Background"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/40 pointer-events-none" />
        </div>
        {/* Floating Loyalty Pill Badge in Hero Top-Left (Mobile Responsive) */}
        {customerSession.isIdentified && (
          <div className="absolute top-3.5 sm:top-6 md:top-8 left-3 sm:left-6 md:left-12 lg:left-20 max-w-[calc(100vw-24px)] z-20 animate-fade-in">
            <div className="inline-flex items-center gap-1.5 sm:gap-2.5 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-white text-[10.5px] sm:text-xs font-sans shadow-xl max-w-full">
              <span className="text-white/90 truncate flex items-center gap-1">
                <span>Welcome,</span>
                <strong className="text-white font-medium max-w-[85px] sm:max-w-[150px] truncate inline-block align-bottom">
                  {customerSession.name}
                </strong>
                <span className="text-white/40">•</span>
                <span className="text-[#E0A96D] font-bold shrink-0">⭐ {customerSession.travel_tokens}</span>
                <span className="hidden xs:inline text-white/80">Tokens</span>
              </span>
              {customerSession.travel_tokens > 0 && (
                <button
                  onClick={() => setIsRewardModalOpen(true)}
                  className="shrink-0 px-2 sm:px-2.5 py-0.5 rounded-full bg-[#D4A373] hover:bg-[#c49260] text-[#1C1C1C] text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider transition-transform active:scale-95 cursor-pointer shadow-sm ml-0.5"
                >
                  REDEEM
                </button>
              )}
            </div>
          </div>
        )}

        <div className="relative z-10 max-w-2xl mx-auto">
          {tableNumber ? (
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold shadow mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#25D366] animate-pulse" />
              <span>Ordering for Table #{tableNumber}</span>
            </div>
          ) : (
            <></>
          )}

          <h1 className="animate-hero font-serif text-5xl md:text-6xl font-bold text-white mb-3 tracking-tight drop-shadow-md">
            Our Menu
          </h1>
          <p className="animate-hero-delay-1 font-sans font-light text-white/95 text-lg md:text-xl drop-shadow">
            Fresh, seasonal, handmade every day.
          </p>
        </div>
      </section>

      {/* CATEGORY SHOWCASE LISTING (2 PER LINE GRID) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {categories.map((category) => (
            <Reveal key={category.id || category.name} delay={10}>
              <CategoryShowcaseCard category={category} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* STICKY FLOATING BOTTOM CART BAR */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 inset-x-0 z-40 px-4 flex justify-center animate-slide-up">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full max-w-lg bg-[#1C1C1C] hover:bg-black text-white p-4 rounded-full shadow-2xl flex items-center justify-between border border-white/20 transition-all active:scale-[0.98] cursor-pointer"
          >
            <div className="flex items-center space-x-3 pl-2">
              <div className="w-9 h-9 rounded-full bg-green text-white flex items-center justify-center font-bold text-xs shadow">
                {cartCount}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold uppercase tracking-wider text-white">
                  View Your Order • Table #{tableNumber || '1'}
                </p>
                <p className="text-xs text-white/80 font-serif">
                  ₹{cartTotal.toFixed(2)} Total
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 pr-2 font-sans text-xs font-bold text-[#25D366] uppercase tracking-wider">
              <span>Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* ALLERGEN NOTE */}
      <section className="bg-white border-t border-border py-16 px-6 text-center">
        <Reveal as="h2" className="font-serif text-2xl font-medium mb-4 text-[#1C1C1C]">
          Allergen Information
        </Reveal>
        <Reveal
          as="p"
          delay={150}
          className="font-sans font-light text-sm text-muted leading-relaxed mb-4 max-w-xl mx-auto"
        >
          Please ask a member of staff about allergens before ordering. Full allergen information is
          available on request.
        </Reveal>
        <Reveal delay={300} className="inline-block">
          <a
            href="#"
            className="font-sans font-bold text-xs tracking-widest uppercase text-green underline"
          >
            View Full Allergen List →
          </a>
        </Reveal>
      </section>

      {/* CUSTOMER CAPTURE & REWARD MODALS */}
      <CustomerCaptureModal />
      <RewardRedemptionModal />

    </div>
  )
}

export default Menu

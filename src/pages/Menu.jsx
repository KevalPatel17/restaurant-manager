import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { IMAGES } from '../constants/images'
import Reveal from '../components/Reveal'
import { api } from '../lib/api'
import { supabase, isSupabaseReady } from '../lib/supabase'
import { useCart } from '../context/CartContext'
import foodImg from '../assets/images/food.png'
import { ShoppingBag, ArrowRight } from 'lucide-react'

// Curated high-resolution fallback photos for category cards matching the aesthetic
const DEFAULT_CATEGORY_DATA = [
  {
    id: 'food',
    name: 'Food Menu',
    description:
      'Our menu includes a fresh all day breakfast with items like soldiers and dippy eggs, a hearty porridge and famous scrambled eggs. Our toasties, soups and salads are yummy! Our peanut butter is delicious and our granola is legendary!',
    photo_url: 'https://www.gingerandwhite.com/cdn/shop/files/eggs-sourdough.jpg?v=1692816641',
    download_btn_text: 'Download Food Menu',
    pdf_url: '#',
  },
  {
    id: 'coffee',
    name: 'Coffee Menu',
    description:
      'At Musafir Cafe, we use single-origin artisanal blends. Hand-roasted in small, artful batches by skilled roasters who care deeply about taste, aroma, and provenance.',
    photo_url: 'https://www.gingerandwhite.com/cdn/shop/files/hot-chocolate.jpg?v=1692819145',
    download_btn_text: 'Download Coffee Menu',
    pdf_url: '#',
  },
  {
    id: 'cakes',
    name: 'Cakes & Bakes',
    description:
      'Our cakes are freshly made by us every single morning in our kitchen. Nothing stays around for very long! Flaky cinnamon buns, rich brownies, and signature tea cakes.',
    photo_url: 'https://www.gingerandwhite.com/cdn/shop/files/cake_9100f966-639e-427f-ae81-17f6708a0ecf.jpg?v=1692818921',
    download_btn_text: 'Download Cakes & Bakes Menu',
    pdf_url: '#',
  },
  {
    id: 'kids',
    name: 'Kids Menu',
    description:
      'Kids are the joy of our cafe and we have created a special menu based on lots of experience! Delicious mini dippy eggs, crispy fish finger sandwiches, and creamy babyccinos.',
    photo_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1000&q=80',
    download_btn_text: 'Download Kids Menu',
    pdf_url: '#',
  },
]

// Smart image resolver based on category name
function getCategoryImage(cat) {
  if (cat.photo_url) return cat.photo_url
  if (cat.image_url) return cat.image_url

  const lower = (cat.name || '').toLowerCase()
  if (lower.includes('coffee') || lower.includes('brew') || lower.includes('espresso')) {
    return 'https://www.gingerandwhite.com/cdn/shop/files/hot-chocolate.jpg?v=1692819145'
  }
  if (lower.includes('tea') || lower.includes('matcha')) {
    return 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1000&q=80'
  }
  if (lower.includes('cake') || lower.includes('bake') || lower.includes('dessert') || lower.includes('bakery')) {
    return 'https://www.gingerandwhite.com/cdn/shop/files/cake_9100f966-639e-427f-ae81-17f6708a0ecf.jpg?v=1692818921'
  }
  if (lower.includes('sandwich') || lower.includes('bite') || lower.includes('panini')) {
    return 'https://www.gingerandwhite.com/cdn/shop/files/Sandwich---Salt-Beef.jpg?v=1701193533'
  }
  if (lower.includes('kid')) {
    return 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1000&q=80'
  }
  // Default: Dippy eggs & brunch
  return 'https://www.gingerandwhite.com/cdn/shop/files/eggs-sourdough.jpg?v=1692816641'
}

// Single Category Showcase Card (Matching reference design)
function CategoryShowcaseCard({ category }) {
  const navigate = useNavigate()
  const { tableNumber } = useCart()
  const imageUrl = getCategoryImage(category)
  const categoryName = category.name || 'Menu'
  const buttonText = category.download_btn_text || `Explore ${categoryName} ➔`
  const description =
    category.description ||
    'Our handcrafted artisanal selection made fresh every morning with organic and locally sourced ingredients.'

  const targetCategorySlug =
    category.id || encodeURIComponent((category.name || 'food').toLowerCase().replace(/\s+/g, '-'))

  const handleOpenListing = () => {
    navigate(`/menu/${targetCategorySlug}${tableNumber ? `?table=${tableNumber}` : ''}`)
  }

  return (
    <div
      onClick={handleOpenListing}
      className="w-full bg-white border-2 md:border-[2.5px] border-[#1C1C1C] rounded-xl md:rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-black md:h-[315px] cursor-pointer group"
    >
      {/* Left Column: Title, Description, Explore Button */}
      <div className="p-6 sm:p-8 md:p-9 lg:p-10 flex flex-col justify-between items-start text-left bg-white order-2 md:order-1 h-full overflow-hidden">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-[34px] lg:text-[38px] font-normal text-[#1C1C1C] leading-tight tracking-normal group-hover:text-green transition-colors">
            {categoryName}
          </h2>
          <p className="font-sans font-light text-muted text-xs sm:text-sm md:text-[13.5px] leading-relaxed max-w-md line-clamp-2 md:line-clamp-3 mt-2.5">
            {description}
          </p>
        </div>

        <div className="pt-3 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleOpenListing()
            }}
            className="bg-[#1C1C1C] group-hover:bg-green hover:!bg-black text-white font-sans text-xs sm:text-sm font-medium px-7 py-3 rounded-full transition-all duration-200 inline-flex items-center space-x-2 shadow-sm active:scale-[0.98]"
          >
            <span>{buttonText}</span>
          </button>
        </div>
      </div>

      {/* Right Column: High-Res Category Image */}
      <div className="w-full h-56 sm:h-64 md:h-full overflow-hidden bg-[#FAF8F4] order-1 md:order-2 border-b-2 md:border-b-0 md:border-l-2 md:border-l-[2.5px] border-[#1C1C1C]">
        <img
          src={imageUrl}
          alt={categoryName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          onError={(e) => {
            e.target.src = 'https://www.gingerandwhite.com/cdn/shop/files/eggs-sourdough.jpg?v=1692816641'
          }}
        />
      </div>
    </div>
  )
}

function Menu() {
  const [searchParams] = useSearchParams()
  const { cartCount, cartTotal, setIsCartOpen, tableNumber, setTableNumber } = useCart()
  const [categories, setCategories] = useState(DEFAULT_CATEGORY_DATA)
  const [loading, setLoading] = useState(true)

  // Sync table parameter from URL (?table=1). If no table param, clear tableNumber for online ordering
  useEffect(() => {
    const tableParam = searchParams.get('table')
    if (tableParam) {
      if (tableParam !== tableNumber) {
        setTableNumber(tableParam)
      }
    } else {
      if (tableNumber) {
        setTableNumber(null)
      }
    }
  }, [searchParams, tableNumber, setTableNumber])

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

      {/* HERO BANNER */}
      <section className="relative min-h-[340px] md:min-h-[380px] flex flex-col items-center justify-center text-center px-6 overflow-hidden bg-green">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${foodImg})` }}
        />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[0.5px]" />

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

      {/* CATEGORY SHOWCASE LISTING */}
      <section className="max-w-[1240px] mx-auto px-6 py-14 sm:py-20 space-y-10 sm:space-y-12">
        {categories.map((category) => (
          <Reveal key={category.id || category.name} delay={100}>
            <CategoryShowcaseCard category={category} />
          </Reveal>
        ))}
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
                  ${cartTotal.toFixed(2)} Total
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

    </div>
  )
}

export default Menu

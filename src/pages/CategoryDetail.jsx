import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Sparkles, Loader2, Coffee, Plus, Minus, ShoppingBag, ArrowRight, Gift } from 'lucide-react'
import { api } from '../lib/api'
import { supabase, isSupabaseReady } from '../lib/supabase'
import { useCart } from '../context/CartContext'
import Reveal from '../components/Reveal'
import { IMAGES } from '../constants/images'
import toast from 'react-hot-toast'
import CustomerCaptureModal from '../components/CustomerCaptureModal'
import RewardRedemptionModal from '../components/RewardRedemptionModal'

// Default fallback items per category slug
const FALLBACK_CATEGORY_ITEMS = {
  coffee: {
    name: 'COFFEE',
    description:
      'Artisanal espresso, slow pour-overs, handcrafted cappuccinos and signature hot brews made from single-origin beans.',
    photo_url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=1200&q=80',
    items: [
      { id: 'c1', name: 'Single Origin Double Espresso', photo_url: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=800&auto=format&fit=crop&q=80', description: 'Intense double espresso with rich caramel crema and toasted hazelnut notes.', price: 180, is_special: true, dietary_tags: ['Classic'] },
      { id: 'c2', name: 'Artisan Hot Cappuccino', photo_url: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=800&auto=format&fit=crop&q=80', description: 'Rich double espresso with velvety microfoam dusted with chocolate.', price: 240, dietary_tags: ['House Blend'] },
      { id: 'c3', name: 'Spanish Cortado', photo_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80', description: 'Equal parts espresso and warm textured milk for a bold smooth sip.', price: 220, dietary_tags: ['Espresso'] },
      { id: 'c4', name: 'Vanilla Bean Cafe Latte', photo_url: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=800&auto=format&fit=crop&q=80', description: 'Slow-roasted espresso with natural Madagascar vanilla syrup and silky foam.', price: 270, is_special: true, dietary_tags: ['Popular'] },
    ],
  },
  tea: {
    name: 'TEA',
    description:
      'Loose-leaf organic teas, spiced Masala Chai, Earl Grey, calming chamomile, and ceremonial matcha infusions.',
    photo_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1200&q=80',
    items: [
      { id: 't1', name: 'Royal Spiced Masala Chai', photo_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80', description: 'Traditional slow-brewed black tea with crushed cardamom, ginger and cinnamon.', price: 140, is_special: true, dietary_tags: ['House Special'] },
      { id: 't2', name: 'Ceremonial Uji Matcha Latte', photo_url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=800&auto=format&fit=crop&q=80', description: 'Japanese ceremonial grade matcha whisked with oat or whole milk.', price: 320, dietary_tags: ['Healthy'] },
      { id: 't3', name: 'Kashmiri Saffron Kahwa', photo_url: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=800&auto=format&fit=crop&q=80', description: 'Fragrant green tea with saffron strands, whole spices, and slivered almonds.', price: 210, dietary_tags: ['Organic'] },
    ],
  },
  breakfast: {
    name: 'BREAKFAST',
    description:
      'All-day breakfast bowls, fluffy scrambled eggs, sourdough avocado toast, pancake stacks, and wholesome morning plates.',
    photo_url: 'https://www.gingerandwhite.com/cdn/shop/files/eggs-sourdough.jpg?v=1692816641',
    items: [
      { id: 'br1', name: 'Smashed Avocado & Poached Eggs', photo_url: 'https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?w=800&auto=format&fit=crop&q=80', description: 'Avocado mash, cherry tomatoes, and two poached eggs on sourdough.', price: 360, is_special: true, dietary_tags: ['Chef Special'] },
      { id: 'br2', name: 'Fluffy Brioche French Toast Stack', photo_url: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&auto=format&fit=crop&q=80', description: 'Brioche toast with maple syrup, wild berries and whipped cream.', price: 330, dietary_tags: ['Sweet Breakfast'] },
    ],
  },
  snacks: {
    name: 'SNACKS',
    description:
      'Crispy Peri Peri fries, loaded Mexican nachos, cheesy garlic bread baguettes, paneer pops, and savory quick bites.',
    photo_url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=1200&q=80',
    items: [
      { id: 'sn1', name: 'Crispy Peri Peri French Fries Platter', photo_url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=800&auto=format&fit=crop&q=80', description: 'Golden fries tossed in peri peri spice blend with garlic dip.', price: 210, dietary_tags: ['Crispy'] },
      { id: 'sn2', name: 'Cheesy Garlic Bread Baguettes (4 Pcs)', photo_url: 'https://images.unsplash.com/photo-1619860860774-1e2e17343432?w=800&auto=format&fit=crop&q=80', description: 'Baguette slices with garlic herb butter and melted mozzarella.', price: 240, is_special: true, dietary_tags: ['Cheesy'] },
      { id: 'sn3', name: 'Loaded Supreme Nachos', photo_url: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=800&auto=format&fit=crop&q=80', description: 'Corn tortilla chips with queso sauce, refried beans, and pico de gallo.', price: 290, dietary_tags: ['Mexican'] },
    ],
  },
  sandwiches: {
    name: 'SANDWICHES',
    description:
      'Artisanal grilled sourdough sandwiches, layered club toasties, gourmet vegetable paninis, and melt-in-the-mouth wraps.',
    photo_url: 'https://www.gingerandwhite.com/cdn/shop/files/Sandwich---Salt-Beef.jpg?v=1701193533',
    items: [
      { id: 'sw1', name: 'Artisan Grilled Veggie Club Sandwich', photo_url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=80', description: 'Three layered sandwich with zucchini, peppers, cheese and fries.', price: 290, is_special: true, dietary_tags: ['Bestseller'] },
      { id: 'sw2', name: 'Paneer Tikka Sourdough Panini', photo_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=80', description: 'Tandoori paneer, pickled onions and smoked cheddar on sourdough.', price: 320, dietary_tags: ['Smoky'] },
    ],
  },
  pasta: {
    name: 'PASTA',
    description:
      'Al dente Italian penne & spaghetti in spicy Arrabbiata, creamy Alfredo white sauce, and fragrant herb pesto with garlic bread.',
    photo_url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281670?auto=format&fit=crop&w=1200&q=80',
    items: [
      { id: 'ps1', name: 'Arrabbiata Spicy Red Sauce Penne', photo_url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281670?w=800&auto=format&fit=crop&q=80', description: 'Penne in fiery tomato sauce with chili flakes and garlic bread.', price: 360, dietary_tags: ['Spicy'] },
      { id: 'ps2', name: 'Creamy Alfredo White Sauce Penne', photo_url: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=800&auto=format&fit=crop&q=80', description: 'Parmesan cream sauce with sauteed mushrooms, herbs and toast.', price: 380, is_special: true, dietary_tags: ['Creamy'] },
    ],
  },
  pizza: {
    name: 'PIZZA',
    description:
      'Hand-stretched wood-fired sourdough pizzas with artisanal tomato sauce, fresh mozzarella, veggies, and aromatic herbs.',
    photo_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80',
    items: [
      { id: 'pz1', name: 'Wood-Fired Veggie Supreme Pizza', photo_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80', description: 'Marinara, mozzarella, bell peppers, olives, jalapenos and fresh basil.', price: 460, is_special: true, dietary_tags: ['Signature'] },
      { id: 'pz2', name: 'Pesto Margherita Sourdough Pizza', photo_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&auto=format&fit=crop&q=80', description: 'Basil walnut pesto base, bocconcini mozzarella and cherry tomatoes.', price: 490, dietary_tags: ['Gourmet'] },
    ],
  },
  desserts: {
    name: 'DESSERTS',
    description:
      'Decadent warm chocolate brownies, Belgian waffles, artisan cheesecakes, tiramisu, and fresh bakery pastries.',
    photo_url: 'https://www.gingerandwhite.com/cdn/shop/files/cake_9100f966-639e-427f-ae81-17f6708a0ecf.jpg?v=1692818921',
    items: [
      { id: 'ds1', name: 'Warm Belgian Chocolate Fudge Brownie', photo_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&auto=format&fit=crop&q=80', description: 'Dark chocolate brownie served warm with vanilla ice cream.', price: 260, is_special: true, dietary_tags: ['Sweet Treat'] },
      { id: 'ds2', name: 'Classic Nutella Belgian Waffle', photo_url: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=800&auto=format&fit=crop&q=80', description: 'Crispy golden waffle with Nutella spread and roasted almonds.', price: 310, dietary_tags: ['Dessert'] },
    ],
  },
  'cold-beverages': {
    name: 'COLD BEVERAGES',
    description:
      'Chilled iced coffees, Vietnamese cold brews, thick chocolate frappes, creamy milkshakes, and fresh fruit smoothies.',
    photo_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=1200&q=80',
    items: [
      { id: 'cb1', name: 'Classic Musafir Cold Coffee Frappe', photo_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800&auto=format&fit=crop&q=80', description: 'Blended cold coffee with ice cream and chocolate dust.', price: 240, is_special: true, dietary_tags: ['Bestseller'] },
      { id: 'cb2', name: 'Wild Berry Mint Smoothie', photo_url: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&auto=format&fit=crop&q=80', description: 'Greek yogurt with mixed berries, raw honey and fresh garden mint.', price: 280, dietary_tags: ['Healthy'] },
    ],
  },
  mocktails: {
    name: 'MOCKTAILS',
    description:
      'Signature refreshing coolers, Chili Guava rosemary mocktail, sparkling mojitos, citrus fusions, and fizzy botanicals.',
    photo_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1200&q=80',
    items: [
      { id: 'mk1', name: 'Chili Guava Rosemary Spiced Mocktail', photo_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80', description: 'Pink guava juice with chili salt rim, fresh lime and scorched rosemary.', price: 240, is_special: true, dietary_tags: ['Refreshing'] },
      { id: 'mk2', name: 'Cranberry Citrus Cold Brew Spritz', photo_url: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=800&auto=format&fit=crop&q=80', description: 'Tart cranberry juice, sparkling tonic water and cold brew float.', price: 260, dietary_tags: ['Citrus'] },
    ],
  },
  combos: {
    name: 'COMBOS',
    description:
      'Curated value meal combos — Pizza & Coolers, Sandwich & Coffee sets, and Cafe Special feast platters.',
    photo_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80',
    items: [
      { id: 'cm1', name: 'Solo Wanderer Combo: Sandwich + Cold Coffee', photo_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=80', description: 'Grilled Veggie Club Sandwich with Cold Coffee Frappe and Peri Peri fries.', price: 460, is_special: true, dietary_tags: ['Value Combo'] },
      { id: 'cm2', name: 'Italian Duo Combo: Pizza + Red Pasta', photo_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80', description: 'One 10-Inch Veggie Pizza, Arrabbiata Pasta, 2 Garlic Breads and 2 Coolers.', price: 890, dietary_tags: ['Feast'] },
    ],
  },
}

export default function CategoryDetail() {
  const { categoryId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const {
    cart,
    addToCart,
    updateQuantity,
    cartCount,
    cartTotal,
    setIsCartOpen,
    tableNumber,
    setTableNumber,
    customerSession,
    setIsCustomerCaptureOpen,
    setIsRewardModalOpen,
  } = useCart()

  const [category, setCategory] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  // Sync table parameter from URL (?table=1)
  useEffect(() => {
    const tableParam = searchParams.get('table')
    if (tableParam) {
      if (tableParam !== tableNumber) {
        setTableNumber(tableParam)
      }
      if (!customerSession.isIdentified && !customerSession.isGuest) {
        setIsCustomerCaptureOpen(true)
      }
    } else {
      if (tableNumber) {
        setTableNumber(null)
      }
    }
  }, [searchParams, tableNumber, setTableNumber, customerSession, setIsCustomerCaptureOpen])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    async function loadData() {
      setLoading(true)
      try {
        // 1. Fetch categories to find matching category by ID or slug
        const categories = await api.getCategories()
        let matchedCat = categories?.find(
          (c) =>
            c.id === categoryId ||
            c.name.toLowerCase().replace(/\s+/g, '-') === categoryId.toLowerCase() ||
            c.name.toLowerCase() === categoryId.toLowerCase()
        )

        // If found in Supabase
        if (matchedCat) {
          setCategory(matchedCat)
          const allItems = await api.getAllMenuItems()
          const catItems = (allItems || []).filter(
            (item) => item.category_id === matchedCat.id && item.is_available !== false
          )
          if (catItems.length > 0) {
            setItems(catItems)
          } else {
            // Fallback items if category currently has no items
            const catNameLower = (matchedCat.name || '').toLowerCase()
            const key =
              Object.keys(FALLBACK_CATEGORY_ITEMS).find((k) =>
                catNameLower.includes(k) || k.includes(catNameLower.replace(/\s+/g, '-'))
              ) || 'coffee'
            setItems(FALLBACK_CATEGORY_ITEMS[key]?.items || [])
          }
        } else {
          // Check static fallback data
          const fallbackKey =
            Object.keys(FALLBACK_CATEGORY_ITEMS).find(
              (k) =>
                k === categoryId.toLowerCase() ||
                FALLBACK_CATEGORY_ITEMS[k].name.toLowerCase().includes(categoryId.toLowerCase()) ||
                categoryId.toLowerCase().includes(k)
            ) || 'coffee'

          const fallback = FALLBACK_CATEGORY_ITEMS[fallbackKey]
          setCategory({
            id: fallbackKey,
            name: fallback.name,
            description: fallback.description,
            photo_url: fallback.photo_url,
          })
          setItems(fallback.items)
        }
      } catch (err) {
        console.warn('Error loading category detail:', err)
        const fallback = FALLBACK_CATEGORY_ITEMS.food
        setCategory(fallback)
        setItems(fallback.items)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [categoryId])

  const heroImage =
    category?.photo_url ||
    category?.image_url ||
    'https://www.gingerandwhite.com/cdn/shop/files/eggs-sourdough.jpg?v=1692816641'

  return (
    <div className="bg-[#FAF8F4] min-h-screen pb-24">

      {/* TOP CLEAN BREADCRUMBS & LOYALTY BAR */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-5 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E8E2D9]">
          <Link
            to={`/menu${tableNumber ? `?table=${tableNumber}` : ''}`}
            className="inline-flex items-center space-x-1.5 text-[#1C1C1C] hover:text-green text-[11px] font-sans uppercase font-bold tracking-wider transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            <span>Back to All Menus</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2.5">
            {tableNumber && (
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-white border border-[#E8E2D9] text-[#1C1C1C] text-[11px] font-bold shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse" />
                <span>Serving Table #{tableNumber}</span>
              </div>
            )}

            {customerSession.isIdentified && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E8E2D9] text-[#1C1C1C] text-[11px] font-sans shadow-sm">
                <span className="truncate flex items-center gap-1">
                  <span className="text-muted">Welcome,</span>
                  <strong className="text-[#1C1C1C] font-semibold">{customerSession.name}</strong>
                  <span className="text-[#D4A373] font-bold">⭐ {customerSession.travel_tokens}</span>
                  <span className="text-muted">Tokens</span>
                </span>
                {customerSession.travel_tokens > 0 && (
                  <button
                    onClick={() => setIsRewardModalOpen(true)}
                    className="px-2 py-0.5 rounded-full bg-[#D4A373] hover:bg-[#c49260] text-white text-[9px] font-bold uppercase tracking-wider transition-transform active:scale-95 cursor-pointer shadow-sm"
                  >
                    REDEEM
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CLEAN COMPACT CATEGORY TITLE & DESCRIPTION */}
        <div className="pt-4 sm:pt-5 pb-1">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#D4A373] block mb-0.5">
                Menu Category
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1C1C] tracking-tight">
                {category?.name || 'Menu Listing'}
              </h1>

            </div>
            <span className="self-start sm:self-auto text-[11px] font-sans font-bold uppercase tracking-wider text-green bg-white px-3 py-1 rounded-full border border-[#E8E2D9] shadow-sm shrink-0">
              {items.length} Items Available
            </span>
          </div>
        </div>
      </section>

      {/* ITEMS LISTING GRID */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-16">

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 text-muted">
            <Loader2 className="w-8 h-8 animate-spin text-green" />
            <p className="text-xs font-sans font-medium">Loading freshly brewed menu items...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {items.map((item) => {
              const displayImage =
                item.photo_url ||
                item.img ||
                'https://www.gingerandwhite.com/cdn/shop/files/eggs-sourdough.jpg?v=1692816641'
              const formattedPrice =
                typeof item.price === 'number' ? `₹${item.price.toFixed(2)}` : String(item.price || '₹0.00')

              // Check if item is already in cart
              const cartItem = cart.find((c) => c.id === item.id)

              return (
                <div
                  key={item.id || item.name}
                  className="bg-white rounded-2xl overflow-hidden border border-[#E8E2D9] hover:border-[#1C1C1C]/30 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    {/* Item Image with Wide Aspect Ratio and Badge Overlays */}
                    <div className="relative w-full h-40 sm:h-48 bg-[#F5F2EB] overflow-hidden">
                      <img
                        src={displayImage}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src = 'https://www.gingerandwhite.com/cdn/shop/files/eggs-sourdough.jpg?v=1692816641'
                        }}
                      />

                      {/* Overlaid Badges & Dietary Tags on the Image */}
                      <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-1.5 pointer-events-none">
                        <div className="flex flex-wrap gap-1.5">
                          {item.dietary_tags &&
                            item.dietary_tags.map((tag, idx) => {
                              const isVeg = tag.toLowerCase().includes('veg')
                              return (
                                <span
                                  key={tag}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs backdrop-blur-xs ${isVeg
                                    ? 'bg-white/95 text-[#1B4332] border border-[#2D6A4F]/30'
                                    : idx === 1
                                      ? 'bg-[#FFF6ED]/95 text-[#C85A17] border border-[#FCD5B5]'
                                      : 'bg-white/95 text-[#1C1C1C] border border-[#E8E2D9]'
                                    }`}
                                >
                                  {tag}
                                </span>
                              )
                            })}
                        </div>

                        {item.is_special && (
                          <span className="bg-[#193224] text-[#F3C644] font-sans text-[9.5px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md shadow-md shrink-0 flex items-center gap-1 border border-[#F3C644]/30">
                            SPECIAL ★
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Item Details */}
                    <div className="p-4 sm:p-5 pb-2">
                      <h3 className="font-serif text-base sm:text-[17px] font-bold text-[#1C1C1C] leading-snug line-clamp-2 min-h-[44px]">
                        {item.name}
                      </h3>
                      <p className="font-sans font-light text-xs text-muted leading-relaxed line-clamp-2 mt-1 min-h-[34px]">
                        {item.description || item.desc || 'Handcrafted daily with artisanal ingredients.'}
                      </p>
                    </div>
                  </div>

                  {/* Price & Add to Order Stepper */}
                  <div className="p-4 sm:p-5 pt-3 flex items-center justify-between border-t border-[#F0EBE1] mt-2">
                    <div>
                      <span className="text-[10px] text-muted font-bold block uppercase tracking-wider">
                        PRICE
                      </span>
                      <p className="font-sans font-bold text-base sm:text-[17px] text-[#1C1C1C]">
                        {formattedPrice}
                      </p>
                    </div>

                    {cartItem ? (
                      <div className="flex items-center space-x-2 bg-[#F5F2EB] p-1 rounded-xl border border-[#E8E2D9] shadow-xs">
                        <button
                          onClick={() => updateQuantity(cartItem.cartKey, -1)}
                          className="w-7 h-7 rounded-lg bg-white hover:bg-border flex items-center justify-center font-bold text-xs text-[#1C1C1C] transition-colors active:scale-95 shadow-2xs"
                          title="Reduce quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-bold text-xs px-1.5 text-[#1C1C1C] min-w-[16px] text-center">
                          {cartItem.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(cartItem.cartKey, 1)}
                          className="w-7 h-7 rounded-lg bg-white hover:bg-border flex items-center justify-center font-bold text-xs text-[#1C1C1C] transition-colors active:scale-95 shadow-2xs"
                          title="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          addToCart(item)
                          toast.success(`Added ${item.name} to order!`)
                        }}
                        className="bg-[#1C1C1C] hover:bg-[#2C3E2D] text-white font-sans text-xs font-bold px-4 sm:px-5 py-2 rounded-xl flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

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
                  {tableNumber ? `View Your Order • Table #${tableNumber}` : 'View Online Order'}
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
          Allergen &amp; Dietary Information
        </Reveal>
        <Reveal
          as="p"
          delay={150}
          className="font-sans font-light text-sm text-muted leading-relaxed mb-4 max-w-xl mx-auto"
        >
          Please inform our barista / staff regarding any allergies before ordering. Gluten-free, oat milk, and vegan alternatives are available on request.
        </Reveal>
        <Reveal delay={300} className="inline-block">
          <Link
            to={`/menu${tableNumber ? `?table=${tableNumber}` : ''}`}
            className="font-sans font-bold text-xs tracking-widest uppercase text-green underline"
          >
            ← Explore Other Menu Categories
          </Link>
        </Reveal>
      </section>

      {/* CUSTOMER CAPTURE & REWARD MODALS */}
      <CustomerCaptureModal />
      <RewardRedemptionModal />

    </div>
  )
}

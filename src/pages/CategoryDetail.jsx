import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Sparkles, Loader2, Coffee, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react'
import { api } from '../lib/api'
import { supabase, isSupabaseReady } from '../lib/supabase'
import { useCart } from '../context/CartContext'
import Reveal from '../components/Reveal'
import { IMAGES } from '../constants/images'
import toast from 'react-hot-toast'

// Default fallback items per category slug
const FALLBACK_CATEGORY_ITEMS = {
  food: {
    name: 'Food Menu',
    description:
      'Our menu includes a fresh all day breakfast with items like soldiers and dippy eggs, a hearty porridge and famous scrambled eggs. Our toasties, soups and salads are yummy!',
    photo_url: 'https://www.gingerandwhite.com/cdn/shop/files/eggs-sourdough.jpg?v=1692816641',
    items: [
      { id: 'f1', name: 'Dippy Eggs & Soldiers', photo_url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80', description: 'Free range soft boiled eggs with toasted sourdough soldiers.', price: 8.50, dietary_tags: ['Classic', 'Organic'] },
      { id: 'f2', name: 'Scrambled Eggs on Toast', photo_url: IMAGES.foodEggs, description: 'Famous scrambled eggs served on freshly baked sourdough.', price: 9.00, is_special: true, dietary_tags: ['Chef Special'] },
      { id: 'f3', name: 'Avocado Toast', photo_url: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&w=600&q=80', description: 'Smashed avocado with chilli flakes, lime and sea salt on toasted sourdough.', price: 10.00, dietary_tags: ['Vegan'] },
      { id: 'f4', name: 'Shakshuka', photo_url: IMAGES.foodEggs, description: 'Eggs baked in spiced tomato sauce with tahini, crumbled feta and fresh herbs.', price: 12.50, dietary_tags: ['Vegetarian'] },
      { id: 'f5', name: 'Salt Beef & Mustard Sourdough', photo_url: 'https://www.gingerandwhite.com/cdn/shop/files/Sandwich---Salt-Beef.jpg?v=1701193533', description: 'Slow cured salt beef with pickled gherkins and English mustard.', price: 11.50, dietary_tags: ['Signature'] },
      { id: 'f6', name: 'Organic Steel-Cut Porridge', photo_url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80', description: 'Warm oat porridge topped with forest honey, toasted almonds and fresh berries.', price: 7.50, dietary_tags: ['Healthy'] },
    ],
  },
  coffee: {
    name: 'Coffee Menu',
    description:
      'At Musafir Cafe, we use single-origin artisanal blends hand-roasted in small batches by skilled roasters.',
    photo_url: 'https://www.gingerandwhite.com/cdn/shop/files/hot-chocolate.jpg?v=1692819145',
    items: [
      { id: 'c1', name: 'Flat White', photo_url: IMAGES.foodHotChoc, description: 'Velvety microfoam espresso. A classic house creation with rich tasting notes.', price: 4.00, is_special: true, dietary_tags: ['Signature'] },
      { id: 'c2', name: 'Cappuccino', photo_url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=600&q=80', description: 'Rich double espresso with thick, silky steamed milk foam dusted with cocoa.', price: 4.00, dietary_tags: ['House Blend'] },
      { id: 'c3', name: 'Cortado', photo_url: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80', description: 'Equal parts espresso and warm textured milk. Perfectly balanced flavor profile.', price: 3.80, dietary_tags: ['Espresso'] },
      { id: 'c4', name: 'Single Origin Cold Brew', photo_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80', description: 'Slow steeped for 18 hours. Exceptionally smooth, bright and refreshing.', price: 4.50, dietary_tags: ['Cold Brew'] },
      { id: 'c5', name: 'Spanish Latte', photo_url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80', description: 'Rich espresso layered with sweetened condensed milk and cinnamon aroma.', price: 5.25, is_special: true, dietary_tags: ['Popular'] },
      { id: 'c6', name: 'Vanilla Bean Affogato', photo_url: 'https://images.unsplash.com/photo-1594911772125-07fc7a2d8d9f?auto=format&fit=crop&w=600&q=80', description: 'Hot double espresso poured over a generous scoop of artisanal vanilla gelato.', price: 5.50, dietary_tags: ['Dessert Coffee'] },
    ],
  },
  cakes: {
    name: 'Cakes & Bakes',
    description:
      'Our cakes are freshly made by us every single morning in our kitchen. Nothing stays around for very long!',
    photo_url: 'https://www.gingerandwhite.com/cdn/shop/files/cake_9100f966-639e-427f-ae81-17f6708a0ecf.jpg?v=1692818921',
    items: [
      { id: 'b1', name: 'Banana Choc Chip Cake', photo_url: IMAGES.foodCake, description: 'A classic favorite. Moist, rich, and utterly irresistible sponge cake.', price: 4.50, is_special: true, dietary_tags: ['Bestseller'] },
      { id: 'b2', name: 'Cinnamon Bun', photo_url: IMAGES.foodBaked, description: 'Freshly baked, soft and sticky with warming cinnamon and cream glaze.', price: 4.00, dietary_tags: ['Fresh Daily'] },
      { id: 'b3', name: 'Almond Croissant', photo_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80', description: 'Buttery, flaky French croissant filled with rich almond cream.', price: 4.50, dietary_tags: ['French Bakery'] },
      { id: 'b4', name: 'Chunky Peanut Butter Cookie', photo_url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=80', description: 'Chunky homemade peanut butter cookie with sea salt flakes.', price: 3.00, dietary_tags: ['Handmade'] },
      { id: 'b5', name: 'Pistachio Rose Tres Leches', photo_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80', description: 'Cardamom milk soaked sponge with whipped cream and crushed pistachios.', price: 6.50, is_special: true, dietary_tags: ['Signature'] },
    ],
  },
  kids: {
    name: 'Kids Menu',
    description:
      'Kids are the joy of our cafe and we have created a special menu based on lots of experience!',
    photo_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1000&q=80',
    items: [
      { id: 'k1', name: 'Kids Dippy Eggs', photo_url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80', description: 'Free range dippy eggs with freshly baked sourdough toast soldiers.', price: 6.50, dietary_tags: ['Kids Favorite'] },
      { id: 'k2', name: 'Fish Finger Sandwich', photo_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80', description: 'Our famous kids fish finger sandwich on soft brioche with mayo.', price: 7.00, dietary_tags: ['Crispy'] },
      { id: 'k3', name: 'Mini Honey Porridge', photo_url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80', description: 'Creamy oat porridge with blossom honey and sliced banana.', price: 5.00, dietary_tags: ['Warm & Sweet'] },
      { id: 'k4', name: 'Kids Hot Chocolate', photo_url: IMAGES.foodHotChoc, description: 'Rich creamy hot chocolate topped with fluffy marshmallows.', price: 3.50, dietary_tags: ['Sweet Treat'] },
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
  } = useCart()

  const [category, setCategory] = useState(null)
  const [items, setItems] = useState([])
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

  useEffect(() => {
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
            const key = matchedCat.name.toLowerCase().includes('coffee')
              ? 'coffee'
              : matchedCat.name.toLowerCase().includes('cake')
                ? 'cakes'
                : matchedCat.name.toLowerCase().includes('kid')
                  ? 'kids'
                  : 'food'
            setItems(FALLBACK_CATEGORY_ITEMS[key]?.items || [])
          }
        } else {
          // Check static fallback data
          const fallbackKey = Object.keys(FALLBACK_CATEGORY_ITEMS).find(
            (k) => k === categoryId.toLowerCase() || FALLBACK_CATEGORY_ITEMS[k].name.toLowerCase().includes(categoryId.toLowerCase())
          ) || 'food'

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

      {/* HERO BANNER FOR CATEGORY */}
      <section className="relative min-h-[360px] md:min-h-[420px] flex flex-col items-center justify-center text-center px-6 overflow-hidden bg-green">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-black/55 backdrop-blur-[0.5px]" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-3 mb-2">
            <Link
              to={`/menu${tableNumber ? `?table=${tableNumber}` : ''}`}
              className="inline-flex items-center space-x-2 text-white/80 hover:text-white text-xs font-sans uppercase font-bold tracking-widest transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to All Menus</span>
            </Link>

            {tableNumber ? (
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-[11px] font-bold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                <span>Serving Table #{tableNumber}</span>
              </div>
            ) : (
              <></>
            )}
          </div>

          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight drop-shadow-md">
            {category?.name || 'Menu Listing'}
          </h1>
          <p className="font-sans font-light text-white/90 text-sm md:text-base leading-relaxed max-w-xl mx-auto drop-shadow">
            {category?.description ||
              'Our handcrafted artisanal selection made fresh every morning with organic and locally sourced ingredients.'}
          </p>
        </div>
      </section>

      {/* ITEMS LISTING GRID */}
      <section className="max-w-6xl mx-auto px-6 py-16 sm:py-20">

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 pb-4 border-b border-[#E8E2D9]">
          <div>
            <h2 className="font-serif text-3xl font-medium text-[#1C1C1C]">
              {category?.name} Offerings
            </h2>
            <p className="font-sans font-light text-muted text-xs sm:text-sm mt-0.5">
              {tableNumber
                ? `Freshly prepared to order for Table #${tableNumber}.`
                : 'Freshly prepared for pickup or delivery.'}
            </p>
          </div>
          <span className="text-xs font-sans font-bold uppercase tracking-wider text-green bg-white px-3 py-1.5 rounded-full border border-border">
            {items.length} Items Available
          </span>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 text-muted">
            <Loader2 className="w-8 h-8 animate-spin text-green" />
            <p className="text-xs font-sans font-medium">Loading freshly brewed menu items...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => {
              const displayImage =
                item.photo_url ||
                item.img ||
                'https://www.gingerandwhite.com/cdn/shop/files/eggs-sourdough.jpg?v=1692816641'
              const formattedPrice =
                typeof item.price === 'number' ? `$${item.price.toFixed(2)}` : String(item.price || '$0.00')

              // Check if item is already in cart
              const cartItem = cart.find((c) => c.id === item.id)

              return (
                <div
                  key={item.id || item.name}
                  className="bg-white rounded-xl overflow-hidden border border-[#E8E2D9] hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    {/* Item Image with Badges */}
                    <div className="relative w-full h-48 bg-[#FAF8F4] overflow-hidden">
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
                        <div className="flex flex-wrap gap-1">
                          {item.dietary_tags &&
                            item.dietary_tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] font-bold bg-white/95 backdrop-blur-sm text-green border border-border px-2 py-0.5 rounded-md shadow-sm"
                              >
                                {tag}
                              </span>
                            ))}
                        </div>

                        {item.is_special && (
                          <span className="bg-green text-white font-sans text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow shrink-0">
                            Special ⭐
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Item Details */}
                    <div className="p-5">
                      <h3 className="font-serif text-lg font-medium mb-1.5 text-[#1C1C1C]">
                        {item.name}
                      </h3>
                      <p className="font-sans font-light text-xs text-muted leading-relaxed">
                        {item.description || item.desc || 'Handcrafted daily with artisanal ingredients.'}
                      </p>
                    </div>
                  </div>

                  {/* Price & Add to Order Stepper */}
                  <div className="p-5 pt-0 flex items-center justify-between border-t border-[#F0EBE1] mt-2 pt-3">
                    <div>
                      <span className="text-[10px] text-muted font-bold block uppercase tracking-wider">
                        Price
                      </span>
                      <p className="font-sans font-bold text-base text-green">{formattedPrice}</p>
                    </div>

                    {cartItem ? (
                      <div className="flex items-center space-x-2 bg-cream p-1 rounded-xl border border-border shadow-sm">
                        <button
                          onClick={() => updateQuantity(cartItem.cartKey, -1)}
                          className="w-7 h-7 rounded-lg bg-white hover:bg-border flex items-center justify-center font-bold text-xs text-[#1C1C1C] transition-colors active:scale-95"
                          title="Reduce quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-bold text-xs px-1 text-green min-w-[16px] text-center">
                          {cartItem.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(cartItem.cartKey, 1)}
                          className="w-7 h-7 rounded-lg bg-white hover:bg-border flex items-center justify-center font-bold text-xs text-[#1C1C1C] transition-colors active:scale-95"
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
                        className="bg-[#1C1C1C] hover:bg-green text-white font-sans text-xs font-bold px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
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

    </div>
  )
}

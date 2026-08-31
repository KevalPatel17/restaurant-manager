import React, { useState, useCallback } from 'react'
import { Plus, X, ShoppingBag, RotateCcw, ChevronUp } from 'lucide-react'
import { useCart } from '../context/CartContext'
import toast from 'react-hot-toast'

// ─── 6 SIGNATURE COOKIE FLAVORS MATCHING SCREENSHOT ───
const FLAVORS = [
  {
    id: 'milk-chocolate',
    name: 'MILK CHOCOLATE',
    shortName: 'Milk Chocolate',
    desc: 'Classic milk chocolate chunks in golden dough',
    side: 'left',
    type: 'milk',
  },
  {
    id: 'double-chocolate',
    name: 'DOUBLE CHOCOLATE',
    shortName: 'Double Chocolate',
    desc: 'Rich cocoa dough with dark & milk chunks',
    side: 'left',
    type: 'double',
  },
  {
    id: 'choc-nut',
    name: 'CHOCOLATE & NUT',
    shortName: 'Chocolate & Nut',
    desc: 'Studded with roasted walnuts & chocolate',
    side: 'left',
    type: 'nut',
  },
  {
    id: 'dark-sea-salt',
    name: 'DARK CHOCOLATE & SEA SALT',
    shortName: 'Dark Choc & Sea Salt',
    desc: 'Dark chunks with flaky Cornish sea salt',
    side: 'right',
    type: 'dark',
  },
  {
    id: 'matcha',
    name: 'MATCHA',
    shortName: 'Matcha White Choc',
    desc: 'Stone-ground matcha with creamy white chocolate',
    side: 'right',
    type: 'matcha',
  },
  {
    id: 'biscoff',
    name: 'BISCOFF',
    shortName: 'Biscoff Caramel',
    desc: 'Spiced caramel dough with Lotus Biscoff chunks',
    side: 'right',
    type: 'biscoff',
  },
]

const BOX_PRICE = '₹450'
const BOX_PRICE_NUM = 450
const MAX_SLOTS = 6

// ─── REALISTIC VECTOR COOKIE ILLUSTRATION COMPONENT (COMPACT SIZES) ───
function CookieIllustration({ type, size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-12 h-12 sm:w-14 sm:h-14',
    md: 'w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-22 lg:h-22',
    lg: 'w-18 h-18 sm:w-20 sm:h-20 md:w-24 md:h-24',
    box: 'w-full h-full',
  }[size]

  if (type === 'milk') {
    return (
      <div
        className={`rounded-full relative select-none overflow-hidden border border-black/10 ${sizeClasses} ${className}`}
        style={{
          background: 'radial-gradient(circle at 38% 35%, #E8B67D 0%, #D49D60 65%, #B77F42 100%)',
          boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.25)',
        }}
      >
        {/* Chunks */}
        <div className="absolute top-[26%] left-[30%] w-[18%] h-[18%] rounded-xs bg-[#5C3214] rotate-12 shadow-xs" />
        <div className="absolute top-[48%] left-[22%] w-[16%] h-[16%] rounded-xs bg-[#6B3E1C] -rotate-6 shadow-xs" />
        <div className="absolute top-[28%] right-[25%] w-[19%] h-[17%] rounded-xs bg-[#4A260D] rotate-45 shadow-xs" />
        <div className="absolute top-[52%] right-[28%] w-[17%] h-[17%] rounded-xs bg-[#5C3214] -rotate-12 shadow-xs" />
        <div className="absolute bottom-[20%] left-[42%] w-[16%] h-[16%] rounded-xs bg-[#784620] rotate-6 shadow-xs" />
        <div className="absolute top-[18%] left-[50%] w-[12%] h-[12%] rounded-xs bg-[#4A260D] rotate-12" />
        <div className="absolute bottom-[32%] right-[22%] w-[12%] h-[12%] rounded-xs bg-[#6B3E1C] -rotate-45" />
      </div>
    )
  }

  if (type === 'double') {
    return (
      <div
        className={`rounded-full relative select-none overflow-hidden border border-black/20 ${sizeClasses} ${className}`}
        style={{
          background: 'radial-gradient(circle at 38% 35%, #4E2C1D 0%, #3B1F13 65%, #241109 100%)',
          boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.1)',
        }}
      >
        {/* Chunks */}
        <div className="absolute top-[24%] left-[28%] w-[18%] h-[18%] rounded-xs bg-[#8C5E45] rotate-12 shadow-xs" />
        <div className="absolute top-[48%] left-[24%] w-[17%] h-[17%] rounded-xs bg-[#221008] -rotate-12 shadow-xs" />
        <div className="absolute top-[28%] right-[24%] w-[19%] h-[18%] rounded-xs bg-[#9E6E52] rotate-45 shadow-xs" />
        <div className="absolute top-[54%] right-[26%] w-[16%] h-[16%] rounded-xs bg-[#7E5038] -rotate-6 shadow-xs" />
        <div className="absolute bottom-[22%] left-[44%] w-[18%] h-[18%] rounded-xs bg-[#8C5E45] rotate-12 shadow-xs" />
        <div className="absolute top-[18%] left-[48%] w-[12%] h-[12%] rounded-xs bg-[#221008] rotate-6" />
      </div>
    )
  }

  if (type === 'nut') {
    return (
      <div
        className={`rounded-full relative select-none overflow-hidden border border-black/10 ${sizeClasses} ${className}`}
        style={{
          background: 'radial-gradient(circle at 38% 35%, #DDA367 0%, #C48A4E 65%, #A56D33 100%)',
          boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.25)',
        }}
      >
        {/* Walnuts & Chocs */}
        <div className="absolute top-[25%] left-[28%] w-[18%] h-[16%] rounded-full bg-[#E5C193] rotate-12 shadow-xs" />
        <div className="absolute top-[48%] left-[22%] w-[18%] h-[18%] rounded-xs bg-[#4A260D] -rotate-6 shadow-xs" />
        <div className="absolute top-[26%] right-[26%] w-[17%] h-[17%] rounded-xs bg-[#5C3214] rotate-45 shadow-xs" />
        <div className="absolute top-[52%] right-[25%] w-[20%] h-[18%] rounded-full bg-[#DEB481] -rotate-12 shadow-xs" />
        <div className="absolute bottom-[22%] left-[42%] w-[17%] h-[17%] rounded-xs bg-[#4A260D] rotate-6 shadow-xs" />
        <div className="absolute top-[18%] left-[48%] w-[13%] h-[13%] rounded-full bg-[#E5C193] rotate-45" />
      </div>
    )
  }

  if (type === 'dark') {
    return (
      <div
        className={`rounded-full relative select-none overflow-hidden border border-black/30 ${sizeClasses} ${className}`}
        style={{
          background: 'radial-gradient(circle at 38% 35%, #382015 0%, #26130A 65%, #150904 100%)',
          boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.1)',
        }}
      >
        {/* Dark chunks & Sea Salt Flakes */}
        <div className="absolute top-[26%] left-[30%] w-[17%] h-[17%] rounded-xs bg-[#120703] rotate-12 shadow-xs" />
        <div className="absolute top-[50%] left-[24%] w-[18%] h-[18%] rounded-xs bg-[#120703] -rotate-6 shadow-xs" />
        <div className="absolute top-[28%] right-[25%] w-[16%] h-[16%] rounded-xs bg-[#120703] rotate-45 shadow-xs" />
        <div className="absolute top-[54%] right-[28%] w-[17%] h-[17%] rounded-xs bg-[#120703] -rotate-12 shadow-xs" />
        {/* Flaky Salt crystals */}
        <div className="absolute top-[32%] left-[42%] w-1.5 h-0.5 bg-white/95 rounded-2xs rotate-45" />
        <div className="absolute bottom-[35%] right-[38%] w-1.5 h-1 bg-white/95 rounded-2xs -rotate-12" />
        <div className="absolute bottom-[24%] left-[32%] w-1 h-1 bg-white/90 rounded-2xs rotate-12" />
        <div className="absolute top-[22%] right-[32%] w-1.5 h-0.5 bg-white/90 rounded-2xs -rotate-45" />
      </div>
    )
  }

  if (type === 'matcha') {
    return (
      <div
        className={`rounded-full relative select-none overflow-hidden border border-black/10 ${sizeClasses} ${className}`}
        style={{
          background: 'radial-gradient(circle at 38% 35%, #88A664 0%, #6E8C4A 65%, #526C33 100%)',
          boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.25)',
        }}
      >
        {/* White Chocolate chunks */}
        <div className="absolute top-[28%] left-[28%] w-[19%] h-[19%] rounded-xs bg-[#F7F2E7] rotate-12 shadow-xs" />
        <div className="absolute top-[50%] left-[25%] w-[18%] h-[18%] rounded-xs bg-[#EDE4D0] -rotate-6 shadow-xs" />
        <div className="absolute top-[26%] right-[26%] w-[17%] h-[17%] rounded-xs bg-[#FAF6EE] rotate-45 shadow-xs" />
        <div className="absolute top-[52%] right-[28%] w-[18%] h-[18%] rounded-xs bg-[#EDE4D0] -rotate-12 shadow-xs" />
        <div className="absolute bottom-[22%] left-[44%] w-[16%] h-[16%] rounded-xs bg-[#F7F2E7] rotate-6 shadow-xs" />
      </div>
    )
  }

  // Biscoff
  return (
    <div
      className={`rounded-full relative select-none overflow-hidden border border-black/10 ${sizeClasses} ${className}`}
      style={{
        background: 'radial-gradient(circle at 38% 35%, #CC844D 0%, #B56E36 65%, #965320 100%)',
        boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.25)',
      }}
    >
      {/* Caramel Chunks */}
      <div className="absolute top-[26%] left-[30%] w-[17%] h-[17%] rounded-xs bg-[#6B3710] rotate-12 shadow-xs" />
      <div className="absolute top-[50%] left-[24%] w-[18%] h-[18%] rounded-xs bg-[#542808] -rotate-6 shadow-xs" />
      <div className="absolute top-[28%] right-[26%] w-[16%] h-[16%] rounded-xs bg-[#783F14] rotate-45 shadow-xs" />
      <div className="absolute top-[54%] right-[28%] w-[17%] h-[17%] rounded-xs bg-[#542808] -rotate-12 shadow-xs" />
      <div className="absolute bottom-[22%] left-[44%] w-[18%] h-[18%] rounded-xs bg-[#6B3710] rotate-6 shadow-xs" />
    </div>
  )
}

export default function Cookies() {
  const { addToCart, setIsCartOpen } = useCart()

  // 6 box slots: holds flavor id or null
  const [slots, setSlots] = useState([null, null, null, null, null, null])
  const [justAddedIndex, setJustAddedIndex] = useState(null)
  const [hoveredSlot, setHoveredSlot] = useState(null)

  const filledCount = slots.filter((s) => s !== null).length
  const isComplete = filledCount === MAX_SLOTS

  // Add a cookie to next available empty slot
  const addToNextEmpty = useCallback((flavorId) => {
    setSlots((prev) => {
      const next = [...prev]
      const idx = next.indexOf(null)
      if (idx !== -1) {
        next[idx] = flavorId
        setJustAddedIndex(idx)
        setTimeout(() => setJustAddedIndex(null), 500)
      } else {
        toast('Your box is full! (6/6)', { icon: '🍪' })
      }
      return next
    })
  }, [])

  // Remove cookie from a slot
  const removeFromSlot = (index) => {
    setSlots((prev) => {
      const next = [...prev]
      next[index] = null
      return next
    })
  }

  // Clear entire box
  const handleClearBox = () => {
    setSlots([null, null, null, null, null, null])
    toast.success('Box cleared')
  }

  // Drag & drop handlers
  const handleDragStart = (e, flavorId) => {
    e.dataTransfer.setData('text/plain', flavorId)
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleSlotDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setHoveredSlot(index)
  }

  const handleSlotDragLeave = () => {
    setHoveredSlot(null)
  }

  const handleSlotDrop = (e, index) => {
    e.preventDefault()
    const flavorId = e.dataTransfer.getData('text/plain')
    if (flavorId) {
      setSlots((prev) => {
        const next = [...prev]
        next[index] = flavorId
        setJustAddedIndex(index)
        setTimeout(() => setJustAddedIndex(null), 500)
        return next
      })
    }
    setHoveredSlot(null)
  }

  // Add finished box to cart
  const handleAddBoxToCart = () => {
    if (!isComplete) {
      toast.error(`Please pick ${MAX_SLOTS - filledCount} more cookie${MAX_SLOTS - filledCount > 1 ? 's' : ''} to complete your box`)
      return
    }

    const customizationList = slots
      .map((id) => FLAVORS.find((f) => f.id === id)?.shortName || id)
      .join(', ')

    addToCart({
      id: `cookie-box-${Date.now()}`,
      name: 'Musafir Cafe Artisan 6-Cookie Box',
      price: BOX_PRICE_NUM,
      photo_url: 'https://images.pexels.com/photos/31323236/pexels-photo-31323236.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      category: 'Artisan Cookies',
      quantity: 1,
      item_customization: customizationList,
    })

    setIsCartOpen(true)
    toast.success('Your custom 6-Cookie Box was added to cart! 🍪')
  }

  const leftFlavors = FLAVORS.filter((f) => f.side === 'left')
  const rightFlavors = FLAVORS.filter((f) => f.side === 'right')

  return (
    <div className="min-h-screen bg-[#FAF6EE] text-[#2A1D13] font-sans pb-24 pt-4 sm:pt-6 px-3 sm:px-6 select-none">
      
      {/* ─── 1. HEADER SECTION (COMPACT & SLEEK) ─── */}
      <div className="text-center space-y-0.5 max-w-xl mx-auto mb-4 sm:mb-6">
        <p className="text-[9px] sm:text-[10px] font-sans tracking-[0.25em] text-[#8C7662] uppercase font-bold">
          BUILD YOUR OWN
        </p>
        <h1 className="font-serif text-2xl sm:text-3xl md:text-3.5xl font-bold tracking-tight text-[#2D1B0E] uppercase">
          BUILD YOUR COOKIE BOX
        </h1>
        <p className="font-sans text-[11px] sm:text-xs font-semibold tracking-widest text-[#7C6652] pt-0.5">
          <span className="text-[#2D1B0E] font-bold text-sm">{filledCount}</span> OF {MAX_SLOTS}
        </p>
      </div>

      {/* ─── 2. MAIN 3-COLUMN STAGING AREA ─── */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-center">
        
        {/* ─── LEFT COLUMN: 3 FLAVORS ON DESKTOP, OR ALL 6 UNIFIED ON MOBILE (lg:col-span-3) ─── */}
        <div className="hidden lg:flex lg:col-span-3 flex-col justify-center items-center gap-6 order-1">
          {leftFlavors.map((flavor) => (
            <div
              key={flavor.id}
              className="flex flex-col items-center text-center space-y-1 group"
            >
              <div
                draggable="true"
                onDragStart={(e) => handleDragStart(e, flavor.id)}
                className="transition-transform duration-300 group-hover:scale-105 active:scale-95 cursor-grab active:cursor-grabbing"
              >
                <CookieIllustration type={flavor.type} size="md" />
              </div>

              <span className="font-sans text-[10.5px] font-extrabold tracking-wider text-[#2D1B0E] max-w-[110px] leading-tight select-none">
                {flavor.name}
              </span>

              <button
                onClick={() => addToNextEmpty(flavor.id)}
                className="w-6 h-6 rounded-full bg-[#EDE4D5] hover:bg-[#DBCDB8] text-[#5A4533] border border-[#D5C6B0] flex items-center justify-center text-xs font-bold shadow-2xs active:scale-90 transition-all cursor-pointer"
                title={`Add ${flavor.shortName}`}
              >
                +
              </button>
            </div>
          ))}
        </div>

        {/* ─── CENTER COLUMN: KRAFT COOKIE BOX (lg:col-span-6) ─── */}
        <div className="lg:col-span-6 flex flex-col items-center order-1 lg:order-2 w-full max-w-lg mx-auto">
          
          {/* Top Angled Flap Lid */}
          <div
            className="w-[90%] sm:w-[92%] bg-[#B5824C] border border-[#9E6D38] rounded-t-lg py-2 sm:py-3.5 px-3 text-center shadow-xs relative"
            style={{
              clipPath: 'polygon(4% 0%, 96% 0%, 100% 100%, 0% 100%)',
              background: 'linear-gradient(to bottom, #BA8852, #A8743E)',
            }}
          >
            <h2 className="font-serif font-bold text-xs sm:text-sm tracking-[0.2em] text-[#331C0C] uppercase">
              MUSAFIR CAFE
            </h2>
            <p className="text-[7.5px] sm:text-[8.5px] tracking-[0.25em] text-[#4A2D1A] uppercase font-bold mt-0.5">
              ARTISAN BAKERY · ROASTERS
            </p>
          </div>

          {/* Main Cardboard Box Tray */}
          <div className="w-full bg-[#B5824C] border-2 sm:border-3 border-[#9E6D38] rounded-xl p-2.5 sm:p-3.5 shadow-xl relative">
            
            {/* Scalloped / Serrated Zig-zag Paper Liner */}
            <div className="bg-[#EFE7D8] border border-[#DDD2BE] rounded-lg p-2 sm:p-4 shadow-inner relative overflow-hidden">
              
              {/* Top and Bottom Zig-zag Edge Texture Accents */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5 bg-[#B5824C]"
                style={{
                  clipPath: 'polygon(0 0, 5% 100%, 10% 0, 15% 100%, 20% 0, 25% 100%, 30% 0, 35% 100%, 40% 0, 45% 100%, 50% 0, 55% 100%, 60% 0, 65% 100%, 70% 0, 75% 100%, 80% 0, 85% 100%, 90% 0, 95% 100%, 100% 0)',
                }}
              />
              <div
                className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#B5824C]"
                style={{
                  clipPath: 'polygon(0 100%, 5% 0, 10% 100%, 15% 0, 20% 100%, 25% 0, 30% 100%, 35% 0, 40% 100%, 45% 0, 50% 100%, 55% 0, 60% 100%, 65% 0, 70% 100%, 75% 0, 80% 100%, 85% 0, 90% 100%, 95% 0, 100% 100%)',
                }}
              />

              {/* 6 Circular Slots: 2 Rows x 3 Columns */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3.5 my-1 sm:my-2">
                {slots.map((flavorId, idx) => {
                  const flavor = flavorId ? FLAVORS.find((f) => f.id === flavorId) : null
                  const isHovered = hoveredSlot === idx
                  const isJustAdded = justAddedIndex === idx

                  return (
                    <div
                      key={idx}
                      onClick={() => flavorId && removeFromSlot(idx)}
                      onDragOver={(e) => handleSlotDragOver(e, idx)}
                      onDragLeave={handleSlotDragLeave}
                      onDrop={(e) => handleSlotDrop(e, idx)}
                      className={`aspect-square rounded-full flex flex-col items-center justify-center relative cursor-pointer transition-all duration-300 select-none ${
                        flavorId
                          ? 'shadow-xs hover:scale-95'
                          : 'bg-[#E5DCCB]/60 border border-dashed border-[#C5B59E]'
                      } ${isHovered ? 'scale-105 ring-1.5 ring-[#B5824C]' : ''} ${
                        isJustAdded ? 'scale-105' : ''
                      }`}
                    >
                      {flavor ? (
                        <div className="w-full h-full p-0.5 relative group flex items-center justify-center">
                          <CookieIllustration type={flavor.type} size="box" />
                          
                          {/* Hover Remove Tag */}
                          <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-white text-[9px] sm:text-[10px] font-bold bg-[#A83232] px-1.5 py-0.5 rounded-full shadow">
                              Remove ×
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center p-0.5 opacity-60 hover:opacity-100 transition-opacity">
                          <span className="text-[#8C7662] text-xs sm:text-sm font-bold block leading-none">
                            +
                          </span>
                          <span className="text-[6.5px] sm:text-[8px] font-sans font-bold uppercase tracking-wider text-[#8C7662] block mt-0.5 leading-none">
                            TAP OR DROP<br />COOKIE
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

            </div>

            {/* Bottom Cardboard Edge Brand Label */}
            <div className="pt-1 text-center">
              <span className="text-[8px] sm:text-[9px] font-serif font-bold tracking-[0.2em] text-[#4A2D1A] uppercase">
                MUSAFIR CAFE
              </span>
            </div>

          </div>

          {/* ─── 3. CART CHECKOUT BAR DIRECTLY BELOW COOKIE BOX ─── */}
          <div className="w-full mt-3 bg-[#2D1B0E] rounded-xl p-2.5 sm:p-3 shadow-lg border border-[#4A2D1A] flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3">
            {/* Progress Indicators */}
            <div className="flex items-center space-x-2.5">
              <div className="flex items-center space-x-1">
                {slots.map((s, idx) => (
                  <div
                    key={idx}
                    className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
                      s ? 'bg-[#D29F68]' : 'bg-[#4A2D1A]'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[11px] sm:text-xs text-white/80 font-medium">
                <strong className="text-white font-bold">{filledCount}</strong> of {MAX_SLOTS} chosen
              </span>
            </div>

            {/* Price & Add to Cart Button */}
            <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
              <span className="font-serif text-white font-bold text-sm sm:text-base">
                {BOX_PRICE}
              </span>

              {isComplete ? (
                <button
                  onClick={handleAddBoxToCart}
                  className="py-2 px-4 sm:px-5 rounded-lg bg-[#C8612E] hover:bg-[#A04E22] text-white font-bold text-[11px] uppercase tracking-wider shadow-md flex items-center space-x-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Add Box to Cart</span>
                </button>
              ) : (
                <button
                  onClick={handleAddBoxToCart}
                  className="py-2 px-3.5 sm:px-4 rounded-lg bg-[#4A2D1A] text-white/50 font-bold text-[10.5px] uppercase tracking-wider cursor-not-allowed"
                >
                  <span>Pick {MAX_SLOTS - filledCount} More</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Clear / Reset Action */}
          {filledCount > 0 && (
            <button
              onClick={handleClearBox}
              className="mt-2 text-[11px] font-bold text-[#8C7662] hover:text-[#2D1B0E] flex items-center space-x-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear Box</span>
            </button>
          )}

        </div>

        {/* ─── RIGHT COLUMN ON DESKTOP (lg:col-span-3) ─── */}
        <div className="hidden lg:flex lg:col-span-3 flex-col justify-center items-center gap-6 order-3">
          {rightFlavors.map((flavor) => (
            <div
              key={flavor.id}
              className="flex flex-col items-center text-center space-y-1 group"
            >
              <div
                draggable="true"
                onDragStart={(e) => handleDragStart(e, flavor.id)}
                className="transition-transform duration-300 group-hover:scale-105 active:scale-95 cursor-grab active:cursor-grabbing"
              >
                <CookieIllustration type={flavor.type} size="md" />
              </div>

              <span className="font-sans text-[10.5px] font-extrabold tracking-wider text-[#2D1B0E] max-w-[110px] leading-tight select-none">
                {flavor.name}
              </span>

              <button
                onClick={() => addToNextEmpty(flavor.id)}
                className="w-6 h-6 rounded-full bg-[#EDE4D5] hover:bg-[#DBCDB8] text-[#5A4533] border border-[#D5C6B0] flex items-center justify-center text-xs font-bold shadow-2xs active:scale-90 transition-all cursor-pointer"
                title={`Add ${flavor.shortName}`}
              >
                +
              </button>
            </div>
          ))}
        </div>

        {/* ─── MOBILE & TABLET UNIFIED 6-COOKIE FLAVOR SELECTOR (lg:hidden) ─── */}
        <div className="lg:hidden col-span-1 order-2 mt-4 w-full max-w-lg mx-auto">
          <div className="text-center mb-3">
            <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#8C7662]">
              Tap Any Flavor Below To Add (+):
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 xs:gap-4 sm:gap-6 justify-items-center">
            {FLAVORS.map((flavor) => (
              <div
                key={flavor.id}
                onClick={() => addToNextEmpty(flavor.id)}
                className="flex flex-col items-center text-center space-y-1 p-2 rounded-2xl bg-white/60 border border-[#E8E2D9] shadow-2xs active:scale-95 transition-all cursor-pointer w-full max-w-[120px]"
              >
                <CookieIllustration type={flavor.type} size="sm" />
                <span className="font-sans text-[9px] xs:text-[10px] font-bold tracking-tight text-[#2D1B0E] leading-tight line-clamp-2">
                  {flavor.shortName}
                </span>
                <span className="text-[9px] font-bold text-[#C8612E] bg-[#FFF2EA] px-2 py-0.5 rounded-full">
                  + Add
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Floating Scroll to Top Pill */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-4 sm:right-6 w-8 h-8 rounded-full bg-white text-[#2D1B0E] border border-[#DDD2BE] shadow-md flex items-center justify-center hover:bg-[#FAF6EE] transition-all z-30"
        title="Scroll to top"
      >
        <ChevronUp className="w-3.5 h-3.5" />
      </button>

    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  FiZoomIn,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiArrowRight,
} from 'react-icons/fi'
import { Sparkles, Coffee, Heart, Gift } from 'lucide-react'
import Reveal from '../components/Reveal'
import { useCart } from '../context/CartContext'
import galleryBg from '../assets/new-img/gallrybg.png'

// Import all locally downloaded high-resolution gallery images from src/assets/food
import img1 from '../assets/food/gallery-1.jpg'
import img2 from '../assets/food/gallery-2.jpg'
import img3 from '../assets/food/gallery-3.jpg'
import img4 from '../assets/food/gallery-4.jpg'
import img6 from '../assets/food/gallery-6.jpg'
import img7 from '../assets/food/gallery-7.jpg'
import img8 from '../assets/food/gallery-8.jpg'
import img9 from '../assets/food/gallery-9.jpg'
import img10 from '../assets/food/gallery-10.jpg'
import img11 from '../assets/food/gallery-11.jpg'
import img12 from '../assets/food/gallery-12.jpg'
import img13 from '../assets/food/gallery-13.jpg'
import img14 from '../assets/food/gallery-14.jpg'
import img15 from '../assets/food/gallery-15.jpg'
import img16 from '../assets/food/gallery-16.jpg'
import img17 from '../assets/food/gallery-17.jpg'
import img18 from '../assets/food/gallery-18.jpg'
import img19 from '../assets/food/gallery-19.jpg'
import img20 from '../assets/food/gallery-20.jpg'
import img21 from '../assets/food/gallery-21.jpg'
import img22 from '../assets/food/gallery-22.jpg'
import img23 from '../assets/food/gallery-23.jpg'
import img24 from '../assets/food/gallery-24.jpg'

// Complete collection of locally stored gallery images
export const GALLERY_IMAGES = [
  {
    id: 1,
    src: img1,
    title: 'Mexican Burrito Rice Bowl with Grilled Paneer',
    category: 'food',
    tag: 'Mexican Bowl',
  },
  {
    id: 2,
    src: img2,
    title: 'Classic Cold Coffee Frappe with Cocoa Dusting',
    category: 'coffee',
    tag: 'Iced Coffee',
  },
  {
    id: 3,
    src: img3,
    title: 'Chili Guava Rosemary Spiced Mocktail',
    category: 'beverage',
    tag: 'Specialty Mocktail',
  },
  {
    id: 4,
    src: img4,
    title: 'Chilled Iced Americano on the Rocks',
    category: 'coffee',
    tag: 'Cold Brew & Coffee',
  },
  {
    id: 6,
    src: img6,
    title: 'Wood-Fired Veggie Supreme Artisan Pizza',
    category: 'food',
    tag: 'Artisan Pizza',
  },
  {
    id: 7,
    src: img7,
    title: 'Mexican Volcano Rice Bowl with Microgreens',
    category: 'food',
    tag: 'Chef Specials',
  },
  {
    id: 8,
    src: img8,
    title: 'Cranberry Cold Brew Espresso Fusion',
    category: 'coffee',
    tag: 'Cold Brew & Coffee',
  },
  {
    id: 9,
    src: img9,
    title: 'Iced Espresso Martini Mocktail',
    category: 'coffee',
    tag: 'Specialty Coffee',
  },
  {
    id: 10,
    src: img10,
    title: 'Layered Caramel Iced Latte in Highball Glass',
    category: 'coffee',
    tag: 'Iced Coffee',
  },
  {
    id: 11,
    src: img11,
    title: 'Vietnamese Style Iced Coffee',
    category: 'coffee',
    tag: 'Iced Coffee',
  },
  {
    id: 12,
    src: img12,
    title: 'Crispy Veggie Cheese Burger with Golden Fries',
    category: 'food',
    tag: 'Burgers & Fries',
  },
  {
    id: 13,
    src: img13,
    title: 'Grilled Club Sandwich with Peri Peri Fries',
    category: 'food',
    tag: 'Gourmet Sandwich',
  },
  {
    id: 14,
    src: img14,
    title: 'Surati Spiced Pav Bhaji with Toasted Butter Pav',
    category: 'food',
    tag: 'Local Delights',
  },
  {
    id: 15,
    src: img15,
    title: 'Hot Cappuccino with Tulip Latte Art',
    category: 'coffee',
    tag: 'Hot Brews',
  },
  {
    id: 16,
    src: img16,
    title: 'Layered Citrus Cold Brew with Orange Slice',
    category: 'coffee',
    tag: 'Cold Brew & Coffee',
  },
  {
    id: 17,
    src: img17,
    title: 'Arrabbiata Red Sauce Pasta with Garlic Bread',
    category: 'food',
    tag: 'Italian Pasta',
  },
  {
    id: 18,
    src: img18,
    title: 'Alfredo White Sauce Penne with Herb Toast',
    category: 'food',
    tag: 'Italian Pasta',
  },
  {
    id: 19,
    src: img19,
    title: 'Crispy Peri Peri French Fries Platter',
    category: 'food',
    tag: 'Starters',
  },
  {
    id: 20,
    src: img20,
    title: 'Pesto Margherita Sourdough Pizza',
    category: 'food',
    tag: 'Artisan Pizza',
  },
  {
    id: 21,
    src: img21,
    title: 'Iced Vanilla Sweet Cream Latte',
    category: 'coffee',
    tag: 'Iced Coffee',
  },
  {
    id: 22,
    src: img22,
    title: 'Cheesy Garlic Bread Baguette Slices (4 Pcs)',
    category: 'food',
    tag: 'Starters',
  },
  {
    id: 23,
    src: img23,
    title: 'Wild Berry Mint Smoothie with Blackberries',
    category: 'beverage',
    tag: 'Healthy Shakes',
  },
  {
    id: 24,
    src: img24,
    title: 'Irish Cream Cold Coffee on the Rocks',
    category: 'coffee',
    tag: 'Specialty Coffee',
  },
]

const FILTER_CATEGORIES = [
  { key: 'all', label: 'All Dishes & Drinks' },
  { key: 'food', label: '🍕 Food & Mains' },
  { key: 'coffee', label: '☕ Coffee & Brews' },
  { key: 'beverage', label: '🍹 Mocktails & Smoothies' },
]

function Gallery() {
  const [activeFilter, setActiveFilter] = useState('all')
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const { customerSession, setIsRewardModalOpen } = useCart()

  // Filtered images
  const filteredImages =
    activeFilter === 'all'
      ? GALLERY_IMAGES
      : GALLERY_IMAGES.filter((img) => img.category === activeFilter)

  // Lightbox keyboard navigation
  const handlePrev = useCallback(() => {
    if (lightboxIndex === null) return
    setLightboxIndex((prev) => (prev > 0 ? prev - 1 : filteredImages.length - 1))
  }, [lightboxIndex, filteredImages.length])

  const handleNext = useCallback(() => {
    if (lightboxIndex === null) return
    setLightboxIndex((prev) => (prev < filteredImages.length - 1 ? prev + 1 : 0))
  }, [lightboxIndex, filteredImages.length])

  const handleKeyDown = useCallback(
    (e) => {
      if (lightboxIndex === null) return
      if (e.key === 'Escape') setLightboxIndex(null)
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 'ArrowRight') handleNext()
    },
    [lightboxIndex, handlePrev, handleNext]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="bg-[#FAF8F4] min-h-screen">

      {/* ─── 1. HERO SECTION WITH HARDWARE-ACCELERATED STICKY PARALLAX (Works on Mobile & Desktop) ─── */}
      <section className="parallax-window py-16 sm:py-24 px-4 flex items-center justify-center text-center bg-[#1A281E]">
        <div className="parallax-fixed-layer">
          <img
            src={galleryBg}
            alt="Gallery Background"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/35 pointer-events-none" />
        </div>
        {/* Floating Loyalty Pill Badge in Hero Top-Left (Mobile Responsive) */}
        {customerSession.isIdentified ? (
          <div className="absolute top-3 left-3 sm:top-5 sm:left-5 z-20 animate-fade-in max-w-[calc(100vw-24px)]">
            <div className="inline-flex items-center space-x-1.5 sm:space-x-2 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white">
              <span className="text-[10px] sm:text-[11px] font-light text-white/90 truncate max-w-[90px] sm:max-w-[130px]">
                Welcome, <strong className="font-semibold text-white">{customerSession.name}</strong>
              </span>
              <span className="text-white/30 hidden xs:inline">•</span>
              <span className="text-[10px] sm:text-[11px] text-[#E0A96D] font-bold whitespace-nowrap">
                ⭐ {customerSession.travel_tokens}
              </span>
              {customerSession.travel_tokens > 0 && (
                <button
                  onClick={() => setIsRewardModalOpen(true)}
                  className="ml-1 px-2 py-0.5 rounded-full bg-[#E0A96D] hover:bg-[#c99256] text-[#1C1C1C] text-[9px] font-bold uppercase tracking-wider transition-transform active:scale-95 cursor-pointer whitespace-nowrap flex items-center space-x-1"
                >
                  <Gift className="w-2.5 h-2.5" />
                  <span>Redeem</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <></>
        )}

        <div className="max-w-md sm:max-w-lg md:max-w-xl mx-auto space-y-3 sm:space-y-3.5 z-10">
          <span className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#E0A96D] text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Visual Story &amp; Ambiance</span>
          </span>

          <h1 className="animate-hero font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
            Our Gallery
          </h1>

          <div className="flex items-center justify-center space-x-2.5 text-white/70 text-sm font-light">
            <span className="text-[#D4A373]">──────</span>
            <Coffee className="w-4 h-4 text-[#E0A96D]" />
            <span className="text-[#D4A373]">──────</span>
          </div>

          <p className="animate-hero-delay-1 font-sans font-light text-white/95 text-sm sm:text-base leading-relaxed max-w-md sm:max-w-lg mx-auto">
            Musafir Cafe, a sanctuary in Surat, Gujarat — crafted with passion for slow coffee, warm conversations, and culinary moments.
          </p>

          <div className="pt-1 text-xs font-mono text-white/70 tracking-wider">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-[#E0A96D] font-bold">Gallery</span>
          </div>
        </div>
      </section>

      {/* ─── 2. CATEGORY FILTER BUTTONS ─── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-4">
        <div className="flex items-center justify-center flex-wrap gap-2">
          {FILTER_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => {
                setActiveFilter(cat.key)
                setLightboxIndex(null)
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                activeFilter === cat.key
                  ? 'bg-green text-white scale-105 font-bold'
                  : 'bg-white text-[#444] border border-border hover:bg-border/60 hover:text-[#1C1C1C]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* ─── 3. RESPONSIVE PHOTO GALLERY GRID ─── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="text-center text-xs text-muted mb-6 font-mono">
          Showing {filteredImages.length} moments of delight
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {filteredImages.map((image, index) => (
            <Reveal key={image.id} delay={(index % 4) * 60}>
              <div
                onClick={() => setLightboxIndex(index)}
                className="group relative aspect-square sm:aspect-[4/5] rounded-2xl overflow-hidden bg-cream border border-border transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
              >
                {/* Image */}
                <img
                  src={image.src}
                  alt={image.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />

                {/* Top Badge */}
                <div className="absolute top-2.5 left-2.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[#1C1C1C] text-[9px] font-bold border border-border shadow-xs">
                    {image.tag}
                  </span>
                </div>

                {/* Center Zoom Icon */}
                <div className="absolute inset-0 flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300 pointer-events-none">
                  <div className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center">
                    <FiZoomIn className="w-4 h-4" />
                  </div>
                </div>

                {/* Bottom Caption */}
                <div className="absolute bottom-2.5 inset-x-2.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-left">
                  <span className="inline-block px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-xs font-semibold leading-tight line-clamp-1">
                    {image.title}
                  </span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─── 4. BOTTOM EXPERIENCE CALL TO ACTION ─── */}
      <section className="bg-green text-white py-16 px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-5">
          <span className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-bold">
            <Heart className="w-3.5 h-3.5 fill-emerald-300" />
            <span>Join Our Surat Community</span>
          </span>

          <h2 className="font-serif text-3xl sm:text-4xl font-bold">
            Taste What You See
          </h2>

          <p className="font-sans font-light text-white/80 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
            Every cup poured and dish plated is an expression of our love for artisanal cafe culture. Come unwind with us today!
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/menu"
              className="py-3 px-8 rounded-full bg-white text-[#1C1C1C] hover:bg-[#FAF8F4] font-bold text-xs shadow-lg transition-all flex items-center space-x-2 cursor-pointer active:scale-95"
            >
              <span>Explore Full Menu</span>
              <FiArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/our-story"
              className="py-3 px-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold text-xs transition-all cursor-pointer"
            >
              <span>Our Story</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 5. FULL-SCREEN LIGHTBOX MODAL ─── */}
      {lightboxIndex !== null && filteredImages[lightboxIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-fade-in select-none">
          {/* Backdrop Click */}
          <div className="absolute inset-0" onClick={() => setLightboxIndex(null)} />

          {/* Close Button */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-3 right-3 sm:top-6 sm:right-6 p-2 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer z-30"
            title="Close (Esc)"
          >
            <FiX className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Prev Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handlePrev()
            }}
            className="absolute left-2 sm:left-6 p-2 sm:p-3 rounded-full bg-white/15 hover:bg-white/30 text-white transition-all cursor-pointer z-30 hover:scale-110 active:scale-95 shadow-md"
            title="Previous (Left Arrow)"
          >
            <FiChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Next Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleNext()
            }}
            className="absolute right-2 sm:right-6 p-2 sm:p-3 rounded-full bg-white/15 hover:bg-white/30 text-white transition-all cursor-pointer z-30 hover:scale-110 active:scale-95 shadow-md"
            title="Next (Right Arrow)"
          >
            <FiChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Modal Content Box */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full max-h-[85vh] bg-[#141414] rounded-3xl overflow-hidden border border-white/15 shadow-2xl z-10 flex flex-col items-center animate-scale-up"
          >
            {/* Image View */}
            <div className="relative w-full h-[60vh] sm:h-[68vh] bg-black flex items-center justify-center overflow-hidden">
              <img
                src={filteredImages[lightboxIndex].src}
                alt={filteredImages[lightboxIndex].title}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* Bottom Caption & Counter Bar */}
            <div className="w-full p-4 sm:p-5 bg-[#1C1C1C] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-white">
              <div className="text-center sm:text-left">
                <span className="text-[10px] font-bold text-[#E0A96D] uppercase tracking-wider block">
                  {filteredImages[lightboxIndex].tag}
                </span>
                <h3 className="font-serif font-bold text-base sm:text-lg leading-tight">
                  {filteredImages[lightboxIndex].title}
                </h3>
              </div>

              <div className="flex items-center space-x-3 text-xs font-mono text-white/60">
                <span>
                  Photo {lightboxIndex + 1} of {filteredImages.length}
                </span>
                <Link
                  to="/menu"
                  onClick={() => setLightboxIndex(null)}
                  className="px-3.5 py-1.5 rounded-full bg-green hover:bg-green-dark text-white font-sans font-bold text-xs transition-colors shadow-sm cursor-pointer"
                >
                  Order Now ➔
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default Gallery

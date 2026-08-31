import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Coffee, Play, Film, ExternalLink, X, Volume2, VolumeX } from 'lucide-react'
import { FaInstagram, FaYoutube } from 'react-icons/fa'
import { IMAGES } from '../constants/images'
import Reveal from '../components/Reveal'
import toast from 'react-hot-toast'
import { useCart } from '../context/CartContext'
import { api } from '../lib/api'

// Helper to parse any external Reel/Shorts/Video link
function parseReelMedia(url) {
  if (!url) return { type: 'video', embedUrl: '', rawUrl: '', watchUrl: '' }
  const trimmed = url.trim()

  const igMatch = trimmed.match(/(?:instagram\.com|instagr\.am)\/(?:reel|p|tv)\/([a-zA-Z0-9_-]+)/)
  if (igMatch && igMatch[1]) {
    return {
      type: 'instagram',
      id: igMatch[1],
      embedUrl: `https://www.instagram.com/reel/${igMatch[1]}/embed/captioned/`,
      watchUrl: `https://www.instagram.com/reel/${igMatch[1]}/`,
      rawUrl: trimmed,
    }
  }

  const ytShortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/)
  if (ytShortsMatch && ytShortsMatch[1]) {
    return {
      type: 'youtube',
      id: ytShortsMatch[1],
      embedUrl: `https://www.youtube.com/embed/${ytShortsMatch[1]}?autoplay=1&mute=0&rel=0&loop=1`,
      watchUrl: `https://youtube.com/shorts/${ytShortsMatch[1]}`,
      rawUrl: trimmed,
    }
  }

  const ytStandardMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([a-zA-Z0-9_-]+)/)
  if (ytStandardMatch && ytStandardMatch[1]) {
    return {
      type: 'youtube',
      id: ytStandardMatch[1],
      embedUrl: `https://www.youtube.com/embed/${ytStandardMatch[1]}?autoplay=1&mute=0&rel=0`,
      watchUrl: `https://youtu.be/${ytStandardMatch[1]}`,
      rawUrl: trimmed,
    }
  }

  return {
    type: 'video',
    embedUrl: trimmed,
    watchUrl: trimmed,
    rawUrl: trimmed,
  }
}

function Home() {
  const [email, setEmail] = useState('')
  const { customerSession, setIsRewardModalOpen } = useCart()
  const [socialReels, setSocialReels] = useState([])
  const [activeReelModal, setActiveReelModal] = useState(null)
  const [isMuted, setIsMuted] = useState(true)

  useEffect(() => {
    async function loadReels() {
      try {
        const data = await api.getSocialReels(true)
        setSocialReels(data || [])
      } catch { }
    }
    loadReels()
  }, [])

  const handleSubscribe = (e) => {
    e.preventDefault()
    toast.success('Thank you for subscribing to Musafir Cafe!')
    setEmail('')
  }

  return (
    <div>
      {/* SECTION 1: HERO WITH HARDWARE-ACCELERATED STICKY PARALLAX (Works on Mobile & Desktop) */}
      <section className="parallax-window w-full min-h-[85vh] md:min-h-[92vh] flex items-center bg-[#1C130D]">
        {/* Sticky Background Image Layer */}
        <div className="parallax-fixed-layer">
          <img
            src={IMAGES.heroDesktop}
            alt="Musafir Cafe Hero"
            className="w-full h-full object-cover object-right md:object-center"
          />
          {/* Subtle dark tint overlay */}
          <div className="absolute inset-0 bg-black/30 pointer-events-none" />
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

        {/* Content Container aligned to the LEFT */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 md:px-16 lg:px-24 py-12 sm:py-16 md:py-20 flex justify-center md:justify-start">
          <div className="max-w-xs sm:max-w-sm md:max-w-md text-center flex flex-col items-center">
            <h1 className="animate-hero font-serif font-normal text-3xl sm:text-4xl md:text-5xl lg:text-[52px] text-white leading-tight tracking-tight drop-shadow-md">
              Welcome to Surat
            </h1>

            {/* Coffee icon divider ornament */}
            <div className="flex items-center justify-center gap-2.5 w-32 sm:w-40 my-2.5 sm:my-3 mx-auto">
              <div className="h-[1px] flex-1 bg-[#D4A373]/60" />
              <Coffee className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D4A373]" strokeWidth={1.75} />
              <div className="h-[1px] flex-1 bg-[#D4A373]/60" />
            </div>

            <p className="animate-hero-delay-1 font-serif font-light text-white/90 text-xs sm:text-sm md:text-[15px] leading-relaxed max-w-xs sm:max-w-sm mx-auto drop-shadow">
              Where every cup tells a story and every moment feels like home.
            </p>

            <Link
              to="/menu"
              className="animate-hero-delay-1 mt-5 sm:mt-6 inline-flex items-center justify-center px-7 py-2 sm:px-8 sm:py-2.5 rounded-full bg-white text-[#1C1C1C] font-sans font-semibold text-xs sm:text-[13px] shadow-lg hover:bg-[#FAF8F4] transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 2: OUR HAPPY PLACE */}
      <section className="bg-white py-12 sm:py-14 px-6 text-center w-full">
        <div className="max-w-4xl mx-auto">
          <Reveal as="h2" className="font-serif text-3xl sm:text-4xl font-semibold text-[#1C1C1C] mb-4">Our Happy Place</Reveal>
          <Reveal as="p" delay={150} className="font-sans font-light text-sm sm:text-base text-[#444] leading-relaxed">
            Musafir Cafe is a warm and welcoming place where we celebrate the simple joys of good food, great coffee and beautiful moments. ☕✨ We believe the best things in life are made with care — from delicious homemade treats and freshly prepared dishes to artisan coffee and refreshing drinks. 🍰🥪🥤
          </Reveal>
        </div>
      </section>


      {/* SECTION 5: LOCATION & OPENING HOURS */}
      <section className="bg-white py-20 px-6 sm:px-12">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Hand-drawn Watercolor Illustration */}
          <div className="flex justify-center">
            <img
              src={IMAGES.locationMap}
              alt="Musafir Cafe Illustration"
              className="w-full max-w-md object-contain"
            />
          </div>

          {/* Right: Address & Hours Info */}
          <div className="text-center flex flex-col items-center">
            {/* Title & Address */}
            <h3 className="font-sans font-semibold text-xs sm:text-sm tracking-[0.18em] uppercase text-[#1C1C1C]">
              MUSAFIR CAFE
            </h3>
            <p className="font-sans text-xs sm:text-sm tracking-[0.12em] uppercase text-[#444] mt-1.5">
              4A-5A varachha COURT, Surat, india, NW3 1QS
            </p>

            {/* Walk-in notice */}
            <p className="font-sans font-light text-xs sm:text-sm text-[#666] max-w-xs sm:max-w-sm mt-4 mb-7 leading-relaxed">
              We dont take bookings but we have tables available inside and outside for walk in's.
            </p>

            {/* Opening Hours */}
            <h4 className="font-sans font-semibold text-xs sm:text-sm tracking-[0.18em] uppercase text-[#1C1C1C] mb-3">
              OPENING HOURS
            </h4>

            <div className="space-y-4 text-xs sm:text-sm font-sans font-light text-[#444] mb-8">
              <div>
                <p className="text-[#666]">Monday - Friday</p>
                <p className="text-[#1C1C1C] font-normal">7.30am - 5.30pm</p>
              </div>
              <div>
                <p className="text-[#666]">Saturday</p>
                <p className="text-[#1C1C1C] font-normal">7.30am - 6pm</p>
              </div>
              <div>
                <p className="text-[#666]">Sunday</p>
                <p className="text-[#1C1C1C] font-normal">8am - 6pm</p>
              </div>
            </div>

            {/* Get Directions Button */}
            <a
              href="https://maps.google.com"
              target="_blank"
              rel="noreferrer"
              className="inline-block px-9 py-3 rounded-full bg-[#1C1C1C] text-white font-sans text-xs uppercase tracking-wider font-medium hover:bg-black transition-all shadow-md active:scale-95"
            >
              Get Directions
            </a>
          </div>
        </div>
      </section>

      {/* SECTION 4: MCAFEE COLLECT */}
      <section className="bg-[#FAF8F4] py-14 sm:py-20 px-4 sm:px-6 text-center">
        <Reveal as="h2" className="section-heading mb-3 sm:mb-4">Musafir Cafe Collect</Reveal>
        <Reveal as="p" delay={150} className="section-sub mb-10 sm:mb-14">We will have your artisan order freshly packed and ready for you.</Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-shadow border border-[#E8E2D9]">
            <img src={IMAGES.collectShop} alt="Musafir Coffee Shop" className="w-full h-56 sm:h-72 object-cover" />
            <div className="p-5 sm:p-6 text-left">
              <h3 className="font-serif text-xl sm:text-2xl font-medium mb-2.5 text-[#1C1C1C]">Cafe Dine-In &amp; Collect</h3>
              <p className="font-sans font-light text-xs sm:text-sm text-muted leading-relaxed mb-6">
                Click and collect from our menu for now or later. Enjoy specialty coffees, cakes, sourdough toasties, artisan cookies and fresh coolers to go.
              </p>
              <Link to="/menu" className="btn-dark">Order from Musafir</Link>
            </div>
          </div>
          {/* Card 2 */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-shadow border border-[#E8E2D9]">
            <img src={IMAGES.collectWindow} alt="Musafir Quick Window" className="w-full h-56 sm:h-72 object-cover" />
            <div className="p-5 sm:p-6 text-left">
              <h3 className="font-serif text-xl sm:text-2xl font-medium mb-2.5 text-[#1C1C1C]">Express Window Pickup</h3>
              <p className="font-sans font-light text-xs sm:text-sm text-muted leading-relaxed mb-6">
                Quick pickup for your piping hot pour-overs, iced cold brews, freshly baked brownies, cinnamon pastries, and handcrafted sandwiches.
              </p>
              <Link to="/menu" className="btn-dark">Order for Pickup</Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: EDITORIAL PHOTO STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-3 w-full">
        <img src={IMAGES.stripSandwich} alt="Artisan Sandwich" className="w-full h-48 sm:h-64 md:h-80 lg:h-96 object-cover" />
        <img src={IMAGES.stripGoodDay} alt="Musafir Cafe Atmosphere" className="w-full h-48 sm:h-64 md:h-80 lg:h-96 object-cover" />
        <img src={IMAGES.stripCafe} alt="Brewing Espresso" className="w-full h-48 sm:h-64 md:h-80 lg:h-96 object-cover" />
      </div>

      {/* SECTION 7: ABOUT MUSAFIR CAFE FEATURES */}
      <section className="bg-[#FAF8F4] py-14 sm:py-20 px-4 sm:px-6 text-center">
        <Reveal as="h2" className="section-heading mb-3 sm:mb-4">About Musafir Cafe</Reveal>
        <Reveal as="p" delay={150} className="section-sub mb-10 sm:mb-16">A few extras that make our journey special.</Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 max-w-4xl mx-auto">
          {/* Item 1 */}
          <div className="flex flex-col items-center text-center p-4 bg-white/60 sm:bg-transparent rounded-2xl border sm:border-none border-[#E8E2D9]">
            <span className="text-4xl sm:text-5xl mb-3 sm:mb-4">🐶</span>
            <h3 className="font-serif text-base sm:text-lg font-medium mb-1.5 sm:mb-2 text-[#1C1C1C]">Pet Friendly</h3>
            <p className="font-sans font-light text-xs sm:text-sm text-muted leading-relaxed">We love animals and they are always welcome inside Musafir Cafe. We know our furry regulars by name!</p>
          </div>
          {/* Item 2 */}
          <div className="flex flex-col items-center text-center p-4 bg-white/60 sm:bg-transparent rounded-2xl border sm:border-none border-[#E8E2D9]">
            <img src={IMAGES.iconLocal} alt="All Local" className="h-12 w-12 sm:h-16 sm:w-16 object-contain mb-3 sm:mb-4" />
            <h3 className="font-serif text-base sm:text-lg font-medium mb-1.5 sm:mb-2 text-[#1C1C1C]">Artisanal Sourcing</h3>
            <p className="font-sans font-light text-xs sm:text-sm text-muted leading-relaxed">We take pride in sourcing single-origin estate coffee beans from South India and organic dairy from local farms.</p>
          </div>
          {/* Item 3 */}
          <div className="flex flex-col items-center text-center p-4 bg-white/60 sm:bg-transparent rounded-2xl border sm:border-none border-[#E8E2D9]">
            <span className="text-4xl sm:text-5xl mb-3 sm:mb-4">⭐</span>
            <h3 className="font-serif text-base sm:text-lg font-medium mb-1.5 sm:mb-2 text-[#1C1C1C]">Travel Tokens Loyalty</h3>
            <p className="font-sans font-light text-xs sm:text-sm text-muted leading-relaxed">Earn Travel Tokens on every table order or takeout to redeem for complimentary coffee and cookies.</p>
          </div>
          {/* Item 4 */}
          <div className="flex flex-col items-center text-center p-4 bg-white/60 sm:bg-transparent rounded-2xl border sm:border-none border-[#E8E2D9]">
            <img src={IMAGES.iconPlastic} alt="Plastic Free" className="h-12 w-12 sm:h-16 sm:w-16 object-contain mb-3 sm:mb-4" />
            <h3 className="font-serif text-base sm:text-lg font-medium mb-1.5 sm:mb-2 text-[#1C1C1C]">Eco-Conscious Packaging</h3>
            <p className="font-sans font-light text-xs sm:text-sm text-muted leading-relaxed">We prioritize compostable paper cups, wooden cutlery, and recyclable takeaway boxes.</p>
          </div>
          {/* Item 5 */}
          <div className="flex flex-col items-center text-center p-4 bg-white/60 sm:bg-transparent rounded-2xl border sm:border-none border-[#E8E2D9]">
            <img src={IMAGES.iconLocation} alt="Surat" className="h-12 w-12 sm:h-16 sm:w-16 object-contain mb-3 sm:mb-4" />
            <h3 className="font-serif text-base sm:text-lg font-medium mb-1.5 sm:mb-2 text-[#1C1C1C]">Heart of Surat</h3>
            <p className="font-sans font-light text-xs sm:text-sm text-muted leading-relaxed">We are very proud to be a vibrant community hub in Surat, hosting local art and creative meetups.</p>
          </div>
          {/* Item 6 */}
          <div className="flex flex-col items-center text-center p-4 bg-white/60 sm:bg-transparent rounded-2xl border sm:border-none border-[#E8E2D9]">
            <img src={IMAGES.iconCoffee} alt="Specialty Roasts" className="h-12 w-12 sm:h-16 sm:w-16 object-contain mb-3 sm:mb-4 rounded-full" />
            <h3 className="font-serif text-base sm:text-lg font-medium mb-1.5 sm:mb-2 text-[#1C1C1C]">Specialty Roasting</h3>
            <p className="font-sans font-light text-xs sm:text-sm text-muted leading-relaxed">Small-batch artisanal coffee roasting right here in Surat for peak aroma and balanced crema.</p>
          </div>
        </div>
      </section>

      {/* SECTION 8: PETS ARE WELCOME */}
      <section className="bg-white py-14 sm:py-20 px-4 sm:px-6 text-center">
        <Reveal as="h2" className="section-heading mb-3 sm:mb-4">Pets are Welcome</Reveal>
        <Reveal as="p" delay={150} className="section-sub mb-8 sm:mb-12">We love your companion animals!</Reveal>

        <div className="flex flex-col md:flex-row w-full gap-4 max-w-5xl mx-auto">
          <img src={IMAGES.petsPhoto1} alt="Pets at Musafir Cafe" className="flex-1 h-64 sm:h-80 md:h-[450px] object-cover rounded-2xl" />
          <img src={IMAGES.petsPhoto2} alt="Pets at Musafir Cafe" className="flex-1 h-64 sm:h-80 md:h-[450px] object-cover rounded-2xl" />
        </div>
      </section>

      {/* SECTION 9: GIFT VOUCHERS */}
      <section className="bg-[#FAF8F4] py-14 sm:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-16 items-center">
          {/* Text */}
          <div className="order-2 md:order-1 text-center md:text-left">
            <Reveal as="h2" className="section-heading mb-4 sm:mb-6">Musafir Cafe Gift Vouchers</Reveal>
            <Reveal as="p" delay={150} className="font-sans font-light text-base sm:text-lg text-[#444] leading-relaxed mb-6 sm:mb-8">
              Coffee is on you! Gift handcrafted happiness to those you love with Musafir Cafe Vouchers.
            </Reveal>
            <Reveal delay={300} className="inline-block"><Link to="/menu" className="btn-dark">Order Vouchers</Link></Reveal>
          </div>
          {/* Image */}
          <div className="order-1 md:order-2 flex justify-center">
            <img src={IMAGES.vouchers} alt="Gift Vouchers" className="w-full max-w-md rounded-2xl shadow-sm" />
          </div>
        </div>
      </section>

      {/* SECTION 10: FOOD PHOTO GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 w-full">
        <img src={IMAGES.foodEggs} alt="Eggs & Sourdough" className="w-full h-48 sm:h-64 md:h-80 object-cover" />
        <img src={IMAGES.foodBaked} alt="Fresh Bakery Goods" className="w-full h-48 sm:h-64 md:h-80 object-cover" />
        <img src={IMAGES.foodHotChoc} alt="Belgian Hot Chocolate" className="w-full h-48 sm:h-64 md:h-80 object-cover" />
        <img src={IMAGES.foodCake} alt="Artisan Cake" className="w-full h-48 sm:h-64 md:h-80 object-cover" />
      </div>

      {/* SECTION 11: TESTIMONIALS */}
      <section className="bg-white py-14 sm:py-20 px-4 sm:px-6 text-center">
        <Reveal as="h2" className="section-heading mb-10 sm:mb-16">What Guests Say about Musafir</Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 max-w-5xl mx-auto">
          {/* Review 1 */}
          <div className="text-center p-4">
            <span className="font-serif text-6xl sm:text-8xl text-green leading-none mb-1 sm:mb-2 block">"</span>
            <p className="font-sans font-light text-sm sm:text-base text-[#444] leading-relaxed italic mb-4 sm:mb-6">
              Musafir Cafe is hands down my favorite coffee retreat in Surat. The pour-overs and warm cookies are sublime, and the tranquil ambience makes it perfect to read or work.
            </p>
            <p className="font-sans font-bold text-sm text-[#1C1C1C]">Aarav Sharma</p>
            <p className="font-sans font-light text-xs text-faint">Google Review</p>
          </div>
          {/* Review 2 */}
          <div className="text-center p-4">
            <span className="font-serif text-6xl sm:text-8xl text-green leading-none mb-1 sm:mb-2 block">"</span>
            <p className="font-sans font-light text-sm sm:text-base text-[#444] leading-relaxed italic mb-4 sm:mb-6">
              We visited for evening brunch and ordered the artisan pizza and cold brew. Perfect balance of flavor and warmth. Super friendly staff and quick table QR service.
            </p>
            <p className="font-sans font-bold text-sm text-[#1C1C1C]">Pooja Patel</p>
            <p className="font-sans font-light text-xs text-faint">Surat Local</p>
          </div>
          {/* Review 3 */}
          <div className="text-center p-4">
            <span className="font-serif text-6xl sm:text-8xl text-green leading-none mb-1 sm:mb-2 block">"</span>
            <p className="font-sans font-light text-sm sm:text-base text-[#444] leading-relaxed italic mb-4 sm:mb-6">
              The custom cookie box builder is awesome! 6 fresh warm cookies with Biscoff and Dark Sea Salt made my day. A must-visit place when in Surat!
            </p>
            <p className="font-sans font-bold text-sm text-[#1C1C1C]">Rohan Desai</p>
            <p className="font-sans font-light text-xs text-faint">Food Traveler</p>
          </div>
        </div>
      </section>

      {/* SECTION 12: SOCIAL REEL VIDEOS */}
      <section className="bg-[#FAF8F4] py-20 px-4 sm:px-6 text-center">
        <Reveal as="h2" className="section-heading mb-3">Musafir Cafe on Social</Reveal>
        <Reveal as="p" delay={150} className="font-sans font-light text-muted text-base sm:text-lg mb-6">
          @musafircafe • Watch our latest culinary moments &amp; brewing stories
        </Reveal>
        <Reveal delay={250} className="inline-block mb-12">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline inline-flex items-center space-x-2 text-xs font-bold"
          >
            <FaInstagram className="w-4 h-4 text-rose-600" />
            <span>Follow @musafircafe on Instagram</span>
          </a>
        </Reveal>

        {/* 9:16 Vertical Reel Cards Grid (Compact & Sleek) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
          {socialReels.map((reel, idx) => {
            const media = parseReelMedia(reel.video_url);
            return (
              <Reveal key={reel.id || idx} delay={idx * 80}>
                <div
                  onClick={() => setActiveReelModal({ ...reel, media })}
                  className="group relative aspect-[9/15] max-w-[210px] mx-auto w-full rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer bg-[#1C1C1C]"
                >
                  {/* Video or Thumbnail */}
                  {media.type === 'video' ? (
                    <video
                      src={media.rawUrl}
                      poster={reel.thumbnail_url || ''}
                      muted
                      loop
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                      onMouseLeave={(e) => {
                        e.currentTarget.pause();
                        e.currentTarget.currentTime = 0;
                      }}
                    />
                  ) : reel.thumbnail_url ? (
                    <img
                      src={reel.thumbnail_url}
                      alt={reel.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-b from-[#243524] to-[#111] flex items-center justify-center">
                      <Film className="w-8 h-8 text-white/40" />
                    </div>
                  )}

                  {/* Gradient Vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/25 pointer-events-none" />

                  {/* Top Badges */}
                  <div className="absolute top-2 inset-x-2 flex items-center justify-between z-10">
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[9px] font-bold border border-white/15">
                      {media.type === 'instagram' ? (
                        <>
                          <FaInstagram className="w-2.5 h-2.5 text-rose-400" />
                          <span>Reel</span>
                        </>
                      ) : media.type === 'youtube' ? (
                        <>
                          <FaYoutube className="w-2.5 h-2.5 text-red-500" />
                          <span>Shorts</span>
                        </>
                      ) : (
                        <>
                          <Film className="w-2.5 h-2.5 text-[#E0A96D]" />
                          <span>Video</span>
                        </>
                      )}
                    </span>

                    {reel.views_count && (
                      <span className="px-1.5 py-0.5 rounded-full bg-black/50 backdrop-blur-xs text-white/90 text-[9px] font-mono">
                        👁️ {reel.views_count}
                      </span>
                    )}
                  </div>

                  {/* Center Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center z-10 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">
                    <div className="w-9 h-9 rounded-full bg-white/25 backdrop-blur-md border border-white/40 flex items-center justify-center text-white shadow-lg">
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    </div>
                  </div>

                  {/* Bottom Title & Audio */}
                  <div className="absolute bottom-2.5 inset-x-2.5 text-left z-10 space-y-0.5">
                    <p className="text-[11px] font-semibold text-white leading-tight line-clamp-1 drop-shadow">
                      {reel.title}
                    </p>
                    <span className="text-[9px] text-white/70 flex items-center space-x-1 truncate font-sans">
                      <span>🎵 Musafir Original</span>
                    </span>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* FULL-SCREEN REEL PLAYER MODAL (COMPACT) */}
      {activeReelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          {/* Backdrop Click */}
          <div className="absolute inset-0" onClick={() => setActiveReelModal(null)} />

          {/* Modal Card */}
          <div className="relative w-full max-w-xs sm:max-w-[340px] bg-[#1C1C1C] rounded-2xl overflow-hidden border border-white/20 shadow-2xl z-10 flex flex-col max-h-[88vh] animate-scale-up">
            {/* Header */}
            <div className="px-3.5 py-2.5 flex items-center justify-between border-b border-white/10 bg-black/40">
              <div className="flex items-center space-x-2 truncate">
                <div className="w-6 h-6 rounded-full bg-green flex items-center justify-center text-white text-[10px] font-bold">
                  ☕
                </div>
                <span className="text-xs font-bold text-white truncate">@musafircafe</span>
              </div>
              <div className="flex items-center space-x-1.5">
                {activeReelModal.media?.watchUrl && (
                  <a
                    href={activeReelModal.media.watchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                    title="Open on Original Platform"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  onClick={() => setActiveReelModal(null)}
                  className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Video / Embed Display */}
            <div className="relative aspect-[9/15] w-full bg-black flex items-center justify-center overflow-hidden">
              {activeReelModal.media?.type === 'instagram' ? (
                <iframe
                  src={activeReelModal.media.embedUrl}
                  className="w-full h-full border-0"
                  allowFullScreen
                  title={activeReelModal.title}
                />
              ) : activeReelModal.media?.type === 'youtube' ? (
                <iframe
                  src={activeReelModal.media.embedUrl}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={activeReelModal.title}
                />
              ) : (
                <div className="relative w-full h-full">
                  <video
                    src={activeReelModal.media?.rawUrl}
                    poster={activeReelModal.thumbnail_url || ''}
                    autoPlay
                    loop
                    playsInline
                    muted={isMuted}
                    className="w-full h-full object-cover"
                  />
                  {/* Sound Toggle Button */}
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="absolute bottom-3 right-3 p-2 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 hover:bg-black/80 transition-all cursor-pointer z-20"
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>

            {/* Caption & Actions Footer */}
            <div className="p-3 bg-[#141414] border-t border-white/10 space-y-2">
              <div>
                <h4 className="text-xs font-bold text-white leading-snug line-clamp-2">
                  {activeReelModal.title}
                </h4>
                <p className="text-[10px] text-white/60 mt-0.5 font-sans">
                  Musafir Cafe &amp; Roasters ☕🍰
                </p>
              </div>
              <div className="pt-0.5">
                <Link
                  to="/menu"
                  onClick={() => setActiveReelModal(null)}
                  className="block w-full py-2 rounded-xl bg-white text-[#1C1C1C] hover:bg-[#FAF8F4] font-bold text-xs text-center shadow transition-all cursor-pointer"
                >
                  Explore Cafe Menu ➔
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 13: NEWSLETTER */}
      <section className="bg-green py-14 sm:py-20 px-4 sm:px-6 text-center">
        <Reveal as="h2" className="section-heading text-white mb-3 sm:mb-4">Join the Flavours of our Community</Reveal>
        <Reveal as="p" delay={150} className="font-sans font-light text-white/75 text-sm sm:text-base md:text-lg mb-8 sm:mb-10 max-w-2xl mx-auto">
          Receive exclusive updates, offers, and a slice of our vibrant community delivered straight to your inbox.
        </Reveal>

        <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-0 max-w-md mx-auto w-full">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            required
            className="py-3.5 sm:py-4 px-5 sm:px-6 w-full sm:w-80 border border-white/30 bg-white/10 text-white placeholder-white/50 font-sans text-xs sm:text-sm focus:outline-none focus:border-white rounded-xl sm:rounded-r-none"
          />
          <button type="submit" className="btn-white w-full sm:w-auto rounded-xl sm:rounded-l-none">Subscribe</button>
        </form>
      </section>
    </div>
  )
}

export default Home

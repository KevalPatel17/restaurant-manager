import { useState } from 'react'
import { IMAGES } from '../constants/images'
import Reveal from '../components/Reveal'

function Home() {
  const [email, setEmail] = useState('')

  const handleSubscribe = (e) => {
    e.preventDefault()
    alert('Thank you for subscribing!')
    setEmail('')
  }

  return (
    <div>
      {/* SECTION 1: HERO */}
      <section className="relative w-full min-h-[85vh] overflow-hidden flex items-center justify-center">
        <picture>
          <source media="(max-width: 767px)" srcSet={IMAGES.heroMobile} />
          <img
            src={IMAGES.heroDesktop}
            alt="Artisanal coffee hero"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        </picture>
        {/* Subtle dark tint overlay */}
        <div className="absolute inset-0 bg-black/20" />

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto py-20">
          <h1 className="animate-hero font-serif font-normal text-4xl sm:text-6xl md:text-7xl text-white leading-tight tracking-tight drop-shadow-sm">
            Welcome to Surat
          </h1>
          <a
            href="#menu"
            className="animate-hero-delay-1 mt-7 inline-flex items-center justify-center px-8 py-3 rounded-full bg-white text-[#1C201D] font-sans font-medium text-sm shadow-lg hover:bg-[#FAF8F4] transition-all hover:scale-105 active:scale-95"
          >
            Shop Now
          </a>
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

      {/* SECTION 4: G&W COLLECT */}
      <section className="bg-[#FAF8F4] py-20 px-6 text-center">
        <Reveal as="h2" className="section-heading mb-4">MCafe Collect</Reveal>
        <Reveal as="p" delay={150} className="section-sub mb-14">We will have your order ready for you.</Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Card 1 */}
          <div className="bg-white rounded overflow-hidden">
            <img src={IMAGES.collectShop} alt="Coffee Shop" className="w-full h-72 object-cover" />
            <div className="p-6 text-left">
              <h3 className="font-serif text-2xl font-medium mb-3">Coffee Shop</h3>
              <p className="font-sans font-light text-sm text-muted leading-relaxed mb-6">
                Click and collect from our menu for now or the future. Enjoy coffee, cakes, eggs, salads, toasties, granola and juices to go.
              </p>
              <a href="#" className="btn-dark">Order from G&amp;W</a>
            </div>
          </div>
          {/* Card 2 */}
          <div className="bg-white rounded overflow-hidden">
            <img src={IMAGES.collectWindow} alt="At the Window" className="w-full h-72 object-cover" />
            <div className="p-6 text-left">
              <h3 className="font-serif text-2xl font-medium mb-3">At the Window</h3>
              <p className="font-sans font-light text-sm text-muted leading-relaxed mb-6">
                Click and collect your delicious hot coffee, protein shakes, salads, borekas, cinnamon buns, pastries, cookies and sandwiches.
              </p>
              <a href="#" className="btn-dark">Order from Window</a>
            </div>
          </div>
        </div>
      </section>



      {/* SECTION 6: EDITORIAL PHOTO STRIP */}
      <div className="flex flex-col md:flex-row w-full">
        <img src={IMAGES.stripSandwich} alt="Sandwich" className="flex-1 h-64 md:h-96 object-cover" />
        <img src={IMAGES.stripGoodDay} alt="Good Day" className="flex-1 h-64 md:h-96 object-cover" />
        <img src={IMAGES.stripCafe} alt="Cafe" className="flex-1 h-64 md:h-96 object-cover" />
      </div>

      {/* SECTION 7: ABOUT G&W FEATURES */}
      <section className="bg-[#FAF8F4] py-20 px-6 text-center">
        <Reveal as="h2" className="section-heading mb-4">About Musafir Cafe</Reveal>
        <Reveal as="p" delay={150} className="section-sub mb-16">A few extras that make us special.</Reveal>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-10 max-w-4xl mx-auto">
          {/* Item 1 */}
          <div className="flex flex-col items-center text-center">
            <span className="text-5xl mb-4">🐶</span>
            <h3 className="font-serif text-lg font-medium mb-2">Dog Friendly</h3>
            <p className="font-sans font-light text-sm text-muted leading-relaxed">We love dogs and they are welcome inside at G&amp;W. We know most dogs by name and the treats they like!</p>
          </div>
          {/* Item 2 */}
          <div className="flex flex-col items-center text-center">
            <img src={IMAGES.iconLocal} alt="All Local" className="h-16 w-16 object-contain mb-4" />
            <h3 className="font-serif text-lg font-medium mb-2">All Local</h3>
            <p className="font-sans font-light text-sm text-muted leading-relaxed">We take pride in sourcing ingredients from British farmers. Our eggs are from a family farm in Wales.</p>
          </div>
          {/* Item 3 */}
          <div className="flex flex-col items-center text-center">
            <span className="text-5xl mb-4">❤️</span>
            <h3 className="font-serif text-lg font-medium mb-2">More than Family</h3>
            <p className="font-sans font-light text-sm text-muted leading-relaxed">Enjoy a free coffee with every completed loyalty card. You can download our digital loyalty app.</p>
          </div>
          {/* Item 4 */}
          <div className="flex flex-col items-center text-center">
            <img src={IMAGES.iconPlastic} alt="Plastic Free" className="h-16 w-16 object-contain mb-4" />
            <h3 className="font-serif text-lg font-medium mb-2">Completely Plastic Free</h3>
            <p className="font-sans font-light text-sm text-muted leading-relaxed">We use no plastic at G&amp;W and all our packaging is either paper, wood or fully compostable.</p>
          </div>
          {/* Item 5 */}
          <div className="flex flex-col items-center text-center">
            <img src={IMAGES.iconLocation} alt="varachha" className="h-16 w-16 object-contain mb-4" />
            <h3 className="font-serif text-lg font-medium mb-2">surat</h3>
            <p className="font-sans font-light text-sm text-muted leading-relaxed">We are very proud to be a part of the wonderful community. We support local events and charities.</p>
          </div>
          {/* Item 6 */}
          <div className="flex flex-col items-center text-center">
            <img src={IMAGES.iconCoffee} alt="Square Mile" className="h-16 w-16 object-contain mb-4 rounded-full" />
            <h3 className="font-serif text-lg font-medium mb-2">Square Mile</h3>
            <p className="font-sans font-light text-sm text-muted leading-relaxed">A multi award winning exceptional quality coffee roasting company based in Surat.</p>
          </div>
        </div>
      </section>

      {/* SECTION 8: PETS ARE WELCOME */}
      <section className="bg-white py-20 px-6 text-center">
        <Reveal as="h2" className="section-heading mb-4">Pets are Welcome</Reveal>
        <Reveal as="p" delay={150} className="section-sub mb-12">We love your animals!</Reveal>

        <div className="flex flex-col md:flex-row w-full">
          <img src={IMAGES.petsPhoto1} alt="Pets at G&W" className="flex-1 h-72 md:h-[500px] object-cover" />
          <img src={IMAGES.petsPhoto2} alt="Pets at G&W" className="flex-1 h-72 md:h-[500px] object-cover" />
        </div>
      </section>

      {/* SECTION 9: GIFT VOUCHERS */}
      <section className="bg-[#FAF8F4] py-20 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Text (left on desktop, below image on mobile) */}
          <div className="order-2 md:order-1">
            <Reveal as="h2" className="section-heading mb-6">Musafir Cafe Gift Vouchers</Reveal>
            <Reveal as="p" delay={150} className="font-sans font-light text-lg text-[#444] leading-relaxed mb-8">
              Coffee is on you! Buy happiness for those you love with G&amp;W Gift Vouchers.
            </Reveal>
            <Reveal delay={300} className="inline-block"><a href="#" className="btn-dark">Order Now</a></Reveal>
          </div>
          {/* Image (right on desktop, above text on mobile) */}
          <div className="order-1 md:order-2">
            <img src={IMAGES.vouchers} alt="Gift Vouchers" className="w-full rounded" />
          </div>
        </div>
      </section>

      {/* SECTION 10: FOOD PHOTO GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 w-full">
        <img src={IMAGES.foodEggs} alt="Eggs" className="w-full h-72 md:h-96 object-cover" />
        <img src={IMAGES.foodBaked} alt="Baked goods" className="w-full h-72 md:h-96 object-cover" />
        <img src={IMAGES.foodHotChoc} alt="Hot chocolate" className="w-full h-72 md:h-96 object-cover" />
        <img src={IMAGES.foodCake} alt="Cake" className="w-full h-72 md:h-96 object-cover" />
      </div>

      {/* SECTION 11: TESTIMONIALS */}
      <section className="bg-white py-20 px-6 text-center">
        <Reveal as="h2" className="section-heading mb-16">What People Are Saying about G&amp;W</Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
          {/* Review 1 */}
          <div className="text-center">
            <span className="font-serif text-8xl text-green leading-none mb-2 block">"</span>
            <p className="font-sans font-light text-base text-[#444] leading-relaxed italic mb-6">
              I tried G&amp;W because it was recommended as a great place for coffee and cake. It was exactly that, but more! Now we go there frequently. Everything on the menu is fresh and tasty, but the Shakshuka (with tahini and feta cheese) is my clear favorite. Very friendly staff too, what's not to like?
            </p>
            <p className="font-sans font-bold text-sm text-[#1C1C1C]">Jeff Harrison</p>
            <p className="font-sans font-light text-xs text-faint">Google Guide</p>
          </div>
          {/* Review 2 */}
          <div className="text-center">
            <span className="font-serif text-8xl text-green leading-none mb-2 block">"</span>
            <p className="font-sans font-light text-base text-[#444] leading-relaxed italic mb-6">
              We popped in at 4pm for a very late lunch. We all ordered Shakshuka. It is quite honestly the best I have ever had anywhere in the UK - it had a perfect amount of smokiness and spice, the eggs were cooked to perfection. Simple food can be excellent and should not be underrated. I highly recommend this great little place.
            </p>
            <p className="font-sans font-bold text-sm text-[#1C1C1C]">Abigail Plet</p>
            <p className="font-sans font-light text-xs text-faint">Cambridge</p>
          </div>
          {/* Review 3 */}
          <div className="text-center">
            <span className="font-serif text-8xl text-green leading-none mb-2 block">"</span>
            <p className="font-sans font-light text-base text-[#444] leading-relaxed italic mb-6">
              My favourite cafe in Surat! Sometimes there is a waiting list on weekends but it's usually not a long wait and it's very much worth it. A must go if you are around!
            </p>
            <p className="font-sans font-bold text-sm text-[#1C1C1C]">Itamar Yeshua</p>
            <p className="font-sans font-light text-xs text-faint">Google Guide</p>
          </div>
        </div>
      </section>

      {/* SECTION 12: INSTAGRAM */}
      <section className="bg-[#FAF8F4] py-20 px-6 text-center">
        <Reveal as="h2" className="section-heading mb-3">Musafir Cafe on Social</Reveal>
        <Reveal as="p" delay={150} className="font-sans font-light text-muted text-lg mb-8">@musafircafe</Reveal>
        <Reveal delay={300} className="inline-block"><a href="#" className="btn-outline mb-12">Follow Us</a></Reveal>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 max-w-4xl mx-auto">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square bg-border flex items-center justify-center text-4xl text-faint hover:opacity-80 cursor-pointer transition-opacity">
              📷
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 13: NEWSLETTER */}
      <section className="bg-green py-20 px-6 text-center">
        <Reveal as="h2" className="font-serif text-4xl font-semibold text-white mb-4">Join the Flavours of our Community</Reveal>
        <Reveal as="p" delay={150} className="font-sans font-light text-white/75 text-lg mb-10 max-w-2xl mx-auto">
          Receive exclusive updates, offers, and a slice of our vibrant community delivered straight to your inbox.
        </Reveal>

        <form onSubmit={handleSubscribe} className="flex justify-center">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            required
            className="py-4 px-6 w-80 border border-white/30 bg-white/10 text-white placeholder-white/50 font-sans text-sm focus:outline-none focus:border-white"
          />
          <button type="submit" className="btn-white rounded-l-none">Subscribe</button>
        </form>
      </section>
    </div>
  )
}

export default Home

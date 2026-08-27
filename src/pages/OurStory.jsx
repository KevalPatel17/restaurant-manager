import { IMAGES } from '../constants/images'
import Reveal from '../components/Reveal'

function OurStory() {
  return (
    <div>
      {/* HERO WITH FIXED/PARALLAX BACKGROUND */}
      <section
        className="relative w-full min-h-[60vh] md:min-h-[70vh] bg-fixed bg-cover bg-center bg-no-repeat flex items-center justify-center text-center overflow-hidden"
        style={{
          backgroundImage: `url(${IMAGES.storyHeroDesktop})`,
        }}
      >
        <div className="relative z-10 flex flex-col items-center justify-center px-6">
          <h1 className="animate-hero font-serif text-5xl sm:text-6xl md:text-7xl font-bold text-white tracking-tight drop-shadow">
            Our Story
          </h1>
          <p className="animate-hero-delay-1 font-sans font-light text-white/90 text-base sm:text-lg mt-3 max-w-lg">
            A heartfelt journey of coffee, community, and slow living.
          </p>
        </div>
      </section>

      {/* THE ORIGINS */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Left: Cookbook image */}
          <img src={IMAGES.storyCookbook} alt="Musafir Cafe Heritage" className="w-full rounded" />

          {/* Right: Text */}
          <div>
            <Reveal as="p" className="font-sans font-light text-xs tracking-widest uppercase text-faint mb-3">Since 2019</Reveal>
            <Reveal as="h2" delay={100} className="font-serif text-4xl font-semibold mb-6">The Origins</Reveal>
            <Reveal as="p" delay={200} className="font-sans font-light text-base text-[#444] leading-relaxed mb-4">
              Founded on the spirit of wanderers, travelers, and coffee connoisseurs, Musafir Cafe opened its doors with a simple mission: to craft honest, extraordinary coffee and fresh, artisanal nourishment.
            </Reveal>
            <Reveal as="p" delay={300} className="font-sans font-light text-base text-[#444] leading-relaxed">
              Musafir, meaning traveler, was built to be a warm sanctuary where stories are shared, friendships are made, and every sip of our slow-roasted espresso feels like home.
            </Reveal>
          </div>
        </div>
      </section>

      {/* FULL WIDTH FIXED/PARALLAX IMAGE BREAK */}
      <div
        className="w-full h-[360px] md:h-[500px] bg-fixed bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${IMAGES.storyPhoto2})` }}
      />

      {/* MUSAFIR CAFE STORY */}
      <section className="bg-[#FAF8F4] py-20 px-6 text-center max-w-2xl mx-auto">
        <Reveal as="h2" className="font-serif text-5xl font-semibold mb-8">Musafir Cafe &amp; Roasters</Reveal>
        <Reveal as="p" delay={150} className="font-sans font-light text-lg text-[#444] leading-relaxed mb-6">
          Nestled amidst the bustling streets, Musafir Cafe is a cozy sanctuary for travelers and locals alike. It has become more than just a place for morning coffee; it has become a haven, a community space - a true 'Happy Place.'
        </Reveal>
        <Reveal as="p" delay={250} className="font-sans font-light text-lg text-[#444] leading-relaxed mb-6">
          We pour our hearts into every roast and recipe, sourcing ethical beans and baking fresh daily. The simple goal was to keep Musafir Cafe running as a wonderful place for regular and new guests.
        </Reveal>
        <Reveal as="p" delay={350} className="font-sans font-light text-lg text-[#444] leading-relaxed mb-6">
          Every corner blooms with warm hospitality, soulful aromas, and the timeless warmth of authentic hospitality.
        </Reveal>
        <Reveal as="p" delay={450} className="font-sans font-light italic text-sm text-muted leading-relaxed mt-6">
          Our passionate baristas and artisan chefs craft every brew with love and dedication. Nothing is ever too much effort for our guests.
        </Reveal>
      </section>

      {/* OWNERS PHOTO */}
      <section className="max-w-3xl mx-auto px-6 py-12">
        <img src={IMAGES.storyOwners} alt="Musafir Team" className="w-full rounded" />
      </section>

      {/* BLUE ZONE SECTION */}
      <section className="bg-white py-20 px-6 text-center max-w-2xl mx-auto">
        <Reveal as="h2" className="font-serif text-5xl font-semibold mb-8">A Sanctuary of Belonging</Reveal>
        <Reveal as="p" delay={150} className="font-sans font-light text-lg text-[#444] leading-relaxed mb-4">
          Great cafes are special places known for fostering meaningful human connections and nurturing a sense of belonging in the community.
        </Reveal>
        <Reveal as="p" delay={250} className="font-sans font-light text-lg text-[#444] leading-relaxed mb-4">
          We cherish the sense of community we cultivate at Musafir Cafe, the moments of joy and comfort we share. Our team is like family, caring for each other and our guests with genuine warmth.
        </Reveal>
        <Reveal as="p" delay={350} className="font-sans font-light text-lg text-[#444] leading-relaxed">
          The journey begins at Musafir Cafe, embodying a spirit of camaraderie that welcomes every traveler on their path.
        </Reveal>
      </section>

      {/* FINAL FULL WIDTH FIXED/PARALLAX IMAGE BREAK */}
      <div
        className="w-full h-[360px] md:h-[500px] bg-fixed bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${IMAGES.storyPhoto4})` }}
      />
    </div>
  )
}

export default OurStory

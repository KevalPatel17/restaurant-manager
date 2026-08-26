import { Link } from 'react-router-dom'
import Logo from './Logo'
import { IMAGES } from '../constants/images'

function Footer() {
  return (
    <footer className="bg-green px-6 md:px-10 pt-16 pb-10">
      {/* Two-column layout */}
      <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* LEFT COLUMN */}
        <div>
          {/* Logo */}
          <div className="mb-6">
            <Logo align="left" />
          </div>

          {/* Location & Hours heading */}
          <h4 className="text-white font-sans font-bold text-[11px] uppercase tracking-widest mb-4">
            Location &amp; Hours
          </h4>

          {/* Visit Us */}
          <p className="text-white font-sans font-bold text-[13px]">Visit Us</p>
          <p className="text-white/70 font-sans font-light text-[13px]">Sanctuary Lane, Old Town Arts District</p>
          <p className="text-white/70 font-sans font-light text-[13px] mb-4">+91 95375 33472</p>

          {/* Store Hours */}
          <p className="text-white font-sans font-bold text-[13px]">Store Hours</p>
          <p className="text-white/70 font-sans font-light text-[13px] leading-loose">Mon - Fri: 7:30 AM - 10:00 PM</p>
          <p className="text-white/70 font-sans font-light text-[13px] leading-loose">Sat - Sun: 8:00 AM - 11:00 PM</p>

          {/* Social icons row */}
          <div className="flex gap-4 mt-5">
            <a href="#" className="text-white font-sans text-[11px] uppercase tracking-widest hover:opacity-70 transition-opacity">Facebook</a>
            <a href="#" className="text-white font-sans text-[11px] uppercase tracking-widest hover:opacity-70 transition-opacity">Instagram</a>
            <a href="#" className="text-white font-sans text-[11px] uppercase tracking-widest hover:opacity-70 transition-opacity">Twitter</a>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="md:pt-0">
          <h4 className="text-white font-sans font-bold text-[11px] uppercase tracking-widest mb-4">
            More Information
          </h4>
          <div className="flex flex-col gap-2">
            <Link to="/menu" className="text-white/70 font-sans font-light text-sm hover:text-white transition-colors">Our Menu</Link>
            <Link to="/our-story" className="text-white/70 font-sans font-light text-sm hover:text-white transition-colors">Our Story</Link>
            <a href="#" className="text-white/70 font-sans font-light text-sm hover:text-white transition-colors">Artisanal Brews</a>
            <a href="#" className="text-white/70 font-sans font-light text-sm hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="text-white/70 font-sans font-light text-sm hover:text-white transition-colors">Terms of Service</a>
            <Link to="/login" className="text-white/90 font-sans font-semibold text-sm hover:text-white transition-colors flex items-center gap-1.5 pt-2 border-t border-white/10 mt-1">
              <span>Staff &amp; Admin Login ➔</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-[1100px] mx-auto border-t border-white/15 mt-10 pt-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        <p className="text-white/50 font-sans font-light">
          Copyright © 2026 Musafir Cafe &amp; Roasters. All rights reserved.
        </p>
        <Link to="/login" className="text-white/40 hover:text-white/80 font-sans transition-colors text-[11px]">
          Management Portal
        </Link>
      </div>
    </footer>
  )
}

export default Footer

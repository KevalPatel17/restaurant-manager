import { FaFacebookF, FaInstagram, FaTwitter } from 'react-icons/fa'

// Full-width announcement bar with social links on left and centered notice
function AnnouncementBar() {
  return (
    <div className="bg-[#FAF7EE] border-b border-[#EAE4D9] px-3 sm:px-6 md:px-12 py-1.5 sm:py-2 flex items-center justify-between text-[#222]">
      {/* Left: Social Media Icons (hidden on extra small screens to give full width to announcement) */}
      <div className="hidden xs:flex items-center gap-3 sm:gap-3.5 text-[#2B2B2B]">
        <a
          href="https://facebook.com"
          target="_blank"
          rel="noreferrer"
          className="hover:opacity-60 transition-opacity text-xs"
          aria-label="Facebook"
        >
          <FaFacebookF />
        </a>
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noreferrer"
          className="hover:opacity-60 transition-opacity text-xs"
          aria-label="Instagram"
        >
          <FaInstagram />
        </a>
        <a
          href="https://twitter.com"
          target="_blank"
          rel="noreferrer"
          className="hover:opacity-60 transition-opacity text-xs"
          aria-label="Twitter"
        >
          <FaTwitter />
        </a>
      </div>

      {/* Center: Announcement Text */}
      <div className="flex-1 text-center xs:pr-6 sm:pr-12">
        <p className="font-sans text-[9.5px] xs:text-[10px] sm:text-[11px] font-medium tracking-[0.1em] sm:tracking-[0.15em] uppercase text-[#2B2B2B] leading-tight">
          <span className="hidden md:inline">
            ORDER BY MIDDAY FOR NEXT DAY DISPATCH OR CAFE PICKUP ☕
          </span>
          <span className="md:hidden inline">
            FRESH ARTISAN ROASTS &amp; BAKES DAILY ☕
          </span>
        </p>
      </div>
    </div>
  )
}

export default AnnouncementBar

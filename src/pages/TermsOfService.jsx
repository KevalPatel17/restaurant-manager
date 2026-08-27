import React from 'react'
import { Link } from 'react-router-dom'
import { FileText, Coffee, AlertTriangle, Gift, DollarSign, CheckCircle2, ArrowLeft, Mail, Phone, MapPin } from 'lucide-react'
import Reveal from '../components/Reveal'

export default function TermsOfService() {
  return (
    <div className="bg-[#FAF8F4] min-h-screen pb-24 font-sans">

      {/* TOP HERO HEADER */}
      <section className="bg-[#1A281E] text-white py-12 sm:py-16 px-6 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-rule='evenodd'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="max-w-4xl mx-auto relative z-10">
          {/* Top navigation row */}
          <div className="mb-6">
            <Link
              to="/"
              className="inline-flex items-center space-x-2 text-[#D4A373] hover:text-white text-xs font-bold uppercase tracking-wider transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Centered Badge & Title */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-[#D4A373] text-xs font-bold uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5" />
              <span>Cafe Guidelines &amp; Service Agreement</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
              Terms of Service
            </h1>
            <p className="text-white/70 text-xs sm:text-sm font-light max-w-xl mx-auto">
              Last Updated: August 27, 2026 • Musafir Cafe &amp; Roasters
            </p>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT CONTAINER */}
      <section className="max-w-4xl mx-auto px-6 pt-10 sm:pt-14">
        <Reveal delay={0}>
          <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 sm:p-10 md:p-12 shadow-xs space-y-10 text-[#2B2B2B]">

            {/* Intro */}
            <div className="border-b border-[#F0EBE1] pb-6 space-y-3">
              <h2 className="font-serif text-2xl font-bold text-[#1C1C1C]">
                Welcome to Musafir Cafe
              </h2>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                These Terms of Service (&ldquo;Terms&rdquo;) govern your use of the Musafir Cafe website, digital QR dining menu, online order placement, and participation in the Musafir Travel Tokens loyalty rewards program. By scanning our table QR codes, browsing our menu, or submitting an order, you agree to these Terms.
              </p>
            </div>

            {/* Section 1 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[#1C1C1C]">
                <div className="w-7 h-7 rounded-lg bg-[#FAF8F4] border border-[#E8E2D9] flex items-center justify-center text-[#B87A44]">
                  <Coffee className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-lg font-bold">1. In-Cafe Dining &amp; QR Table Orders</h3>
              </div>
              <p className="text-xs sm:text-sm text-muted leading-relaxed pl-9">
                When ordering via table QR codes, please verify that your assigned Table Number matches your physical seating location. Once an order is submitted to the kitchen display, freshly prepared food items and brewed beverages immediately begin preparation.
              </p>
            </div>

            {/* Section 2 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[#1C1C1C]">
                <div className="w-7 h-7 rounded-lg bg-[#FAF8F4] border border-[#E8E2D9] flex items-center justify-center text-[#B87A44]">
                  <DollarSign className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-lg font-bold">2. Pricing, Payments &amp; Taxes</h3>
              </div>
              <p className="text-xs sm:text-sm text-muted leading-relaxed pl-9">
                All prices listed on our digital menu are in Indian Rupees (₹) and include applicable Goods &amp; Services Tax (GST). We accept payment via:
              </p>
              <ul className="list-disc list-inside text-xs sm:text-sm text-muted space-y-1.5 pl-9">
                <li><strong className="text-[#1C1C1C]">Instant UPI QR:</strong> Direct merchant UPI scans through your preferred payment app.</li>
                <li><strong className="text-[#1C1C1C]">Cash on Counter / Table:</strong> Settled with our staff upon order delivery.</li>
                <li><strong className="text-[#1C1C1C]">Travel Token Discounts:</strong> Redeemable point deductions applied before invoice generation.</li>
              </ul>
            </div>

            {/* Section 3 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[#1C1C1C]">
                <div className="w-7 h-7 rounded-lg bg-[#FAF8F4] border border-[#E8E2D9] flex items-center justify-center text-[#B87A44]">
                  <Gift className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-lg font-bold">3. Travel Tokens Loyalty Program</h3>
              </div>
              <p className="text-xs sm:text-sm text-muted leading-relaxed pl-9">
                Customers earn 10 Travel Tokens for every ₹100 spent at Musafir Cafe. Tokens are non-transferable, have no direct cash redemption value outside our cafe menu, and may be redeemed for exclusive culinary discounts and free artisanal items as outlined in the active reward catalog.
              </p>
            </div>

            {/* Section 4 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[#1C1C1C]">
                <div className="w-7 h-7 rounded-lg bg-[#FAF8F4] border border-[#E8E2D9] flex items-center justify-center text-[#B87A44]">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-lg font-bold">4. Food Allergens &amp; Dietary Disclaimers</h3>
              </div>
              <p className="text-xs sm:text-sm text-muted leading-relaxed pl-9">
                While we take stringent care in our kitchen prep areas, our bakery and kitchen handle nuts, gluten, milk, and soy. If you have severe food allergies, please inform our floor staff or add detailed cooking notes in your digital order cart before submission.
              </p>
            </div>

            {/* Section 5 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[#1C1C1C]">
                <div className="w-7 h-7 rounded-lg bg-[#FAF8F4] border border-[#E8E2D9] flex items-center justify-center text-[#B87A44]">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-lg font-bold">5. Cancellations &amp; Modifications</h3>
              </div>
              <p className="text-xs sm:text-sm text-muted leading-relaxed pl-9">
                Because our coffee and food are crafted to order, cancellations or changes to preparation styles can only be made within 2 minutes of placing the order or prior to kitchen acceptance. Please reach out to your table server immediately for any urgent adjustments.
              </p>
            </div>

            {/* Contact Box */}
            <div className="bg-[#FAF8F4] rounded-2xl border border-[#E8E2D9] p-6 sm:p-8 space-y-3">
              <h4 className="font-serif text-base font-bold text-[#1C1C1C]">
                Customer Support &amp; Feedback
              </h4>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                We are dedicated to providing warm hospitality. For any queries regarding your dining experience, billing receipts, or token balances:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="flex items-center gap-2 text-[#1C1C1C]">
                  <MapPin className="w-4 h-4 text-[#B87A44] shrink-0" />
                  <span>Sanctuary Lane, Surat</span>
                </div>
                <div className="flex items-center gap-2 text-[#1C1C1C]">
                  <Phone className="w-4 h-4 text-[#B87A44] shrink-0" />
                  <span>+91 75554 17487</span>
                </div>
                <div className="flex items-center gap-2 text-[#1C1C1C]">
                  <Mail className="w-4 h-4 text-[#B87A44] shrink-0" />
                  <span>support@musafir.cafe</span>
                </div>
              </div>
            </div>

          </div>
        </Reveal>
      </section>

    </div>
  )
}

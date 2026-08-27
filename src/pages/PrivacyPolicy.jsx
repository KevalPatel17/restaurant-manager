import React from 'react'
import { Link } from 'react-router-dom'
import { Shield, Lock, Eye, Bell, Database, ArrowLeft, Mail, Phone, MapPin } from 'lucide-react'
import Reveal from '../components/Reveal'

export default function PrivacyPolicy() {
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
              <Shield className="w-3.5 h-3.5" />
              <span>Customer Trust &amp; Transparency</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
              Privacy Policy
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
                Your Privacy at Musafir Cafe
              </h2>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                At Musafir Cafe &amp; Roasters (&ldquo;Musafir&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;), we value the trust you place in us when sharing your personal information. Whether you are dining at our physical cafe tables, scanning our QR ordering system, participating in the Travel Tokens loyalty rewards program, or ordering online, this Privacy Policy explains how we collect, safeguard, and utilize your data.
              </p>
            </div>

            {/* Section 1 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[#1C1C1C]">
                <div className="w-7 h-7 rounded-lg bg-[#FAF8F4] border border-[#E8E2D9] flex items-center justify-center text-[#B87A44]">
                  <Eye className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-lg font-bold">1. Information We Collect</h3>
              </div>
              <p className="text-xs sm:text-sm text-muted leading-relaxed pl-9">
                We collect personal information that you voluntarily provide to us when placing an order or registering for loyalty benefits, including:
              </p>
              <ul className="list-disc list-inside text-xs sm:text-sm text-muted space-y-1.5 pl-9">
                <li><strong className="text-[#1C1C1C]">Contact Information:</strong> Your name and mobile phone number provided during guest checkout or customer capture.</li>
                <li><strong className="text-[#1C1C1C]">Dining &amp; Order Details:</strong> Assigned table numbers, selected food &amp; beverage items, preparation preferences, and order history.</li>
                <li><strong className="text-[#1C1C1C]">Travel Tokens &amp; Loyalty Data:</strong> Token balances accumulated through spending (10 tokens per ₹100 spent) and reward redemption histories.</li>
                <li><strong className="text-[#1C1C1C]">Device &amp; Session Info:</strong> Browser cookie preferences and temporary cart data stored locally on your device for seamless browsing.</li>
              </ul>
            </div>

            {/* Section 2 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[#1C1C1C]">
                <div className="w-7 h-7 rounded-lg bg-[#FAF8F4] border border-[#E8E2D9] flex items-center justify-center text-[#B87A44]">
                  <Database className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-lg font-bold">2. How We Use Your Information</h3>
              </div>
              <p className="text-xs sm:text-sm text-muted leading-relaxed pl-9">
                Your data is exclusively utilized to deliver a premier dining experience:
              </p>
              <ul className="list-disc list-inside text-xs sm:text-sm text-muted space-y-1.5 pl-9">
                <li>Routing your order directly to our kitchen baristas and servers at your specific table.</li>
                <li>Sending instant digital bills and real-time preparation updates to your WhatsApp number via automated notifications.</li>
                <li>Crediting and redeeming your Travel Token rewards automatically upon invoice generation.</li>
                <li>Improving our seasonal menu selections, kitchen preparation times, and service quality.</li>
              </ul>
            </div>

            {/* Section 3 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[#1C1C1C]">
                <div className="w-7 h-7 rounded-lg bg-[#FAF8F4] border border-[#E8E2D9] flex items-center justify-center text-[#B87A44]">
                  <Bell className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-lg font-bold">3. WhatsApp &amp; SMS Communications</h3>
              </div>
              <p className="text-xs sm:text-sm text-muted leading-relaxed pl-9">
                Musafir Cafe utilizes secure WhatsApp automation (WAHA Gateway) solely for transactional order notifications, PDF digital invoices, and time-critical order readiness alerts. We do not spam or sell your phone number to third-party advertising brokers.
              </p>
            </div>

            {/* Section 4 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[#1C1C1C]">
                <div className="w-7 h-7 rounded-lg bg-[#FAF8F4] border border-[#E8E2D9] flex items-center justify-center text-[#B87A44]">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-lg font-bold">4. Payment Security</h3>
              </div>
              <p className="text-xs sm:text-sm text-muted leading-relaxed pl-9">
                All UPI payments and digital transactions are processed directly through certified banking gateways and merchant UPI rails (BHIM, Google Pay, PhonePe, Paytm). Musafir Cafe does not store or process sensitive card CVV numbers or banking passwords on our local databases.
              </p>
            </div>

            {/* Section 5 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[#1C1C1C]">
                <div className="w-7 h-7 rounded-lg bg-[#FAF8F4] border border-[#E8E2D9] flex items-center justify-center text-[#B87A44]">
                  <Shield className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-lg font-bold">5. Data Storage &amp; Protection</h3>
              </div>
              <p className="text-xs sm:text-sm text-muted leading-relaxed pl-9">
                Your customer profile and order logs are securely stored in cloud infrastructure backed by encrypted Postgres databases with strict Row Level Security (RLS). Only authenticated management personnel have access to operational logs.
              </p>
            </div>

            {/* Contact Box */}
            <div className="bg-[#FAF8F4] rounded-2xl border border-[#E8E2D9] p-6 sm:p-8 space-y-3">
              <h4 className="font-serif text-base font-bold text-[#1C1C1C]">
                Questions or Data Requests?
              </h4>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                If you have questions about your stored data, want to delete your profile, or wish to update your contact details, please get in touch:
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
                  <span>privacy@musafir.cafe</span>
                </div>
              </div>
            </div>

          </div>
        </Reveal>
      </section>

    </div>
  )
}

import React, { useState } from 'react';
import { Sparkles, ArrowRight, UserCheck, Smartphone, ShieldCheck, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

export default function CustomerCaptureModal() {
  const {
    isCustomerCaptureOpen,
    setIsCustomerCaptureOpen,
    tableNumber,
    identifyCustomer,
    skipCustomerCapture,
    setIsRewardModalOpen,
  } = useCart();

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isCustomerCaptureOpen) return null;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setErrorMsg('');

    const cleanMobile = mobile.trim().replace(/\D/g, '');
    if (!cleanMobile) {
      setErrorMsg('Please enter your 10-digit mobile number.');
      return;
    }

    if (cleanMobile.length !== 10) {
      setErrorMsg('Mobile number must be exactly 10 digits (e.g. 9876543210).');
      return;
    }

    if (!name.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }

    try {
      setIsLoading(true);
      const customer = await api.createOrUpdateCustomer({
        name: name.trim(),
        mobile: cleanMobile,
        table_number: tableNumber || '1',
      });

      if (!customer) {
        throw new Error('Failed to create customer profile');
      }

      identifyCustomer(customer);

      if (customer.isExisting) {
        toast.success(`Welcome back, ${customer.name}! ⭐ ${customer.travel_tokens || 0} Travel Tokens available.`);
        // If customer has tokens, prompt redemption modal
        if (Number(customer.travel_tokens) > 0) {
          setIsRewardModalOpen(true);
        }
      } else {
        toast.success(`Welcome to Musafir Cafe, ${customer.name}! Earn Travel Tokens on this order.`);
      }
    } catch (err) {
      console.error('Customer capture error:', err);
      setErrorMsg('Failed to process check-in. Please try again or tap Skip.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    skipCustomerCapture();
    toast('Browsing menu as guest traveler', { icon: '☕' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="bg-[#FAF8F4] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-border flex flex-col relative animate-scale-in">
        
        {/* Decorative Top Banner */}
        <div className="bg-green p-6 text-white text-center relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-[#E0A96D]/20 rounded-full blur-xl pointer-events-none" />
          
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mx-auto flex items-center justify-center mb-3 shadow-inner">
            <Sparkles className="w-6 h-6 text-[#E0A96D] animate-pulse" />
          </div>

          <span className="text-[10px] uppercase font-bold tracking-widest text-[#E0A96D] block">
            {tableNumber ? `Table #${tableNumber} Check-In` : 'Musafir Rewards'}
          </span>
          <h2 className="font-serif text-2xl font-bold text-white mt-1">
            Welcome to Musafir
          </h2>
          <p className="text-xs text-white/80 font-light mt-1 max-w-xs mx-auto">
            Collect <strong className="text-[#E0A96D] font-bold">Travel Tokens</strong> on every order to redeem for complimentary coffee, artisan cookies &amp; treats!
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#1C1C1C]">
              Your Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Aarav Sharma"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                className="w-full px-4 py-3 rounded-xl border border-border bg-white text-xs font-medium text-[#1C1C1C] placeholder:text-muted focus:outline-none focus:border-green focus:ring-2 focus:ring-green/20 transition-all"
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#1C1C1C]">
              Mobile Number <span className="text-[10px] text-muted font-normal">(For Travel Tokens &amp; WhatsApp Bill)</span>
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 flex items-center space-x-1 text-xs font-bold text-muted border-r border-border pr-2.5">
                <span>🇮🇳</span>
                <span>+91</span>
              </div>
              <input
                type="tel"
                maxLength={10}
                placeholder="98765 43210"
                value={mobile}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setMobile(val);
                  if (errorMsg) setErrorMsg('');
                }}
                className="w-full pl-20 pr-4 py-3 rounded-xl border border-border bg-white text-xs font-mono font-bold text-[#1C1C1C] placeholder:text-muted focus:outline-none focus:border-green focus:ring-2 focus:ring-green/20 transition-all"
              />
            </div>
          </div>

          {/* Privacy Micro-Text */}
          <div className="flex items-center space-x-2 text-[10px] text-muted pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-green shrink-0" />
            <span>No spam ever. Used only for your digital bill &amp; rewards balance.</span>
          </div>

          {/* Action CTA Buttons */}
          <div className="pt-3 space-y-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-green hover:bg-green-dark text-white font-sans text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-md active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <span>Checking In...</span>
              ) : (
                <>
                  <UserCheck className="w-4 h-4 text-[#E0A96D]" />
                  <span>Start Ordering &amp; Earn Tokens</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSkip}
              className="w-full py-2.5 text-center text-xs font-bold text-muted hover:text-[#1C1C1C] transition-colors cursor-pointer"
            >
              Skip &amp; Continue as Guest
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

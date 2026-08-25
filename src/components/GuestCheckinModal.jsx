import React, { useState } from 'react';
import { User, Phone, Sparkles, Coffee, MapPin, CheckCircle2, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

export default function GuestCheckinModal({ isOpen, onClose }) {
  const { customerInfo, setCustomerInfo, tableNumber } = useCart();
  const [name, setName] = useState(customerInfo?.name || '');
  const [phone, setPhone] = useState(customerInfo?.phone || '');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 7) {
      toast.error('Please enter a valid mobile number');
      return;
    }

    setCustomerInfo({
      name: name.trim(),
      phone: phone.trim(),
    });

    toast.success(`Welcome to Table #${tableNumber}, ${name.trim()}! ☕`);
    onClose();
  };

  const handleSkip = () => {
    if (!customerInfo?.name) {
      setCustomerInfo({
        name: 'Musafir Guest',
        phone: '',
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-[#DF9B52]/30 flex flex-col animate-slide-up">
        
        {/* Top Cafe Branding Banner */}
        <div className="relative bg-[#1E130D] text-white p-6 pb-7 text-center">
          <div className="absolute top-4 right-4">
            <button
              onClick={handleSkip}
              className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#DF9B52] shadow-md bg-white p-0.5 mx-auto mb-3">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain" />
          </div>

          <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-[#C86D3B]/30 text-[#ECC980] border border-[#C86D3B]/40 text-xs font-semibold mb-1">
            <MapPin className="w-3.5 h-3.5 text-[#DF9B52]" />
            <span>Welcome to Table #{tableNumber}</span>
          </div>

          <h2 className="font-serif text-2xl font-bold text-white">Musafir Cafe</h2>
          <p className="text-xs text-white/70 mt-0.5">
            Please register your details for live order updates & digital billing.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1E130D] mb-1.5">
              Your Name *
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A6F68]" />
              <input
                type="text"
                placeholder="e.g. Tariq / Elena"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#DF9B52]/30 bg-[#FDF8F2] focus:outline-none focus:ring-2 focus:ring-[#C86D3B] text-[#2A2521]"
                required
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1E130D] mb-1.5">
              Mobile Number *
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A6F68]" />
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#DF9B52]/30 bg-[#FDF8F2] focus:outline-none focus:ring-2 focus:ring-[#C86D3B] text-[#2A2521]"
                required
              />
            </div>
            <p className="text-[10px] text-[#7A6F68] mt-1">
              Used to send your digital receipt & table order status.
            </p>
          </div>

          {/* Perks list */}
          <div className="bg-[#FDF8F2] p-3.5 rounded-2xl border border-[#DF9B52]/20 space-y-1.5 text-xs text-[#2C1810]">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2D8A4E] flex-shrink-0" />
              <span>Instant GPay & UPI payment with digital tax invoice</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2D8A4E] flex-shrink-0" />
              <span>Realtime Barista brewing & table delivery tracking</span>
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <button
              type="submit"
              className="w-full py-3 bg-[#1E130D] hover:bg-[#C86D3B] text-white rounded-2xl font-bold text-sm shadow-md transition-all active:scale-[0.99] flex items-center justify-center space-x-2"
            >
              <Coffee className="w-4 h-4 text-[#ECC980]" />
              <span>Enter Cafe Menu</span>
            </button>

            <button
              type="button"
              onClick={handleSkip}
              className="w-full py-2 text-xs font-semibold text-[#7A6F68] hover:text-[#1E130D] transition-colors text-center block"
            >
              Skip & Browse as Guest
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

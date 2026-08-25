import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Loader2, Sparkles, Smartphone, DollarSign, User, Phone } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { api } from '../lib/api';
import { whatsappApi } from '../lib/whatsappApi';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';

export default function Cart() {
  const navigate = useNavigate();
  const {
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartTotal,
    isCartOpen,
    setIsCartOpen,
    tableNumber,
    customerInfo,
    setCustomerInfo,
    cafeSettings,
  } = useCart();

  const [customerName, setCustomerName] = useState(customerInfo?.name || '');
  const [customerPhone, setCustomerPhone] = useState(customerInfo?.phone || '');
  const [paymentMethod, setPaymentMethod] = useState('GPay_UPI'); // 'GPay_UPI' | 'Cash'
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isCartOpen) return null;

  const tax = Number((cartTotal * 0.05).toFixed(2));
  const finalTotal = Number((cartTotal + tax).toFixed(2));

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    if (!tableNumber) {
      toast.error('Please select or specify your table number');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalName = customerName.trim() || customerInfo?.name || 'Musafir Guest';
      const finalPhone = customerPhone.trim() || customerInfo?.phone || '';

      // Update context
      if (finalName || finalPhone) {
        setCustomerInfo({ name: finalName, phone: finalPhone });
      }

      const orderPayload = {
        table_number: String(tableNumber),
        customer_name: finalName,
        customer_phone: finalPhone,
        payment_method: paymentMethod,
        special_instructions: specialInstructions.trim(),
        items: cart.map((item) => ({
          menu_item_id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          customization: item.customization,
        })),
      };

      const result = await api.createOrder(orderPayload);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#C86D3B', '#DF9B52', '#3D5A45', '#ECC980'],
        });
      } catch {}

      toast.success(
        `🎉 Order #${result.order_number || result.id?.slice(0, 5) || 'Confirmed'} placed successfully! The barista is preparing your order.`,
        { duration: 5000 }
      );
      clearCart();
      setIsCartOpen(false);
    } catch (err) {
      console.error('Order submission error:', err);
      toast.error(err.message || 'Failed to place order. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fade-in flex justify-end">
      {/* Drawer Container */}
      <div className="bg-[#FDF8F2] w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l border-[#DF9B52]/30 animate-slide-up">
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#DF9B52]/20 bg-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[#1E130D] text-white">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-[#1E130D]">Your Cafe Order</h2>
              <p className="text-xs text-[#7A6F68]">Table #{tableNumber || '1'}</p>
            </div>
          </div>

          <button
            onClick={() => setIsCartOpen(false)}
            className="p-2 rounded-full text-[#7A6F68] hover:text-[#1E130D] hover:bg-[#F4EDE4] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Item List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-16 h-16 rounded-full bg-[#F4EDE4] flex items-center justify-center text-[#DF9B52]">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="font-serif font-bold text-base text-[#1E130D]">Your cart is empty</h3>
              <p className="text-xs text-[#7A6F68] max-w-xs">
                Explore our single-origin coffees, blooming teas, and artisanal brunch dishes.
              </p>
            </div>
          ) : (
            <>
              {/* Order Items */}
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.cartKey}
                    className="p-3.5 rounded-2xl bg-white border border-[#DF9B52]/20 shadow-sm flex items-start justify-between gap-3"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm text-[#1E130D] leading-snug">{item.name}</h4>
                      {item.customization && (
                        <p className="text-xs text-[#C86D3B] mt-0.5 font-medium italic">
                          "{item.customization}"
                        </p>
                      )}
                      <p className="text-xs font-bold text-[#7A6F68] mt-1">
                        ${Number(item.price).toFixed(2)} each
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-2 bg-[#FDF8F2] px-2.5 py-1 rounded-xl border border-[#DF9B52]/30">
                      <button
                        onClick={() => updateQuantity(item.cartKey, -1)}
                        className="text-[#7A6F68] hover:text-[#1E130D]"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-bold text-xs w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.cartKey, 1)}
                        className="text-[#7A6F68] hover:text-[#1E130D]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Remove Item */}
                    <button
                      onClick={() => removeFromCart(item.cartKey)}
                      className="text-[#7A6F68] hover:text-red-600 p-1"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Guest Details & Payment Method Selection */}
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7A6F68] mb-1">
                      Guest Name
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-[#7A6F68] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Elena"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-[#DF9B52]/30 bg-white focus:outline-none focus:ring-1 focus:ring-[#C86D3B]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7A6F68] mb-1">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-[#7A6F68] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        placeholder="9876543210"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-[#DF9B52]/30 bg-white focus:outline-none focus:ring-1 focus:ring-[#C86D3B]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7A6F68] mb-1">
                    Special Table Instructions
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bring water glasses, serve dessert after coffee..."
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#DF9B52]/30 bg-white focus:outline-none focus:ring-1 focus:ring-[#C86D3B]"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer & Place Order Button */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-[#DF9B52]/20 bg-white">
            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-[#1E130D] hover:bg-[#C86D3B] text-white rounded-2xl font-bold text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Placing Order...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#ECC980]" />
                  <span>Place Order</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

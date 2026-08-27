import React, { useState, useEffect } from 'react';
import { Sparkles, Gift, X, Check, Lock, ArrowRight, Award } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { api } from '../lib/api';

export default function RewardRedemptionModal() {
  const {
    isRewardModalOpen,
    setIsRewardModalOpen,
    customerSession,
    addRewardItemToCart,
  } = useCart();

  const [rewardItems, setRewardItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isRewardModalOpen) {
      async function loadRewards() {
        try {
          setLoading(true);
          const data = await api.getRewardItems(true);
          if (data) setRewardItems(data);
        } catch (err) {
          console.warn('Could not load reward items:', err);
        } finally {
          setLoading(false);
        }
      }
      loadRewards();
    }
  }, [isRewardModalOpen]);

  if (!isRewardModalOpen) return null;

  const currentTokens = Number(customerSession.travel_tokens || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="bg-[#FAF8F4] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-border flex flex-col max-h-[90vh] relative animate-scale-in">
        
        {/* Header Strip */}
        <div className="bg-green p-6 text-white text-center relative overflow-hidden shrink-0">
          <button
            onClick={() => setIsRewardModalOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[#E0A96D] text-[11px] font-bold uppercase tracking-wider mb-2 border border-white/20">
            <Award className="w-3.5 h-3.5" />
            <span>Travel Tokens Loyalty Club</span>
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Welcome Back, {customerSession.name || 'Traveler'}!
          </h2>

          <div className="mt-3 p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 max-w-xs mx-auto flex items-center justify-center space-x-3 shadow-inner">
            <div className="w-10 h-10 rounded-xl bg-[#E0A96D] text-[#1C1C1C] flex items-center justify-center font-serif font-black text-xl shadow">
              ⭐
            </div>
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-white/75 tracking-wider block">Your Balance</span>
              <p className="font-serif text-xl font-bold text-white leading-tight">
                {currentTokens} <span className="text-xs font-normal text-[#E0A96D]">Travel Tokens</span>
              </p>
            </div>
          </div>

          <p className="text-xs text-white/90 font-light mt-3">
            You have earned complimentary rewards! Pick an artisan treat to add to your order for <strong className="text-[#E0A96D] font-bold">₹0 (FREE)</strong>.
          </p>
        </div>

        {/* Reward Catalog Items (Scrollable) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-3.5 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1C1C1C]">
              Available Rewards
            </span>
            <span className="text-[11px] text-muted">
              {rewardItems.filter((r) => currentTokens >= Number(r.points_cost)).length} Redeemable Now
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-muted space-y-2 text-xs">
              <div className="w-6 h-6 border-2 border-green border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Loading available rewards...</p>
            </div>
          ) : rewardItems.length === 0 ? (
            <div className="py-10 text-center text-muted text-xs">
              No reward items currently available. Check back soon!
            </div>
          ) : (
            rewardItems.map((item) => {
              const cost = Number(item.points_cost || 0);
              const canAfford = currentTokens >= cost;
              const shortDeficit = cost - currentTokens;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-3.5 ${
                    canAfford
                      ? 'bg-white border-green/30 hover:border-green hover:shadow-md'
                      : 'bg-white/50 border-border opacity-70'
                  }`}
                >
                  <img
                    src={item.image_url || 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=400&q=80'}
                    alt={item.name}
                    className="w-16 h-16 rounded-xl object-cover border border-border shrink-0"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=400&q=80';
                    }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-serif font-bold text-sm text-[#1C1C1C] truncate">
                        {item.name}
                      </h4>
                    </div>
                    <p className="text-[11px] text-muted line-clamp-1 mt-0.5">
                      {item.description || 'Specialty handcrafted reward'}
                    </p>
                    <div className="mt-1 flex items-center space-x-1.5">
                      <span className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md font-mono">
                        ⭐ {cost} Tokens
                      </span>
                      <span className="text-[10px] text-green font-bold uppercase tracking-wider">
                        ₹0 (FREE)
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {canAfford ? (
                      <button
                        onClick={() => addRewardItemToCart(item)}
                        className="py-2 px-3.5 rounded-xl bg-green hover:bg-green-dark text-white font-sans text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                      >
                        <Gift className="w-3.5 h-3.5 text-[#E0A96D]" />
                        <span>Redeem</span>
                      </button>
                    ) : (
                      <div className="text-right">
                        <span className="inline-flex items-center space-x-1 py-1.5 px-2.5 rounded-xl bg-cream border border-border text-muted text-[10px] font-bold">
                          <Lock className="w-3 h-3" />
                          <span>Need {shortDeficit} more</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Dismiss CTA */}
        <div className="p-4 bg-white border-t border-border flex items-center justify-between shrink-0">
          <button
            onClick={() => setIsRewardModalOpen(false)}
            className="w-full py-3 rounded-xl bg-cream hover:bg-border text-[#1C1C1C] text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <span>No thanks, explore regular menu</span>
            <ArrowRight className="w-3.5 h-3.5 text-muted" />
          </button>
        </div>

      </div>
    </div>
  );
}

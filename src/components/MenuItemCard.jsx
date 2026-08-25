import React, { useState } from 'react';
import { Plus, Sparkles, Clock, Check } from 'lucide-react';
import ItemCustomizeModal from './ItemCustomizeModal';
import { useCart } from '../context/CartContext';

export default function MenuItemCard({ item }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddedRecently, setIsAddedRecently] = useState(false);
  const { addToCart } = useCart();

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    addToCart(item, '', 1);
    setIsAddedRecently(true);
    setTimeout(() => setIsAddedRecently(false), 1200);
  };

  const isSoldOut = !item.is_available;

  return (
    <>
      <div
        onClick={() => !isSoldOut && setIsModalOpen(true)}
        className={`group bg-white rounded-3xl overflow-hidden border border-[#DF9B52]/20 shadow-cafe-soft hover:shadow-cafe-card transition-all duration-300 flex flex-col justify-between cursor-pointer ${
          isSoldOut ? 'opacity-60 grayscale-[40%]' : 'hover:-translate-y-1'
        }`}
      >
        {/* Top Image Container */}
        <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-[#F4EDE4]">
          <img
            src={item.photo_url || '/logo.jpg'}
            alt={item.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Sold out overlay or badge */}
          {isSoldOut ? (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="px-3 py-1 bg-red-600/90 text-white rounded-full text-xs font-bold uppercase tracking-wider shadow">
                Sold Out
              </span>
            </div>
          ) : (
            <>
              {/* Special Pill */}
              {item.is_special && (
                <div className="absolute top-3 left-3 bg-[#C86D3B]/95 text-white px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide flex items-center space-x-1 shadow-md backdrop-blur-sm">
                  <Sparkles className="w-3 h-3 text-[#ECC980]" />
                  <span>Special</span>
                </div>
              )}

              {/* Prep time */}
              <div className="absolute bottom-3 right-3 bg-black/60 text-white px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center space-x-1 backdrop-blur-sm">
                <Clock className="w-3 h-3 text-[#ECC980]" />
                <span>{item.prep_time_minutes || 8}m</span>
              </div>
            </>
          )}
        </div>

        {/* Content Details */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
          <div>
            {/* Dietary Tags */}
            {item.dietary_tags && item.dietary_tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {item.dietary_tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#F4EDE4] text-[#3D5A45] border border-[#3D5A45]/15"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <h3 className="font-serif text-base sm:text-lg font-bold text-[#1E130D] group-hover:text-[#C86D3B] transition-colors leading-snug line-clamp-1">
              {item.name}
            </h3>

            <p className="text-xs text-[#7A6F68] mt-1.5 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          </div>

          {/* Bottom Bar: Price & Add Button */}
          <div className="mt-4 pt-3 border-t border-[#F4EDE4] flex items-center justify-between">
            <span className="font-bold text-base sm:text-lg text-[#1E130D]">
              ${Number(item.price).toFixed(2)}
            </span>

            {!isSoldOut && (
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={handleQuickAdd}
                  className={`p-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1 ${
                    isAddedRecently
                      ? 'bg-[#2D8A4E] text-white'
                      : 'bg-[#FDF8F2] text-[#1E130D] hover:bg-[#C86D3B] hover:text-white border border-[#DF9B52]/30'
                  }`}
                  title="Quick Add 1 item"
                >
                  {isAddedRecently ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Add</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <ItemCustomizeModal
          item={item}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}

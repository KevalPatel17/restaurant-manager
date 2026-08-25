import React, { useState } from 'react';
import { X, Plus, Minus, Sparkles, Clock } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function ItemCustomizeModal({ item, onClose }) {
  const { addToCart, setIsCartOpen } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [selectedMilk, setSelectedMilk] = useState('Default (Standard Milk)');
  const [tempSweetness, setTempSweetness] = useState('Standard Prep');
  const [customNote, setCustomNote] = useState('');

  if (!item) return null;

  const isBeverage = item.category_id === '11111111-1111-1111-1111-111111111101' ||
    item.category_id === '11111111-1111-1111-1111-111111111102' ||
    item.name.toLowerCase().includes('latte') ||
    item.name.toLowerCase().includes('brew') ||
    item.name.toLowerCase().includes('tea') ||
    item.name.toLowerCase().includes('matcha');

  const milkOptions = [
    'Default (Whole Milk)',
    'Oat Milk (+$0.50)',
    'Almond Milk (+$0.50)',
    'Skim Milk',
    'Black / No Milk',
  ];

  const prepOptions = [
    'Standard Prep',
    'Extra Hot 🔥',
    'Iced with Cold Foam 🧊',
    'Less Sugar (50%)',
    'Sugar Free',
  ];

  const handleAddToCart = () => {
    const notesArray = [];
    if (isBeverage && selectedMilk && !selectedMilk.startsWith('Default')) {
      notesArray.push(selectedMilk);
    }
    if (isBeverage && tempSweetness && !tempSweetness.startsWith('Standard')) {
      notesArray.push(tempSweetness);
    }
    if (customNote.trim()) {
      notesArray.push(customNote.trim());
    }

    const customizationString = notesArray.join(', ');

    // Milk surcharge if selected
    const extraPrice = isBeverage && (selectedMilk.includes('Oat') || selectedMilk.includes('Almond')) ? 0.5 : 0;
    const finalItem = {
      ...item,
      price: Number((item.price + extraPrice).toFixed(2)),
    };

    addToCart(finalItem, customizationString, quantity);
    onClose();
    setIsCartOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-[#DF9B52]/30 flex flex-col max-h-[90vh]">
        
        {/* Header Image */}
        <div className="relative h-48 sm:h-56 w-full bg-[#1E130D]">
          <img
            src={item.photo_url || '/logo.jpg'}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-4 right-4 text-white">
            {item.is_special && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#C86D3B] text-white mb-1.5 shadow-sm">
                <Sparkles className="w-3 h-3" />
                <span>Musafir Special</span>
              </span>
            )}
            <h3 className="font-serif text-xl sm:text-2xl font-bold leading-tight">{item.name}</h3>
            <p className="text-white/90 font-semibold text-lg sm:text-xl text-[#ECC980]">
              ${Number(item.price).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-[#2A2521]">
          <p className="text-sm text-[#7A6F68] leading-relaxed">{item.description}</p>

          <div className="flex items-center space-x-2 text-xs text-[#7A6F68]">
            <Clock className="w-4 h-4 text-[#C86D3B]" />
            <span>Estimated prep time: {item.prep_time_minutes || 8} mins</span>
          </div>

          {/* Beverage Milk Options */}
          {isBeverage && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1E130D] mb-2">
                Choice of Milk
              </label>
              <div className="grid grid-cols-2 gap-2">
                {milkOptions.map((milk) => (
                  <button
                    key={milk}
                    type="button"
                    onClick={() => setSelectedMilk(milk)}
                    className={`text-xs font-medium px-3 py-2.5 rounded-xl border text-left transition-all ${
                      selectedMilk === milk
                        ? 'border-[#C86D3B] bg-[#C86D3B]/10 text-[#1E130D] font-semibold ring-1 ring-[#C86D3B]'
                        : 'border-[#F4EDE4] bg-[#FDF8F2] text-[#7A6F68] hover:border-[#DF9B52]'
                    }`}
                  >
                    {milk}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Temperature & Sweetness */}
          {isBeverage && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1E130D] mb-2">
                Prep & Sweetness
              </label>
              <div className="grid grid-cols-2 gap-2">
                {prepOptions.map((prep) => (
                  <button
                    key={prep}
                    type="button"
                    onClick={() => setTempSweetness(prep)}
                    className={`text-xs font-medium px-3 py-2.5 rounded-xl border text-left transition-all ${
                      tempSweetness === prep
                        ? 'border-[#C86D3B] bg-[#C86D3B]/10 text-[#1E130D] font-semibold ring-1 ring-[#C86D3B]'
                        : 'border-[#F4EDE4] bg-[#FDF8F2] text-[#7A6F68] hover:border-[#DF9B52]'
                    }`}
                  >
                    {prep}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Note */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1E130D] mb-2">
              Note for Barista / Chef
            </label>
            <input
              type="text"
              placeholder="e.g. Extra hot, sourdough well toasted, sauce on the side..."
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#DF9B52]/30 bg-[#FDF8F2] focus:outline-none focus:ring-2 focus:ring-[#C86D3B] text-[#2A2521]"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#F4EDE4] bg-[#FDF8F2] flex items-center justify-between gap-4">
          
          {/* Quantity Counter */}
          <div className="flex items-center space-x-3 bg-white px-3 py-1.5 rounded-2xl border border-[#DF9B52]/30 shadow-inner">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="p-1 rounded-full text-[#7A6F68] hover:text-[#1E130D] hover:bg-[#F4EDE4] transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-bold text-sm w-4 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="p-1 rounded-full text-[#7A6F68] hover:text-[#1E130D] hover:bg-[#F4EDE4] transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            className="flex-1 bg-[#1E130D] hover:bg-[#C86D3B] text-white py-3 px-5 rounded-2xl font-bold text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
          >
            <span>Add to Order</span>
            <span>•</span>
            <span>${(Number(item.price) * quantity).toFixed(2)}</span>
          </button>
        </div>

      </div>
    </div>
  );
}

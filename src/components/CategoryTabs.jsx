import React from 'react';
import { Coffee, Leaf, Utensils, Sandwich, Cake, Sparkles, Layers } from 'lucide-react';

const iconMap = {
  Coffee: Coffee,
  Leaf: Leaf,
  Utensils: Utensils,
  Sandwich: Sandwich,
  Cake: Cake,
  Sparkles: Sparkles,
};

export default function CategoryTabs({ categories, selectedCategory, onSelectCategory, counts = {} }) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-3 px-4 sm:px-0">
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-max">
        
        {/* All Items Pill */}
        <button
          onClick={() => onSelectCategory('all')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm ${
            selectedCategory === 'all'
              ? 'bg-[#1E130D] text-white shadow-cafe-glow ring-2 ring-[#DF9B52]'
              : 'bg-white text-[#7A6F68] hover:text-[#1E130D] hover:bg-[#F4EDE4] border border-[#DF9B52]/20'
          }`}
        >
          <Layers className="w-4 h-4 text-[#DF9B52]" />
          <span>All Menu</span>
          {counts.all !== undefined && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                selectedCategory === 'all'
                  ? 'bg-[#C86D3B] text-white'
                  : 'bg-[#F4EDE4] text-[#7A6F68]'
              }`}
            >
              {counts.all}
            </span>
          )}
        </button>

        {/* Dynamic Categories */}
        {categories.map((cat) => {
          const IconComponent = iconMap[cat.icon_name] || Coffee;
          const isSelected = selectedCategory === cat.id;
          const count = counts[cat.id];

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm ${
                isSelected
                  ? 'bg-[#1E130D] text-white shadow-cafe-glow ring-2 ring-[#DF9B52]'
                  : 'bg-white text-[#7A6F68] hover:text-[#1E130D] hover:bg-[#F4EDE4] border border-[#DF9B52]/20'
              }`}
            >
              <IconComponent
                className={`w-4 h-4 ${isSelected ? 'text-[#DF9B52]' : 'text-[#C86D3B]'}`}
              />
              <span>{cat.name}</span>
              {count !== undefined && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    isSelected
                      ? 'bg-[#C86D3B] text-white'
                      : 'bg-[#F4EDE4] text-[#7A6F68]'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

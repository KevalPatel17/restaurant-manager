import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('musafir_cafe_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [tableNumber, setTableNumber] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('table') || null;
  });

  const [customerInfo, setCustomerInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('musafir_customer_info');
      return saved ? JSON.parse(saved) : { name: '', phone: '' };
    } catch {
      return { name: '', phone: '' };
    }
  });

  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);

  const [cafeSettings, setCafeSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('musafir_cafe_settings');
      return saved ? JSON.parse(saved) : {
        cafe_name: 'Musafir Cafe & Roasters',
        cafe_address: 'Sanctuary Lane, Old Town Arts District',
        cafe_gst: '27AABCU9603R1ZM',
        cafe_phone: '+91 9537533472',
        upi_id: 'musafir.cafe@okaxis',
        gpay_qr_url: '/gpay_scanner.jpg',
        auto_send_whatsapp_bill: true,
        whatsapp_provider: 'direct',
        waha_api_url: 'http://localhost:3000',
        waha_session: 'default',
        waha_api_key: 'musafir123',
      };
    } catch {
      return {
        cafe_name: 'Musafir Cafe & Roasters',
        cafe_address: 'Sanctuary Lane, Old Town Arts District',
        cafe_gst: '27AABCU9603R1ZM',
        cafe_phone: '+91 9537533472',
        upi_id: 'musafir.cafe@okaxis',
        gpay_qr_url: '/gpay_scanner.jpg',
        auto_send_whatsapp_bill: true,
        whatsapp_provider: 'direct',
        waha_api_url: 'http://localhost:3000',
        waha_session: 'default',
        waha_api_key: 'musafir123',
      };
    }
  });

  const [tablesList, setTablesList] = useState([
    { table_number: '1', table_label: 'Cozy Window Seat 1' },
    { table_number: '2', table_label: 'Cozy Window Seat 2' },
    { table_number: '3', table_label: 'Garden Patio 3' },
    { table_number: '4', table_label: 'Garden Patio 4' },
    { table_number: '5', table_label: 'Traveler High Table 5' },
    { table_number: '6', table_label: 'Terrace Lounge 6' },
  ]);

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    async function loadTables() {
      try {
        const tables = await api.getTables();
        if (tables && tables.length > 0) {
          setTablesList(tables);
        }
      } catch (err) {
        console.warn('Could not load tables list, using defaults:', err);
      }
    }
    loadTables();
  }, []);

  useEffect(() => {
    localStorage.setItem('musafir_cafe_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (tableNumber) {
      localStorage.setItem('musafir_table_number', tableNumber);
    } else {
      localStorage.removeItem('musafir_table_number');
    }
  }, [tableNumber]);

  useEffect(() => {
    localStorage.setItem('musafir_customer_info', JSON.stringify(customerInfo));
  }, [customerInfo]);

  useEffect(() => {
    localStorage.setItem('musafir_cafe_settings', JSON.stringify(cafeSettings));
  }, [cafeSettings]);

  const updateCafeSettings = (newSettings) => {
    setCafeSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const updateCustomerInfo = (info) => {
    setCustomerInfo(info);
    api.saveCustomerCheckin({
      name: info.name,
      phone: info.phone,
      table_number: tableNumber,
    }).catch(() => {});
  };

  const getCartKey = (item, customization = '') => `${item.id}_${customization.trim()}`;

  const addToCart = (item, customization = '', quantity = 1) => {
    setCart((prev) => {
      const key = getCartKey(item, customization);
      const existingIndex = prev.findIndex((i) => i.cartKey === key);

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }

      return [
        ...prev,
        {
          ...item,
          cartKey: key,
          customization,
          quantity,
        },
      ];
    });
  };

  const updateQuantity = (cartKey, delta) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.cartKey === cartKey) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const removeFromCart = (cartKey) => {
    setCart((prev) => prev.filter((item) => item.cartKey !== cartKey));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartCount,
        cartTotal,
        isCartOpen,
        setIsCartOpen,
        tableNumber,
        setTableNumber,
        tablesList,
        customerInfo,
        setCustomerInfo: updateCustomerInfo,
        isCheckinModalOpen,
        setIsCheckinModalOpen,
        cafeSettings,
        updateCafeSettings,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

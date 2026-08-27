import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

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

  // Customer Loyalty Session: { name, mobile, phone, travel_tokens, isIdentified, isGuest }
  const [customerSession, setCustomerSession] = useState(() => {
    try {
      const saved = localStorage.getItem('musafir_customer_session');
      return saved
        ? JSON.parse(saved)
        : {
            name: '',
            mobile: '',
            travel_tokens: 0,
            isIdentified: false,
            isGuest: false,
          };
    } catch {
      return {
        name: '',
        mobile: '',
        travel_tokens: 0,
        isIdentified: false,
        isGuest: false,
      };
    }
  });

  // Modal Visibility States
  const [isCustomerCaptureOpen, setIsCustomerCaptureOpen] = useState(false);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);

  // Dynamic Token Earning Rules
  const [tokenRules, setTokenRules] = useState([]);

  const [cafeSettings, setCafeSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('musafir_cafe_settings');
      return saved ? JSON.parse(saved) : {
        cafe_name: 'Musafir Cafe & Roasters',
        cafe_address: 'Sanctuary Lane, Old Town Arts District',
        cafe_gst: '27AABCU9603R1ZM',
        cafe_phone: '+91 7555417487',
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
        cafe_phone: '+91 7555417487',
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
    async function loadInitialData() {
      try {
        const [tables, rules] = await Promise.all([
          api.getTables().catch(() => null),
          api.getTokenRules().catch(() => null),
        ]);
        if (tables && tables.length > 0) setTablesList(tables);
        if (rules && rules.length > 0) setTokenRules(rules);
      } catch (err) {
        console.warn('Could not load tables or token rules:', err);
      }
    }
    loadInitialData();
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
    localStorage.setItem('musafir_customer_session', JSON.stringify(customerSession));
  }, [customerSession]);

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

  // ─── LOYALTY SESSION METHODS ───
  const identifyCustomer = (data) => {
    const session = {
      name: data.name || 'Musafir Guest',
      mobile: data.mobile || data.phone || '',
      phone: data.mobile || data.phone || '',
      travel_tokens: Number(data.travel_tokens || 0),
      isIdentified: true,
      isGuest: false,
    };
    setCustomerSession(session);
    setCustomerInfo({ name: session.name, phone: session.mobile });
    setIsCustomerCaptureOpen(false);
  };

  const skipCustomerCapture = () => {
    const session = {
      name: 'Guest',
      mobile: '',
      phone: '',
      travel_tokens: 0,
      isIdentified: false,
      isGuest: true,
    };
    setCustomerSession(session);
    setIsCustomerCaptureOpen(false);
  };

  const deductTokens = async (amount) => {
    if (!customerSession.mobile) return;
    const newTokens = Math.max(0, (customerSession.travel_tokens || 0) - amount);
    setCustomerSession((prev) => ({ ...prev, travel_tokens: newTokens }));
    try {
      await api.updateCustomerTokens(customerSession.mobile, -amount);
    } catch (err) {
      console.warn('Deduct tokens sync notice:', err);
    }
  };

  const awardOrderTokens = async (orderAmount, mobileOverride = null) => {
    const targetMobile = mobileOverride || customerSession.mobile || customerInfo?.phone;
    if (!targetMobile) return 0;

    const cleanPhone = String(targetMobile).trim().replace(/\D/g, '').slice(-10);
    if (!cleanPhone) return 0;
    
    // Sort rules by min_order_amount descending to find the highest match
    const sorted = [...(tokenRules || [])].sort(
      (a, b) => Number(b.min_order_amount) - Number(a.min_order_amount)
    );
    const matchedRule = sorted.find((r) => Number(orderAmount) >= Number(r.min_order_amount));
    const tokensEarned = matchedRule ? Number(matchedRule.tokens_awarded) : 0;

    if (tokensEarned > 0) {
      try {
        const updatedRecord = await api.updateCustomerTokens(cleanPhone, tokensEarned);
        const newTokens = updatedRecord ? Number(updatedRecord.travel_tokens) : (customerSession.travel_tokens || 0) + tokensEarned;
        setCustomerSession((prev) => ({
          ...prev,
          name: prev.name && prev.name !== 'Musafir Guest' && prev.name !== 'Guest' ? prev.name : (updatedRecord?.name || 'Musafir Guest'),
          isIdentified: true,
          mobile: cleanPhone,
          phone: cleanPhone,
          travel_tokens: newTokens,
        }));
      } catch (err) {
        console.warn('Award tokens sync notice:', err);
      }
    }
    return tokensEarned;
  };

  // ─── CART MANAGEMENT ───
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

  const addRewardItemToCart = (rewardItem) => {
    // Check if customer has enough tokens
    const cost = Number(rewardItem.points_cost || 0);
    if ((customerSession.travel_tokens || 0) < cost) {
      toast.error(`You need ${cost} Travel Tokens for this reward!`);
      return false;
    }

    // Check if already in cart
    const existing = cart.find((i) => i.isReward && i.id === rewardItem.id);
    if (existing) {
      toast.error('This reward item is already in your order tray!');
      return false;
    }

    const rewardCartItem = {
      id: rewardItem.id,
      name: rewardItem.name,
      price: 0,
      original_price: Number(rewardItem.original_price || rewardItem.price || 150),
      isReward: true,
      is_reward_redemption: true,
      points_cost: cost,
      description: rewardItem.description || 'Exclusive Travel Token Reward',
      photo_url: rewardItem.image_url || 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=400&q=80',
      quantity: 1,
      cartKey: `reward_${rewardItem.id}`,
    };

    setCart((prev) => [...prev, rewardCartItem]);
    deductTokens(cost);
    toast.success(`🎁 "${rewardItem.name}" added as a FREE reward!`);
    setIsRewardModalOpen(false);
    return true;
  };

  const updateQuantity = (cartKey, delta) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.cartKey === cartKey) {
            // Reward items cannot have quantity > 1
            if (item.isReward && delta > 0) {
              toast.error('Reward items are limited to 1 per redemption.');
              return item;
            }
            const newQty = item.quantity + delta;
            if (newQty <= 0 && item.isReward) {
              // Refund tokens if reward item is removed
              const refundCost = Number(item.points_cost || 0);
              if (refundCost > 0 && customerSession.mobile) {
                setCustomerSession((s) => ({
                  ...s,
                  travel_tokens: (s.travel_tokens || 0) + refundCost,
                }));
                api.updateCustomerTokens(customerSession.mobile, refundCost).catch(() => {});
                toast('Refunded ' + refundCost + ' Travel Tokens');
              }
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const removeFromCart = (cartKey) => {
    setCart((prev) => {
      const itemToRemove = prev.find((i) => i.cartKey === cartKey);
      if (itemToRemove?.isReward) {
        const refundCost = Number(itemToRemove.points_cost || 0);
        if (refundCost > 0 && customerSession.mobile) {
          setCustomerSession((s) => ({
            ...s,
            travel_tokens: (s.travel_tokens || 0) + refundCost,
          }));
          api.updateCustomerTokens(customerSession.mobile, refundCost).catch(() => {});
          toast('Refunded ' + refundCost + ' Travel Tokens');
        }
      }
      return prev.filter((item) => item.cartKey !== cartKey);
    });
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
        addRewardItemToCart,
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
        customerSession,
        identifyCustomer,
        skipCustomerCapture,
        isCustomerCaptureOpen,
        setIsCustomerCaptureOpen,
        isRewardModalOpen,
        setIsRewardModalOpen,
        tokenRules,
        setTokenRules,
        awardOrderTokens,
        deductTokens,
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


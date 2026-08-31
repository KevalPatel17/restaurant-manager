import React, { useState, useEffect } from 'react'
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  UtensilsCrossed,
  Sparkles,
  Phone,
  User,
  FileText,
  Clock,
  Bike,
  MapPin,
  Gift,
  Award,
} from 'lucide-react'
import { useCart } from '../context/CartContext'
import { api } from '../lib/api'
import confetti from 'canvas-confetti'
import toast from 'react-hot-toast'

export default function CartDrawer() {
  const {
    cart,
    cartTotal,
    cartCount,
    updateQuantity,
    removeFromCart,
    clearCart,
    isCartOpen,
    setIsCartOpen,
    tableNumber,
    setTableNumber,
    tablesList,
    customerInfo,
    setCustomerInfo,
    customerSession,
    tokenRules,
    awardOrderTokens,
  } = useCart()

  // Order Type: 'dine_in' (Eat In) | 'takeaway' (Pickup) | 'delivery' (Home Delivery)
  const [orderType, setOrderType] = useState(() => (tableNumber ? 'dine_in' : 'delivery'))
  const [guestName, setGuestName] = useState(customerSession?.name || customerInfo?.name || '')
  const [guestPhone, setGuestPhone] = useState(customerSession?.mobile || customerInfo?.phone || '')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [specialNotes, setSpecialNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [completedOrder, setCompletedOrder] = useState(null)

  // Sync default order type when tableNumber changes
  useEffect(() => {
    if (tableNumber && orderType === 'delivery') {
      setOrderType('dine_in')
    }
  }, [tableNumber])

  // Sync customer session values if identified
  useEffect(() => {
    if (customerSession?.isIdentified) {
      if (customerSession.name && !guestName) setGuestName(customerSession.name)
      if (customerSession.mobile && !guestPhone) setGuestPhone(customerSession.mobile)
    }
  }, [customerSession])

  if (!isCartOpen) return null

  // Calculate tokens to be earned on this order
  const sortedRules = [...(tokenRules || [])].sort(
    (a, b) => Number(b.min_order_amount) - Number(a.min_order_amount)
  )
  const matchedRule = sortedRules.find((r) => Number(cartTotal) >= Number(r.min_order_amount))
  const tokensToEarn = matchedRule ? Number(matchedRule.tokens_awarded) : 0

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    if (cart.length === 0) {
      toast.error('Your order is empty. Please add items from the menu!')
      return
    }

    if (orderType === 'delivery' && !deliveryAddress.trim()) {
      toast.error('Please enter your delivery address!')
      return
    }

    setIsSubmitting(true)
    try {
      const activeMobile = customerSession.isIdentified
        ? customerSession.mobile
        : guestPhone.trim() || null
      const activeName = customerSession.isIdentified
        ? customerSession.name
        : guestName.trim() || 'Musafir Online Customer'

      // Save customer info if provided
      if (activeName || activeMobile) {
        setCustomerInfo({ name: activeName, phone: activeMobile })
      }

      let orderTableLabel = 'Online Delivery'
      if (orderType === 'takeaway') {
        orderTableLabel = 'Online Pickup'
      } else if (orderType === 'dine_in') {
        orderTableLabel = tableNumber || '1'
      }

      let instructionsPrefix = '🛵 [ONLINE HOME DELIVERY]'
      if (orderType === 'takeaway') {
        instructionsPrefix = '🛍️ [ONLINE STORE PICKUP]'
      } else if (orderType === 'dine_in') {
        instructionsPrefix = `🍽️ [DINE-IN TABLE #${tableNumber || '1'}]`
      }

      const orderPayload = {
        table_number: orderTableLabel,
        customer_name: activeName,
        customer_phone: activeMobile,
        customer_mobile: activeMobile,
        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          original_price: item.original_price || item.price || 0,
          is_reward_redemption: Boolean(item.isReward || item.is_reward_redemption),
          quantity: item.quantity,
          customization: item.customization || '',
        })),
        special_instructions: [
          instructionsPrefix,
          orderType === 'delivery' ? `📍 Address: ${deliveryAddress.trim()}` : null,
          specialNotes.trim() ? `📝 Note: ${specialNotes.trim()}` : null,
        ]
          .filter(Boolean)
          .join(' | '),
        payment_method: 'Online / Cash on Delivery',
        status: 'pending',
      }

      const newOrder = await api.createOrder(orderPayload)

      // Award Travel Tokens to the active customer phone
      const earned = await awardOrderTokens(cartTotal, activeMobile)

      // Fire confetti celebration 🎉
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2D4A3E', '#D4AF37', '#FAF8F4', '#1C1C1C'],
      })

      if (orderType === 'delivery') {
        toast.success('Online Delivery order placed successfully!')
      } else if (orderType === 'takeaway') {
        toast.success('Pickup order placed successfully!')
      } else {
        toast.success(`Order placed for Table #${tableNumber || '1'}!`)
      }

      if (earned > 0) {
        toast.success(`⭐ +${earned} Travel Tokens credited to your balance!`, {
          duration: 5000,
        })
      }

      setCompletedOrder(
        newOrder || {
          ...orderPayload,
          order_number: Math.floor(1000 + Math.random() * 9000),
          deliveryAddress,
          orderType,
        }
      )
      clearCart()
    } catch (err) {
      console.error('Error placing order:', err)
      toast.error(err.message || 'Failed to place order. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setIsCartOpen(false)
    setCompletedOrder(null)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-8">
        <div className="w-screen max-w-full sm:max-w-md bg-[#FAF8F4] flex flex-col shadow-2xl border-l border-border animate-slide-left">
          
          {/* ─── SUCCESS ORDER CONFIRMATION VIEW ─── */}
          {completedOrder ? (
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-5 bg-white">
              <div className="w-16 h-16 rounded-full bg-green/10 text-green flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] uppercase font-bold tracking-widest text-green">
                  Order Confirmed
                </span>
                <h2 className="font-serif text-3xl font-bold text-[#1C1C1C]">
                  Order #{completedOrder.order_number || '1042'}
                </h2>
                <p className="text-xs text-muted max-w-xs mx-auto">
                  Sent directly to the barista kitchen display. Fresh preparation is underway!
                </p>
              </div>

              <div className="w-full bg-[#FAF8F4] p-4 rounded-2xl border border-border text-left space-y-2.5 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-border">
                  <span className="text-muted">Order Mode:</span>
                  <span className="font-bold text-[#1C1C1C]">
                    {orderType === 'delivery'
                      ? '🛵 Online Home Delivery'
                      : orderType === 'takeaway'
                      ? '🛍️ Cafe Pickup'
                      : `🍽️ Dine-in (Table #${tableNumber || '1'})`}
                  </span>
                </div>

                {orderType === 'delivery' && deliveryAddress && (
                  <div className="pb-2 border-b border-border">
                    <span className="text-muted block text-[10px]">Delivery Address:</span>
                    <span className="font-bold text-[#1C1C1C] text-[11px] line-clamp-2">
                      {deliveryAddress}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center pb-2 border-b border-border">
                  <span className="text-muted">Estimated Time:</span>
                  <span className="font-bold text-green flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{orderType === 'delivery' ? '25 – 35 mins' : '8 – 12 mins'}</span>
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-muted">Total Amount:</span>
                  <span className="font-serif font-bold text-base text-[#1C1C1C]">
                    ₹{Number(completedOrder.total || cartTotal).toFixed(2)}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-muted leading-relaxed">
                {orderType === 'delivery'
                  ? 'Our delivery partner will bring your fresh order directly to your door.'
                  : orderType === 'takeaway'
                  ? 'Please collect your order at the pickup counter when ready.'
                  : `Sit back and relax! We will deliver your freshly made items directly to Table #${tableNumber || '1'}.`}
              </p>

              <a
                href={`/my-order/${completedOrder.id || completedOrder.order_number || ''}`}
                onClick={handleClose}
                className="w-full py-3.5 rounded-full bg-green hover:bg-green-dark text-white font-sans text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-[0.98] flex items-center justify-center space-x-2"
              >
                <span>📡 Track Your Order Live</span>
              </a>

              <button
                onClick={handleClose}
                className="w-full py-3 rounded-full bg-[#1C1C1C] hover:bg-black text-white font-sans text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-[0.98]"
              >
                Back to Menu
              </button>
            </div>
          ) : (
            /* ─── ACTIVE CART VIEW ─── */
            <>
              {/* Header */}
              <div className="p-5 bg-white border-b border-border flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-green/10 rounded-xl text-green">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-serif font-bold text-lg text-[#1C1C1C]">
                      {tableNumber ? `Table #${tableNumber} Order` : 'Your Online Order'}
                    </h2>
                    <span className="text-[11px] text-muted block">
                      {cartCount} {cartCount === 1 ? 'item' : 'items'} selected
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-xl bg-cream hover:bg-border text-muted hover:text-[#1C1C1C] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                
                {/* 1. ORDER TYPE SELECTOR */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase text-[#1C1C1C] tracking-wider">
                    Select Order Mode
                  </label>

                  {tableNumber ? (
                    /* Customer scanned QR code on table */
                    <div className="grid grid-cols-2 gap-2 p-1 bg-white rounded-2xl border border-border">
                      <button
                        type="button"
                        onClick={() => setOrderType('dine_in')}
                        className={`py-2.5 px-3 rounded-xl font-sans text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                          orderType === 'dine_in'
                            ? 'bg-green text-white shadow-sm'
                            : 'text-muted hover:text-[#1C1C1C]'
                        }`}
                      >
                        <UtensilsCrossed className="w-3.5 h-3.5" />
                        <span>🍽️ Eat In (Table #{tableNumber})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setOrderType('takeaway')}
                        className={`py-2.5 px-3 rounded-xl font-sans text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                          orderType === 'takeaway'
                            ? 'bg-green text-white shadow-sm'
                            : 'text-muted hover:text-[#1C1C1C]'
                        }`}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>🛍️ Take Away</span>
                      </button>
                    </div>
                  ) : (
                    /* Customer is on normal /menu online ordering */
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-white rounded-2xl border border-border">
                      <button
                        type="button"
                        onClick={() => setOrderType('delivery')}
                        className={`py-2.5 px-2 rounded-xl font-sans text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                          orderType === 'delivery'
                            ? 'bg-green text-white shadow-sm'
                            : 'text-muted hover:text-[#1C1C1C]'
                        }`}
                      >
                        <Bike className="w-4 h-4" />
                        <span>🛵 Delivery</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setOrderType('takeaway')}
                        className={`py-2.5 px-2 rounded-xl font-sans text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                          orderType === 'takeaway'
                            ? 'bg-green text-white shadow-sm'
                            : 'text-muted hover:text-[#1C1C1C]'
                        }`}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>🛍️ Pickup</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setOrderType('dine_in')}
                        className={`py-2.5 px-2 rounded-xl font-sans text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                          orderType === 'dine_in'
                            ? 'bg-green text-white shadow-sm'
                            : 'text-muted hover:text-[#1C1C1C]'
                        }`}
                      >
                        <UtensilsCrossed className="w-4 h-4" />
                        <span>🍽️ At Cafe</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. TABLE NUMBER SELECTOR (If Dine-In without URL param) */}
                {orderType === 'dine_in' && (
                  <div className="p-3.5 bg-white rounded-2xl border border-border flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-green animate-pulse" />
                      <span className="text-xs font-bold text-[#1C1C1C]">Dining Table:</span>
                    </div>
                    <select
                      value={tableNumber || '1'}
                      onChange={(e) => setTableNumber(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-border bg-cream font-bold text-xs text-green focus:outline-none focus:border-green"
                    >
                      {tablesList.map((t) => (
                        <option key={t.id || t.table_number} value={t.table_number}>
                          Table #{t.table_number} {t.table_label ? `(${t.table_label})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 3. DELIVERY ADDRESS INPUT (If Online Delivery) */}
                {orderType === 'delivery' && (
                  <div className="p-4 bg-white rounded-2xl border border-border space-y-2">
                    <label className="block text-[11px] font-bold uppercase text-[#1C1C1C] tracking-wider flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-green" />
                      <span>Delivery Address</span>
                    </label>
                    <textarea
                      rows="2"
                      required
                      placeholder="Street name, building, apartment/flat number, landmark..."
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-cream text-xs focus:outline-none focus:border-green"
                    />
                    <span className="text-[10px] text-muted block">
                      🛵 Estimated delivery time: <strong>25–35 mins</strong>
                    </span>
                  </div>
                )}

                {/* 4. ITEMS LIST */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold uppercase text-[#1C1C1C] tracking-wider">
                      Selected Items
                    </span>
                    {cart.length > 0 && (
                      <button
                        onClick={clearCart}
                        className="text-[10px] text-red-600 hover:underline font-bold"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {cart.length === 0 ? (
                    <div className="py-12 bg-white rounded-2xl border border-dashed border-border text-center space-y-2 p-6">
                      <ShoppingBag className="w-8 h-8 text-muted mx-auto" />
                      <p className="font-serif text-sm font-medium text-[#1C1C1C]">Your cart is empty</p>
                      <p className="text-[11px] text-muted">
                        Explore our menu and add items to place your online order.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {cart.map((item) => {
                        const itemImg =
                          item.photo_url ||
                          item.img ||
                          'https://www.gingerandwhite.com/cdn/shop/files/eggs-sourdough.jpg?v=1692816641'

                        return (
                          <div
                            key={item.cartKey || item.id}
                            className={`p-3 rounded-2xl border flex items-center justify-between gap-3 shadow-sm ${
                              item.isReward
                                ? 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-300/30'
                                : 'bg-white border-border'
                            }`}
                          >
                            <img
                              src={itemImg}
                              alt={item.name}
                              className="w-14 h-14 rounded-xl object-cover border border-border shrink-0"
                            />
                            
                            <div className="flex-1 min-w-0">
                              {item.isReward && (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-amber-100 border border-amber-200 text-amber-900 text-[9.5px] font-bold uppercase tracking-wider mb-0.5">
                                  <Gift className="w-2.5 h-2.5 text-amber-700" />
                                  <span>Travel Reward</span>
                                </span>
                              )}
                              <h4 className="font-serif font-bold text-xs text-[#1C1C1C] truncate">
                                {item.name}
                              </h4>
                              {item.isReward ? (
                                <div className="flex items-center space-x-1.5 mt-0.5">
                                  <span className="text-[11px] font-bold text-green font-mono">
                                    ₹0.00 (FREE)
                                  </span>
                                  {Number(item.original_price || 0) > 0 && (
                                    <span className="text-[10px] text-muted line-through">
                                      ₹{Number(item.original_price).toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <p className="text-[11px] font-bold text-green mt-0.5">
                                  ₹{Number(item.price || 0).toFixed(2)}
                                </p>
                              )}
                            </div>

                            {/* Quantity Adjusters */}
                            <div className="flex items-center space-x-1.5 shrink-0 bg-cream p-1 rounded-xl border border-border">
                              <button
                                onClick={() => updateQuantity(item.cartKey, -1)}
                                className="w-6 h-6 rounded-lg bg-white hover:bg-border flex items-center justify-center text-xs text-[#1C1C1C] transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-sans font-bold text-xs px-1.5 text-[#1C1C1C]">
                                {item.quantity}
                              </span>
                              {!item.isReward && (
                                <button
                                  onClick={() => updateQuantity(item.cartKey, 1)}
                                  className="w-6 h-6 rounded-lg bg-white hover:bg-border flex items-center justify-center text-xs text-[#1C1C1C] transition-colors"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            <button
                              onClick={() => removeFromCart(item.cartKey)}
                              className="text-muted hover:text-red-600 p-1 transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* 5. GUEST INFO & SPECIAL INSTRUCTIONS */}
                {cart.length > 0 && (
                  <div className="bg-white p-4 rounded-2xl border border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase text-[#1C1C1C] tracking-wider block">
                        Contact Details
                      </span>
                      {customerSession?.isIdentified && (
                        <span className="text-[10px] text-green font-bold bg-green/10 px-2 py-0.5 rounded-full">
                          ⭐ Identified Traveler
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-muted mb-1">Your Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Rahul"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-border bg-cream text-xs focus:outline-none focus:border-green"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-muted mb-1">Phone Number</label>
                        <input
                          type="tel"
                          placeholder="For Order Updates"
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-border bg-cream text-xs focus:outline-none focus:border-green"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-muted mb-1">
                        Kitchen / Special Notes
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Oat milk, extra hot, no sugar..."
                        value={specialNotes}
                        onChange={(e) => setSpecialNotes(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-cream text-xs focus:outline-none focus:border-green"
                      />
                    </div>
                  </div>
                )}

              </div>

              {/* Footer Summary & Place Order CTA */}
              {cart.length > 0 && (
                <div className="p-5 bg-white border-t border-border space-y-3 shadow-lg">
                  {/* Token Earning Alert */}
                  {customerSession?.isIdentified && tokensToEarn > 0 && (
                    <div className="p-2.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 flex items-center justify-between text-xs animate-fade-in">
                      <div className="flex items-center space-x-1.5 text-amber-900 font-semibold">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                        <span>Travel Tokens on this Order:</span>
                      </div>
                      <span className="font-bold font-mono text-amber-800 bg-white px-2.5 py-0.5 rounded-lg border border-amber-200 shadow-2xs">
                        +{tokensToEarn} Tokens
                      </span>
                    </div>
                  )}

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-muted">
                      <span>Subtotal ({cartCount} items)</span>
                      <span className="font-bold text-[#1C1C1C]">₹{cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-muted">
                      <span>GST &amp; Taxes</span>
                      <span className="text-green font-bold">Included</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-border">
                      <span className="font-bold text-sm text-[#1C1C1C]">Total Payable</span>
                      <span className="font-serif font-bold text-xl text-green">
                        ₹{cartTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-full bg-green hover:bg-green-dark text-white font-sans text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-md active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>Placing Your Order...</span>
                    ) : (
                      <>
                        <span>
                          {orderType === 'delivery'
                            ? '🛵 Place Delivery Order'
                            : orderType === 'takeaway'
                            ? '🛍️ Place Pickup Order'
                            : `🍽️ Place Order (Table #${tableNumber || '1'})`}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  )
}

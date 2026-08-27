import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  CheckCircle2,
  Clock,
  ChefHat,
  Bell,
  UtensilsCrossed,
  ShoppingBag,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Coffee,
  Sparkles,
} from 'lucide-react'
import { api } from '../lib/api'
import { supabase, isSupabaseReady } from '../lib/supabase'

// Order status stages for the stepper
const STAGES = [
  { key: 'placed', label: 'Order Placed', icon: ShoppingBag, description: 'We received your order' },
  { key: 'preparing', label: 'Preparing', icon: ChefHat, description: 'Your order is being prepared' },
  { key: 'ready', label: 'Ready', icon: Bell, description: 'Your order is ready!' },
  { key: 'served', label: 'Served', icon: UtensilsCrossed, description: 'Enjoy your meal!' },
]

// Map raw DB status strings to stage keys
function getStageIndex(status) {
  const s = (status || '').toLowerCase().trim()
  if (s === 'served' || s === 'completed' || s === 'delivered' || s === 'done') return 3
  if (s === 'ready' || s === 'ready for table' || s === 'ready for pickup' || s === 'on_the_way') return 2
  if (s === 'in_progress' || s === 'preparing' || s === 'brewing' || s === 'making' || s === 'almost_ready') return 1
  // new, pending, placed, incoming, received
  return 0
}

function formatElapsed(timestamp) {
  if (!timestamp) return '0:00'
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000))
  const mins = Math.floor(diffSec / 60)
  const secs = diffSec % 60
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

function formatTime(timestamp) {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export default function MyOrderStatus() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [now, setNow] = useState(Date.now())

  // Tick every second for live elapsed timer
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch order initially
  useEffect(() => {
    if (!orderId) return

    async function fetchOrder() {
      try {
        setLoading(true)
        setError(null)
        const data = await api.getOrderById(orderId)
        setOrder(data)
      } catch (err) {
        console.error('Failed to load order:', err)
        setError('Order not found. Please check your order link.')
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [orderId])

  // Real-time subscription for this specific order
  useEffect(() => {
    if (!orderId) return

    // 1. Supabase Realtime
    let channel = null
    if (isSupabaseReady && supabase) {
      channel = supabase
        .channel(`customer_order_${orderId}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        }, (payload) => {
          if (payload.new) {
            setOrder((prev) => prev ? { ...prev, ...payload.new } : prev)
          }
        })
        .subscribe()
    }

    // 2. BroadcastChannel for instant cross-tab sync
    let bc = null
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel('musafir_orders_channel')
        bc.onmessage = (msg) => {
          if (msg.data?.type === 'ORDER_STATUS_CHANGED' && msg.data.orderId === orderId) {
            setOrder((prev) => prev ? { ...prev, status: msg.data.status } : prev)
          }
        }
      } catch (e) { /* ignore */ }
    }

    // 3. In-tab custom event
    const handleCustom = (e) => {
      if (e.detail?.orderId === orderId && e.detail?.status) {
        setOrder((prev) => prev ? { ...prev, status: e.detail.status } : prev)
      }
    }
    window.addEventListener('musafir:order-status', handleCustom)

    // 4. Polling fallback every 5s
    const pollInterval = setInterval(async () => {
      try {
        const data = await api.getOrderById(orderId)
        setOrder(data)
      } catch { /* ignore */ }
    }, 5000)

    return () => {
      if (channel && supabase) supabase.removeChannel(channel)
      if (bc) bc.close()
      window.removeEventListener('musafir:order-status', handleCustom)
      clearInterval(pollInterval)
    }
  }, [orderId])

  // --- LOADING STATE ---
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-green animate-spin mx-auto" />
          <p className="text-sm text-muted font-sans">Loading your order...</p>
        </div>
      </div>
    )
  }

  // --- ERROR STATE ---
  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#1C1C1C]">Order Not Found</h2>
          <p className="text-sm text-muted font-sans leading-relaxed">
            {error || 'We couldn\'t find this order. The link may have expired or the order ID is invalid.'}
          </p>
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green text-white text-sm font-semibold hover:bg-green-dark transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Menu
          </Link>
        </div>
      </div>
    )
  }

  // --- ORDER DATA ---
  const currentStage = getStageIndex(order.status)
  const isCancelled = (order.status || '').toLowerCase() === 'cancelled'
  const isServed = currentStage === 3
  const orderItems = order.items || order.order_items || []
  const orderTotal = Number(order.total || 0)
  const elapsed = formatElapsed(order.created_at)
  const placedAt = formatTime(order.created_at)

  // Parse order type from special_instructions
  const instructions = order.special_instructions || ''
  let orderTypeLabel = '🍽️ Dine-in'
  let orderTypeDetail = `Table #${order.table_number || '1'}`
  if (instructions.includes('[ONLINE HOME DELIVERY]')) {
    orderTypeLabel = '🛵 Home Delivery'
    orderTypeDetail = 'Arriving at your door'
  } else if (instructions.includes('[ONLINE STORE PICKUP]')) {
    orderTypeLabel = '🛍️ Cafe Pickup'
    orderTypeDetail = 'Collect at counter'
  }

  return (
    <div className="min-h-screen bg-[#FAF8F4]">

      {/* ─── HERO HEADER ─── */}
      <section className="relative bg-green overflow-hidden">
        {/* Decorative coffee bean pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 px-5 sm:px-8 pt-8 pb-10 sm:pt-10 sm:pb-14 max-w-lg mx-auto text-center">
          {/* Status Icon */}
          <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full mx-auto mb-5 flex items-center justify-center shadow-lg ${
            isCancelled
              ? 'bg-red-500/20 border-2 border-red-400/40'
              : isServed
              ? 'bg-white/20 border-2 border-white/30'
              : 'bg-white/15 border-2 border-white/25 animate-pulse'
          }`}>
            {isCancelled ? (
              <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-300" />
            ) : isServed ? (
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            ) : currentStage === 2 ? (
              <Bell className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            ) : currentStage === 1 ? (
              <Coffee className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            ) : (
              <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            )}
          </div>

          {/* Order Number */}
          <span className="inline-block px-3 py-1 rounded-full bg-white/15 text-white/80 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2">
            Order #{order.order_number || '—'}
          </span>

          {/* Current Status Title */}
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
            {isCancelled
              ? 'Order Cancelled'
              : isServed
              ? 'Order Complete!'
              : STAGES[currentStage]?.label || 'Processing'}
          </h1>

          <p className="text-white/70 text-xs sm:text-sm font-sans max-w-xs mx-auto">
            {isCancelled
              ? 'This order has been cancelled.'
              : STAGES[currentStage]?.description || 'Your order is being processed.'}
          </p>

          {/* Live Timer Badge */}
          {!isCancelled && !isServed && (
            <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
              <Clock className="w-3.5 h-3.5 text-white/70" />
              <span className="text-white text-xs font-mono font-bold">{elapsed}</span>
              <span className="text-white/50 text-[10px]">elapsed</span>
            </div>
          )}
        </div>
      </section>


      {/* ─── MAIN CONTENT ─── */}
      <div className="max-w-lg mx-auto px-5 sm:px-8 -mt-5 relative z-20 pb-10 space-y-5">

        {/* ─── STATUS STEPPER CARD ─── */}
        {!isCancelled && (
          <div className="bg-white rounded-2xl shadow-md border border-[#EAE5DC] p-5 sm:p-6">
            <h3 className="text-[10px] sm:text-[11px] uppercase font-bold tracking-widest text-muted mb-5">
              Order Progress
            </h3>

            <div className="flex items-start justify-between relative">
              {/* Connector line behind steps */}
              <div className="absolute top-5 left-[10%] right-[10%] h-[2px] bg-[#EAE5DC] z-0" />
              <div
                className="absolute top-5 left-[10%] h-[2px] bg-green z-10 transition-all duration-700 ease-out"
                style={{
                  width: `${Math.min(100, (currentStage / (STAGES.length - 1)) * 80)}%`,
                }}
              />

              {STAGES.map((stage, idx) => {
                const StageIcon = stage.icon
                const isCompleted = idx < currentStage
                const isActive = idx === currentStage
                const isFuture = idx > currentStage

                return (
                  <div key={stage.key} className="flex flex-col items-center relative z-20 flex-1">
                    {/* Circle */}
                    <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                      isCompleted
                        ? 'bg-green border-green text-white shadow-md'
                        : isActive
                        ? 'bg-green/10 border-green text-green shadow-lg ring-4 ring-green/15'
                        : 'bg-white border-[#D9D3C7] text-[#C4BEB3]'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <StageIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'animate-pulse' : ''}`} />
                      )}
                    </div>

                    {/* Label */}
                    <span className={`mt-2.5 text-center text-[10px] sm:text-[11px] font-semibold leading-tight ${
                      isCompleted || isActive ? 'text-[#1C1C1C]' : 'text-[#B5AFA5]'
                    }`}>
                      {stage.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}


        {/* ─── ORDER DETAILS CARD ─── */}
        <div className="bg-white rounded-2xl shadow-md border border-[#EAE5DC] overflow-hidden">

          {/* Card Header */}
          <div className="px-5 sm:px-6 py-4 border-b border-[#EAE5DC] flex items-center justify-between">
            <div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-[#1C1C1C]">
                Order Details
              </h3>
              <p className="text-[10px] sm:text-[11px] text-muted mt-0.5">
                Placed at {placedAt}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] sm:text-[11px] text-muted block">Order Type</span>
              <span className="text-xs font-bold text-[#1C1C1C]">{orderTypeLabel}</span>
            </div>
          </div>

          {/* Items List */}
          <div className="px-5 sm:px-6 py-4 space-y-3">
            {orderItems.length > 0 ? (
              orderItems.map((item, idx) => (
                <div key={item.id || idx} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Item thumbnail */}
                    {item.photo_url || item.menu_items?.photo_url ? (
                      <img
                        src={item.photo_url || item.menu_items?.photo_url}
                        alt={item.name || item.menu_items?.name || 'Item'}
                        className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover flex-shrink-0 border border-[#EAE5DC]"
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                    ) : (
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#FAF8F4] border border-[#EAE5DC] flex items-center justify-center flex-shrink-0">
                        <Coffee className="w-4 h-4 text-[#C4BEB3]" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-[#1C1C1C] truncate">
                        {item.name || item.menu_items?.name || 'Artisan Item'}
                      </p>
                      {item.item_customization && (
                        <p className="text-[10px] text-muted truncate mt-0.5">
                          {item.item_customization}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-[10px] text-muted block">×{item.quantity || 1}</span>
                    <span className="text-xs font-bold text-[#1C1C1C]">
                      ₹{Number(item.price_at_order || item.price || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted text-center py-3">No items found for this order.</p>
            )}
          </div>

          {/* Order Summary Footer */}
          <div className="px-5 sm:px-6 py-4 bg-[#FAF8F4] border-t border-[#EAE5DC] space-y-2.5">
            {/* Order Type Row */}
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted">{orderTypeLabel}</span>
              <span className="font-medium text-[#1C1C1C]">{orderTypeDetail}</span>
            </div>

            {/* Special Instructions */}
            {order.special_instructions && (
              <div className="text-[10px] text-muted leading-relaxed bg-white rounded-lg px-3 py-2 border border-[#EAE5DC]">
                📝 {order.special_instructions}
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-[#E0DAD0] my-1" />

            {/* Total */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-[#1C1C1C]">Total</span>
              <span className="font-serif text-xl font-bold text-green">
                ₹{orderTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>


        {/* ─── INFO CARDS ─── */}
        <div className="grid grid-cols-2 gap-3">
          {/* Estimated Time */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#EAE5DC] p-4 text-center">
            <Clock className="w-5 h-5 text-green mx-auto mb-2" />
            <span className="text-[10px] text-muted uppercase tracking-wider block">Est. Time</span>
            <span className="text-sm font-bold text-[#1C1C1C] mt-1 block">
              {instructions.includes('DELIVERY') ? '25–35 min' : '8–12 min'}
            </span>
          </div>

          {/* Payment Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#EAE5DC] p-4 text-center">
            <ShoppingBag className="w-5 h-5 text-green mx-auto mb-2" />
            <span className="text-[10px] text-muted uppercase tracking-wider block">Payment</span>
            <span className="text-sm font-bold text-[#1C1C1C] mt-1 block">
              {order.payment_status || 'Pending'}
            </span>
          </div>
        </div>


        {/* ─── BACK TO MENU BUTTON ─── */}
        <Link
          to="/menu"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-[#1C1C1C] hover:bg-black text-white font-sans text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-[0.98]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Menu
        </Link>

      </div>
    </div>
  )
}

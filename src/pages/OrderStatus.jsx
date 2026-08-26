import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Check,
  ChefHat,
  FileText,
  Clock,
  Coffee,
  Bell,
  Sparkles,
  ShoppingBag,
  Hourglass,
  ArrowUpDown,
  UtensilsCrossed,
  ShieldAlert,
} from 'lucide-react'
import cupImg from '../assets/images/cup image.png'
import foodImg from '../assets/images/food.png'
import mountainBg from '../assets/images/mountain.png'
import { api } from '../lib/api'
import { supabase, isSupabaseReady } from '../lib/supabase'
import { useCart } from '../context/CartContext'
import toast from 'react-hot-toast'

function getElapsedTimeString(timestamp) {
  if (!timestamp) return '00:00'
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000))
  const mins = Math.floor(diffSec / 60)
  const secs = diffSec % 60
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`
}

function getElapsedFormatted(timestamp) {
  if (!timestamp) return '0:00'
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000))
  const mins = Math.floor(diffSec / 60)
  const secs = diffSec % 60
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

export default function OrderStatus() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { tableNumber } = useCart()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false)

  // 1. Admin Authentication Check
  useEffect(() => {
    const auth = localStorage.getItem('musafir_admin_auth')
    if (!auth) {
      toast.error('Admin authentication required for Order Status Screen', {
        icon: '🔒',
      })
      navigate('/login?redirect=/order-status')
      return
    }
    setIsAdminAuthenticated(true)
  }, [navigate])

  // Live timer tick every second for prep stopwatches
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const loadOrders = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true)
      const data = await api.getOrders()
      setOrders(data || [])
    } catch (err) {
      console.warn('Error loading live orders in OrderStatus:', err)
      setOrders([])
    } finally {
      if (isInitial) setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders(true)
    const interval = setInterval(() => loadOrders(false), 3000)

    // 1. SUPABASE REALTIME WEBSOCKET: 0ms live sync
    let channel = null
    if (isSupabaseReady && supabase) {
      channel = supabase
        .channel('public:kds_order_board_status')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            setOrders((prev) =>
              prev.map((o) => (o.id === payload.new.id ? { ...o, ...payload.new } : o))
            )
          } else if (payload.eventType === 'INSERT' && payload.new) {
            setOrders((prev) => [payload.new, ...prev])
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setOrders((prev) => prev.filter((o) => o.id !== payload.old.id))
          }
          loadOrders(false)
        })
        .subscribe()
    }

    // 2. BROADCAST CHANNEL: Instant Sub-millisecond Cross-Tab Sync
    let bc = null
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel('musafir_orders_channel')
        bc.onmessage = (msg) => {
          if (msg.data?.type === 'ORDER_STATUS_CHANGED') {
            const { orderId, status } = msg.data
            setOrders((prev) =>
              prev.map((o) => (o.id === orderId ? { ...o, status } : o))
            )
            loadOrders(false)
          }
        }
      } catch (e) {
        // ignore
      }
    }

    // 3. IN-TAB CUSTOM EVENT
    const handleCustomStatus = (e) => {
      if (e.detail?.orderId && e.detail?.status) {
        setOrders((prev) =>
          prev.map((o) => (o.id === e.detail.orderId ? { ...o, status: e.detail.status } : o))
        )
        loadOrders(false)
      }
    }
    window.addEventListener('musafir:order-status', handleCustomStatus)

    return () => {
      clearInterval(interval)
      if (channel && supabase) supabase.removeChannel(channel)
      if (bc) bc.close()
      window.removeEventListener('musafir:order-status', handleCustomStatus)
    }
  }, [tableNumber])

  // Active unserved orders list
  const activeOrders = useMemo(() => {
    return (orders || []).filter((o) => {
      const s = (o.status || '').toLowerCase().trim()
      return s !== 'completed' && s !== 'served' && s !== 'delivered' && s !== 'done' && s !== 'cancelled'
    })
  }, [orders])

  // 1. IN PREPARATION ORDERS (Top Grid Cards)
  const inPrepOrders = useMemo(() => {
    return activeOrders.filter((o) => {
      const s = (o.status || '').toLowerCase().trim()
      return (
        s === 'in_progress' ||
        s === 'preparing' ||
        s === 'brewing' ||
        s === 'making' ||
        s === 'almost_ready'
      )
    })
  }, [activeOrders])

  // 2. READY FOR PICKUP / TABLE ORDERS (Middle Badges)
  const readyOrders = useMemo(() => {
    return activeOrders.filter((o) => {
      const s = (o.status || '').toLowerCase().trim()
      return s === 'ready' || s === 'ready for table' || s === 'ready for pickup' || s === 'on_the_way'
    })
  }, [activeOrders])

  // 3. UP NEXT / IN QUEUE ORDERS (Bottom Small Squares)
  const upNextOrders = useMemo(() => {
    const queue = activeOrders.filter((o) => {
      const s = (o.status || '').toLowerCase().trim()
      return (
        !s ||
        s === 'pending' ||
        s === 'placed' ||
        s === 'new' ||
        s === 'incoming' ||
        s === 'received' ||
        s === 'order comes'
      )
    })
    // Sort oldest first
    return queue.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))
  }, [activeOrders])

  return (
    <div className="min-h-screen bg-[#F6F3EC] text-[#2C1D11] font-sans flex flex-col justify-between selection:bg-[#2C482C] selection:text-white relative overflow-x-hidden">



      {/* ── MAIN BOARD CONTENT (FULL SCREEN WIDTH) ── */}
      <main className="flex-1 w-full px-4 sm:px-6 md:px-8 lg:px-10 py-5 sm:py-6 space-y-5 sm:space-y-6 z-10">

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 1: NOW PREPARING (COMPACT CARDS GRID)
           ══════════════════════════════════════════════════════════════════ */}
        <section className="space-y-2.5 sm:space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-md bg-[#E6EFE6] text-[#2C4D2C] flex items-center justify-center">
              <ShoppingBag className="w-3 h-3 stroke-[2.2]" />
            </div>
            <h2 className="font-sans font-bold text-xs sm:text-sm tracking-wider text-[#1C2C1C] uppercase">
              NOW PREPARING
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-[#E5EFE5] text-[#2F592F] text-[11px] font-bold shadow-2xs">
              {inPrepOrders.length} {inPrepOrders.length === 1 ? 'order' : 'orders'} in progress
            </span>
          </div>

          {inPrepOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {inPrepOrders.map((ord) => {
                const ordIdFormatted = ord.order_number
                  ? `#MC${ord.order_number}`
                  : `#MC${String(ord.id).slice(-2).toUpperCase()}`

                const tableLabel = ord.table_number?.toLowerCase().includes('delivery')
                  ? 'Delivery'
                  : ord.table_number?.toLowerCase().includes('takeaway') || ord.table_number?.toLowerCase().includes('pickup')
                    ? 'Pickup'
                    : `Table #${ord.table_number || '1'}`

                const elapsedTimer = getElapsedTimeString(ord.updated_at || ord.created_at)
                const elapsedHuman = getElapsedFormatted(ord.updated_at || ord.created_at)
                const isAlmostReady = ord.status?.toLowerCase() === 'almost_ready'

                // Pick image from dish or fallback to cupImg / foodImg
                const displayPhoto =
                  ord.photo_url ||
                  ord.items?.[0]?.photo_url ||
                  (ord.table_number === '2' ? foodImg : cupImg)

                return (
                  <div
                    key={ord.id}
                    className={`bg-white rounded-xl sm:rounded-2xl p-3 sm:p-3.5 border shadow-[0_2px_10px_-2px_rgba(0,0,0,0.04)] space-y-2 relative overflow-hidden transition-all ${isAlmostReady ? 'border-amber-400/60 ring-2 ring-amber-400/20' : 'border-[#E9E0D4]'
                      }`}
                  >
                    {/* Top Left Green / Amber Ribbon Tag */}
                    <div className={`absolute top-0 left-0 text-white text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-br-md shadow-2xs ${isAlmostReady ? 'bg-amber-600' : 'bg-[#2D5A2D]'
                      }`}>
                      {isAlmostReady ? '⚡ ALMOST READY' : 'IN PREP'}
                    </div>

                    {/* Card Body: Left Dish Photo + Right Details & Stepper */}
                    <div className="flex items-center gap-3 pt-0.5">

                      {/* Left Dish Photo */}
                      <img
                        src={displayPhoto}
                        alt="Order item"
                        className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl object-cover border border-[#EAE1D5] shadow-2xs shrink-0 bg-[#F9F6F0]"
                        onError={(e) => {
                          e.target.src = cupImg
                        }}
                      />

                      {/* Right Details */}
                      <div className="flex-1 min-w-0 space-y-1.5">

                        {/* Table Header + Order ID Pill */}
                        <div className="flex items-center justify-between gap-1.5">
                          <h3 className="font-serif font-bold text-sm sm:text-base text-[#1E2E1E] truncate">
                            {tableLabel}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full bg-[#EFE8DD] text-[#7A5B3E] font-serif font-bold text-[10.5px] border border-[#DFD5C6] shrink-0">
                            {ordIdFormatted}
                          </span>
                        </div>

                        {/* Live Stopwatch Elapsed */}
                        <div className="flex items-center space-x-1 text-[11px] font-semibold text-[#2D5A2D]">
                          <Clock className="w-3 h-3 text-[#2D5A2D]" />
                          <span>{elapsedTimer} elapsed</span>
                        </div>

                        {/* 3-Stage Progress Stepper with Subtitles */}
                        <div className="pt-0.5">
                          <div className="relative">
                            {/* Connecting Bars */}
                            <div className="absolute top-2.5 left-2.5 right-2.5 h-[1.5px] bg-[#E2D8C9] -z-0" />
                            <div className={`absolute top-2.5 left-2.5 ${isAlmostReady ? 'right-2.5' : 'w-1/2'} h-[1.5px] bg-[#2D5A2D] -z-0 transition-all duration-500`} />

                            <div className="grid grid-cols-3 relative z-10 text-center">
                              {/* Node 1: Brewing (Completed ✓) */}
                              <div className="flex flex-col items-center">
                                <div className="w-5 h-5 rounded-full bg-[#2D5A2D] text-white flex items-center justify-center shadow-2xs">
                                  <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                                </div>
                                <span className="text-[8.5px] font-semibold text-[#2D5A2D] mt-0.5 leading-none">
                                  Brewing
                                </span>
                              </div>

                              {/* Node 2: Prep (Active Green Utensil) */}
                              <div className="flex flex-col items-center">
                                <div className="w-5 h-5 rounded-full bg-[#2D5A2D] text-white flex items-center justify-center shadow-2xs ring-2 ring-white">
                                  <UtensilsCrossed className="w-2 h-2" />
                                </div>
                                <span className="text-[8.5px] font-bold text-[#1E2E1E] mt-0.5 leading-none">
                                  Prep
                                </span>
                              </div>

                              {/* Node 3: Almost Ready (Dynamic Green when almost ready) */}
                              <div className="flex flex-col items-center">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center shadow-2xs transition-all ${isAlmostReady
                                  ? 'bg-[#2D5A2D] text-white ring-2 ring-[#2D5A2D]/30 animate-pulse'
                                  : 'bg-[#D8CEBE] border border-[#C9BEAE]'
                                  }`}>
                                  {isAlmostReady ? <Sparkles className="w-2.5 h-2.5" /> : null}
                                </div>
                                <span className={`text-[8.5px] mt-0.5 leading-none font-semibold ${isAlmostReady ? 'text-[#2D5A2D] font-bold' : 'text-[#8A7C6E]'
                                  }`}>
                                  Almost Ready
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>

                    </div>

                    {/* Bottom Status Notification Banner */}
                    <div className={`py-1 px-2.5 rounded-md border text-[10.5px] font-medium transition-all ${isAlmostReady
                      ? 'bg-[#EAF5EA] border-[#CDE5CD] text-[#245224] flex items-center space-x-1'
                      : 'bg-[#EFF5EE] border-[#E0EBE0] text-[#365A36]'
                      }`}>
                      {isAlmostReady ? (
                        <>
                          <span>✨</span>
                          <span>Almost ready! Finishing garnishes &amp; plating...</span>
                        </>
                      ) : (
                        <span>Brewing and prep started {elapsedHuman} ago</span>
                      )}
                    </div>

                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-5 border border-[#E9E0D4] text-center space-y-0.5">
              <p className="font-serif font-bold text-sm text-[#1E2E1E]">
                All Kitchen Orders Prepared
              </p>
              <p className="text-[11px] text-[#7A6B5D]">
                New orders placed from tables will display here automatically.
              </p>
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 2:  (SOFT BLUE/CYAN CONTAINER)
           ══════════════════════════════════════════════════════════════════ */}
        <section className="bg-[#EEF6F8] rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-[#D5E7EB] space-y-2.5">
          <div className="flex items-center space-x-2">
            <Bell className="w-3.5 h-3.5 text-[#2E5E6B]" />
            <h2 className="font-sans font-bold text-xs tracking-wider text-[#244E59] uppercase">
              READY FOR SERVE
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-[#DEEEF2] text-[#244E59] text-[10.5px] font-bold shadow-2xs">
              {readyOrders.length} {readyOrders.length === 1 ? 'order' : 'orders'} ready
            </span>
          </div>

          {readyOrders.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2.5">
              {readyOrders.map((ord) => {
                const ordIdFormatted = ord.order_number
                  ? `#MC${ord.order_number}`
                  : `#MC${String(ord.id).slice(-2).toUpperCase()}`

                const tableLabel = ord.table_number?.toLowerCase().includes('delivery')
                  ? 'Delivery'
                  : ord.table_number?.toLowerCase().includes('takeaway') || ord.table_number?.toLowerCase().includes('pickup')
                    ? 'Pickup'
                    : `Table #${ord.table_number || '1'}`

                return (
                  <div
                    key={ord.id}
                    className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-white border border-[#C2DFE5] text-[#1E4E59] shadow-2xs"
                  >
                    <div className="w-4 h-4 rounded-full bg-[#2E5E6B] text-white flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                    </div>
                    <span className="font-serif font-bold text-xs sm:text-sm text-[#1E3E47]">
                      {ordIdFormatted}
                    </span>
                    <span className="font-sans font-medium text-xs text-[#2E5E6B]">
                      {tableLabel}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="border-2 border-dashed border-[#D2E5EA] rounded-xl p-4 text-center flex flex-col items-center justify-center space-y-0.5">
              <div className="w-8 h-8 rounded-full bg-[#E0F0F4] text-[#2E5E6B] flex items-center justify-center mb-0.5">
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
              <p className="font-sans font-bold text-xs text-[#244E59]">
                No orders currently waiting for pickup
              </p>
              <p className="text-[11px] text-[#527A85]">
                When an order is ready, it will appear here.
              </p>
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 3: UP NEXT (COMPACT IN QUEUE SQUARES)
           ══════════════════════════════════════════════════════════════════ */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Hourglass className="w-3.5 h-3.5 text-[#7A4E2B]" />
              <h2 className="font-sans font-bold text-xs tracking-wider text-[#3D2513] uppercase">
                UP NEXT
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#F5EBE1] text-[#7A4E2B] text-[10.5px] font-bold shadow-2xs">
                {upNextOrders.length} {upNextOrders.length === 1 ? 'order' : 'orders'} in queue
              </span>
            </div>

            <div className="flex items-center space-x-1 text-[11px] text-[#7A6B5D] font-medium">
              <ArrowUpDown className="w-3 h-3" />
              <span>Oldest First</span>
            </div>
          </div>

          {upNextOrders.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2.5">
              {upNextOrders.map((ord) => {
                const ordIdFormatted = ord.order_number
                  ? `#MC${ord.order_number}`
                  : `#MC${String(ord.id).slice(-2).toUpperCase()}`

                const tableShort = ord.table_number?.toLowerCase().includes('delivery')
                  ? 'DEL'
                  : ord.table_number?.toLowerCase().includes('takeaway') || ord.table_number?.toLowerCase().includes('pickup')
                    ? 'PICK'
                    : `T${ord.table_number || '1'}`

                const thumbPhoto = ord.photo_url || ord.items?.[0]?.photo_url || cupImg

                return (
                  <div
                    key={ord.id}
                    className="w-22 h-26 sm:w-24 sm:h-28 bg-white rounded-xl border border-[#E9E0D4] shadow-2xs flex flex-col items-center justify-center p-2.5 space-y-1 select-none hover:shadow-xs transition-shadow"
                  >
                    <img
                      src={thumbPhoto}
                      alt="Thumbnail"
                      className="w-9 h-9 rounded-lg object-cover bg-[#F7F2EA] p-0.5 border border-[#EDE5D8] shrink-0"
                      onError={(e) => {
                        e.target.src = cupImg
                      }}
                    />
                    <span className="font-serif font-bold text-xs sm:text-sm text-[#2C1D11] leading-none pt-0.5">
                      {ordIdFormatted}
                    </span>
                    <span className="text-[10px] font-sans font-semibold text-[#8A7C6E] leading-none">
                      {tableShort}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <span className="text-[11px] text-[#8A7C6E] italic">
              Queue is clear. Next orders will appear here automatically.
            </span>
          )}
        </section>

      </main>



    </div>
  )
}

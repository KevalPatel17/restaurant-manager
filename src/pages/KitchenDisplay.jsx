import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ChefHat,
  Flame,
  CheckCircle2,
  Clock,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RefreshCw,
  Search,
  Sparkles,
  ShoppingBag,
  AlertCircle,
  Check,
  RotateCcw,
  Coffee,
  Shield,
  ShieldAlert,
} from 'lucide-react'
import { api } from '../lib/api'
import { supabase, isSupabaseReady } from '../lib/supabase'
import toast from 'react-hot-toast'

// Helper to play a kitchen order bell / chime using Web Audio API
const playKitchenChime = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)

    osc.type = 'sine'
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime) // D5
    osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12) // A5
    osc.frequency.setValueAtTime(1174.66, audioCtx.currentTime + 0.24) // D6

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8)

    osc.start()
    osc.stop(audioCtx.currentTime + 0.8)
  } catch (err) {
    console.warn('Audio chime unavailable:', err)
  }
}

// Format relative time elapsed
function getTimeElapsed(dateString) {
  if (!dateString) return 'Just now'
  const diffMs = new Date() - new Date(dateString)
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins === 1) return '1 min ago'
  if (diffMins < 60) return `${diffMins} mins ago`
  const diffHours = Math.floor(diffMins / 60)
  return `${diffHours}h ${diffMins % 60}m ago`
}

export default function KitchenDisplay() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false)
  const prevOrderCountRef = useRef(0)

  // 1. Admin Authentication Check
  useEffect(() => {
    const auth = localStorage.getItem('musafir_admin_auth')
    if (!auth) {
      toast.error('Admin authentication required for Kitchen KDS', {
        icon: '🔒',
      })
      navigate('/login?redirect=/kitchen')
      return
    }
    setIsAdminAuthenticated(true)
  }, [navigate])

  // Live Digital Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch Live Orders
  const fetchKitchenOrders = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true)
      const data = await api.getOrders()
      const activeOrders = (data || []).filter(
        (o) => o.status !== 'completed' && o.status !== 'Served' && o.status !== 'cancelled'
      )

      // Check if new incoming order arrived to ring chime
      if (!isInitial && activeOrders.length > prevOrderCountRef.current && soundEnabled) {
        playKitchenChime()
        toast('🔔 New Order Arrived in Kitchen!', {
          icon: '☕',
          style: {
            borderRadius: '16px',
            background: '#1C1C1C',
            color: '#fff',
            fontWeight: 'bold',
          },
        })
      }

      prevOrderCountRef.current = activeOrders.length
      setOrders(activeOrders)
    } catch (err) {
      console.warn('Error fetching kitchen orders:', err)
      setOrders([])
    } finally {
      if (isInitial) setLoading(false)
    }
  }

  useEffect(() => {
    fetchKitchenOrders(true)

    // Poll fallback every 4 seconds
    const interval = setInterval(() => fetchKitchenOrders(false), 4000)

    // Realtime Supabase Subscription
    if (isSupabaseReady && supabase) {
      const channel = supabase
        .channel('kds-orders-realtime-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          fetchKitchenOrders(false)
        })
        .subscribe()

      return () => {
        clearInterval(interval)
        supabase.removeChannel(channel)
      }
    }

    return () => clearInterval(interval)
  }, [soundEnabled])

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  // Update Status Action Handler
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      // Optimistic UI update
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      )

      await api.updateOrderStatus(orderId, newStatus)

      if (newStatus === 'in_progress') {
        toast.success('Order moved to Brewing & Prep 🔥')
      } else if (newStatus === 'almost_ready') {
        toast.success('Order marked Almost Ready! ⏳ Finishing touches')
      } else if (newStatus === 'ready') {
        if (soundEnabled) playKitchenChime()
        toast.success('Order marked Ready for Table! 🔔')
      } else if (newStatus === 'completed') {
        toast.success('Order Served & Completed ✓')
        setOrders((prev) => prev.filter((o) => o.id !== orderId))
      } else {
        toast.success(`Status changed to ${newStatus}`)
      }
    } catch (err) {
      console.error('Error updating order status:', err)
      toast.error('Failed to update status. Retrying...')
      fetchKitchenOrders(false)
    }
  }

  // Categorize Orders into 3 Columns
  const incomingOrders = orders.filter(
    (o) =>
      !o.status ||
      o.status.toLowerCase() === 'new' ||
      o.status.toLowerCase() === 'incoming' ||
      o.status.toLowerCase() === 'pending' ||
      o.status.toLowerCase() === 'received' ||
      o.status.toLowerCase() === 'order comes'
  )

  const brewingOrders = orders.filter(
    (o) =>
      o.status?.toLowerCase() === 'in_progress' ||
      o.status?.toLowerCase() === 'preparing' ||
      o.status?.toLowerCase() === 'brewing' ||
      o.status?.toLowerCase() === 'almost_ready'
  )

  const readyOrders = orders.filter(
    (o) =>
      o.status?.toLowerCase() === 'ready' ||
      o.status?.toLowerCase() === 'ready for table' ||
      o.status?.toLowerCase() === 'ready for pickup'
  )

  // Filter based on search query
  const filterList = (list) => {
    if (!searchQuery.trim()) return list
    const q = searchQuery.toLowerCase()
    return list.filter(
      (o) =>
        String(o.order_number || o.id).toLowerCase().includes(q) ||
        String(o.table_number).toLowerCase().includes(q) ||
        String(o.customer_name).toLowerCase().includes(q) ||
        (o.items || []).some((item) => item.name.toLowerCase().includes(q))
    )
  }

  return (
    <div className="min-h-screen bg-[#0E1217] text-[#FAF8F4] flex flex-col font-sans select-none p-4 sm:p-5 lg:p-6 space-y-5">
      
      {/* ─── 1. KITCHEN TOP BAR & CONTROLS (MATCHING SCREENSHOT) ─── */}
      <header className="bg-[#151921] rounded-2xl border border-white/5 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-md">
        
        {/* Brand Left */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#1C232E] border border-white/10 text-white flex items-center justify-center shadow-xs">
            <svg
              className="w-5 h-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
            </svg>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-white">
                Musafir Kitchen KDS
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-[#18392B] border border-[#22C55E]/30 text-[#4ADE80] text-[10px] font-bold tracking-wider">
                LIVE
              </span>
            </div>
            <p className="text-[11px] text-white/50">
              Kitchen Display &amp; Barista Prep Workflow
            </p>
          </div>
        </div>

        {/* Middle Status Counts & Live Digital Clock */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="px-3 py-1.5 rounded-xl bg-[#2A2114] border border-amber-500/20 text-amber-400 text-xs font-bold flex items-center space-x-1.5">
            <span>🛍️</span>
            <span>{incomingOrders.length} Incoming</span>
          </span>

          <span className="px-3 py-1.5 rounded-xl bg-[#13253B] border border-blue-500/20 text-blue-400 text-xs font-bold flex items-center space-x-1.5">
            <span>🔥</span>
            <span>{brewingOrders.length} Brewing</span>
          </span>

          <span className="px-3 py-1.5 rounded-xl bg-[#132F24] border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center space-x-1.5">
            <span>🔔</span>
            <span>{readyOrders.length} Ready</span>
          </span>

          {/* Green Digital Clock */}
          <div className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-[#16221C] border border-emerald-500/20 text-[#4ADE80] font-mono text-xs font-bold shadow-2xs">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </span>
          </div>
        </div>

        {/* Right Tools & Admin */}
        <div className="flex items-center space-x-2">
          {/* Search Box */}
          <div className="relative hidden md:block">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search table / order #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#1C232E] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-colors w-48 lg:w-56"
            />
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition-colors ${
              soundEnabled
                ? 'bg-[#1C232E] border-white/10 text-emerald-400'
                : 'bg-[#1C232E] border-white/10 text-white/40'
            }`}
            title={soundEnabled ? 'Mute Chimes' : 'Enable Chimes'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Refresh */}
          <button
            onClick={() => fetchKitchenOrders(false)}
            className="p-2 rounded-xl bg-[#1C232E] border border-white/10 text-white/80 hover:text-white transition-colors"
            title="Refresh Orders"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-[#1C232E] border border-white/10 text-white/80 hover:text-white transition-colors"
            title="Fullscreen KDS"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Admin Link */}
          <Link
            to="/admin"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#1C232E] hover:bg-[#252E3C] border border-white/10 text-xs font-semibold text-white/90 transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Admin</span>
            <span className="text-[10px] text-white/50">▾</span>
          </Link>
        </div>

      </header>

      {/* ─── 2. THE 3 WORKFLOW COLUMNS (MATCHING REFERENCE DESIGN) ─── */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

        {/* ══════════════════════════════════════════════════════════════════
            COLUMN 1: INCOMING ORDERS (AMBER GLOW)
           ══════════════════════════════════════════════════════════════════ */}
        <section className="bg-[#171B21] rounded-3xl border border-white/5 flex flex-col overflow-hidden shadow-lg">
          
          {/* Header */}
          <div className="p-4 bg-[#1F242C] border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#2E2315] border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-sm">
                🛍️
              </div>
              <div>
                <h2 className="font-serif font-bold text-base text-white">Incoming Orders</h2>
                <p className="text-[11px] text-white/50">New ticket requests</p>
              </div>
            </div>

            <span className="w-7 h-7 rounded-full bg-[#F59E0B] text-black font-bold text-xs flex items-center justify-center shadow">
              {incomingOrders.length}
            </span>
          </div>

          {/* Cards Stream */}
          <div className="p-3.5 sm:p-4 space-y-3.5 max-h-[calc(100vh-210px)] overflow-y-auto custom-scrollbar">
            {filterList(incomingOrders).length === 0 ? (
              <div className="py-16 text-center text-white/30 space-y-2">
                <ShoppingBag className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs font-medium">No incoming orders in queue</p>
              </div>
            ) : (
              filterList(incomingOrders).map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  stage="incoming"
                  onAdvance={() => handleUpdateStatus(order.id, 'in_progress')}
                  advanceLabel="START BREWING & PREP 🔥"
                />
              ))
            )}
          </div>

        </section>

        {/* ══════════════════════════════════════════════════════════════════
            COLUMN 2: BREWING & PREP (BLUE GLOW)
           ══════════════════════════════════════════════════════════════════ */}
        <section className="bg-[#151D29] rounded-3xl border border-blue-500/10 flex flex-col overflow-hidden shadow-lg">
          
          {/* Header */}
          <div className="p-4 bg-[#192230] border-b border-blue-500/20 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#13253B] border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-sm">
                🔥
              </div>
              <div>
                <h2 className="font-serif font-bold text-base text-blue-300">Brewing &amp; Prep</h2>
                <p className="text-[11px] text-blue-200/60">Being prepared by baristas</p>
              </div>
            </div>

            <span className="w-7 h-7 rounded-full bg-[#3B82F6] text-white font-bold text-xs flex items-center justify-center shadow">
              {brewingOrders.length}
            </span>
          </div>

          {/* Cards Stream */}
          <div className="p-3.5 sm:p-4 space-y-3.5 max-h-[calc(100vh-210px)] overflow-y-auto custom-scrollbar">
            {filterList(brewingOrders).length === 0 ? (
              <div className="py-16 text-center text-white/30 space-y-2">
                <Flame className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs font-medium">No orders in preparation</p>
              </div>
            ) : (
              filterList(brewingOrders).map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  stage="brewing"
                  onAlmostReady={() => handleUpdateStatus(order.id, 'almost_ready')}
                  onAdvance={() => handleUpdateStatus(order.id, 'ready')}
                  onRevert={() => handleUpdateStatus(order.id, 'pending')}
                  advanceLabel="MARK READY FOR TABLE →"
                />
              ))
            )}
          </div>

        </section>

        {/* ══════════════════════════════════════════════════════════════════
            COLUMN 3: READY FOR TABLE (GREEN GLOW)
           ══════════════════════════════════════════════════════════════════ */}
        <section className="bg-[#13221C] rounded-3xl border border-emerald-500/10 flex flex-col overflow-hidden shadow-lg">
          
          {/* Header */}
          <div className="p-4 bg-[#192A22] border-b border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#132F24] border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-sm">
                🔔
              </div>
              <div>
                <h2 className="font-serif font-bold text-base text-emerald-300">Ready for Table</h2>
                <p className="text-[11px] text-emerald-200/60">Ready to serve / pickup</p>
              </div>
            </div>

            <span className="w-7 h-7 rounded-full bg-[#10B981] text-white font-bold text-xs flex items-center justify-center shadow">
              {readyOrders.length}
            </span>
          </div>

          {/* Cards Stream */}
          <div className="p-3.5 sm:p-4 space-y-3.5 max-h-[calc(100vh-210px)] overflow-y-auto custom-scrollbar">
            {filterList(readyOrders).length === 0 ? (
              <div className="py-16 text-center text-white/30 space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs font-medium">No orders waiting for pickup</p>
              </div>
            ) : (
              filterList(readyOrders).map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  stage="ready"
                  onAdvance={() => handleUpdateStatus(order.id, 'completed')}
                  onRevert={() => handleUpdateStatus(order.id, 'in_progress')}
                  advanceLabel="SERVED / COMPLETED ✓"
                />
              ))
            )}
          </div>

        </section>

      </main>

    </div>
  )
}

// ─── SINGLE KITCHEN ORDER TICKET CARD (MATCHING SCREENSHOT) ───
function OrderCard({ order, stage, onAlmostReady, onAdvance, onRevert, advanceLabel }) {
  const isAlmostReady = order.status?.toLowerCase() === 'almost_ready'
  const isReady = order.status?.toLowerCase() === 'ready' || order.status?.toLowerCase() === 'ready for table'
  const isDelivery =
    order.table_number?.toLowerCase().includes('delivery') ||
    order.special_instructions?.includes('[ONLINE HOME DELIVERY]')

  const isTakeaway =
    order.table_number?.toLowerCase().includes('takeaway') ||
    order.table_number?.toLowerCase().includes('pickup') ||
    order.special_instructions?.includes('[TAKEAWAY') ||
    order.special_instructions?.includes('[ONLINE STORE PICKUP]')

  const tableLabel = isDelivery
    ? '🛵 Delivery'
    : isTakeaway
    ? '🛍️ Pickup'
    : `Table #${order.table_number || '1'}`

  const orderNum = order.order_number || String(order.id).slice(-2)

  return (
    <div
      className={`rounded-2xl border p-4 space-y-3 shadow-md transition-all ${
        stage === 'incoming'
          ? 'bg-[#1F242C] border-white/5 hover:border-amber-500/30'
          : stage === 'brewing'
          ? isAlmostReady
            ? 'bg-[#192230] border-amber-400/60 ring-1 ring-amber-400/20'
            : 'bg-[#192230] border-blue-500/20 hover:border-blue-500/40'
          : 'bg-[#192A22] border-emerald-500/20 hover:border-emerald-500/40'
      }`}
    >
      {/* Top Header: TICKET ID + Table Pin Badge */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider block leading-none mb-1">
            TICKET ID
          </span>
          <h3 className="font-serif font-bold text-2xl text-white tracking-tight leading-none">
            #{orderNum}
          </h3>
        </div>

        {/* Table Pin Pill */}
        <div
          className={`px-3 py-1 rounded-xl text-xs font-bold shadow-2xs flex items-center space-x-1.5 ${
            stage === 'incoming'
              ? 'bg-[#2B1B1F] border border-rose-500/30 text-rose-300'
              : stage === 'brewing'
              ? 'bg-[#152B20] border border-emerald-500/30 text-emerald-300'
              : 'bg-[#152B20] border border-emerald-500/30 text-emerald-300'
          }`}
        >
          <span>📍</span>
          <span>{tableLabel}</span>
        </div>
      </div>

      {/* Guest Name & Time Elapsed */}
      <div className="flex items-center justify-between text-xs pb-1 border-b border-white/5">
        <div className="flex items-center space-x-1.5 text-purple-300 font-medium">
          <span className="text-purple-400">👤</span>
          <span>{order.customer_name || 'kkk'}</span>
        </div>

        <div className="flex items-center space-x-1 font-mono text-[11px] text-amber-300/90">
          <Clock className="w-3 h-3 text-amber-400" />
          <span>{getTimeElapsed(order.created_at)}</span>
        </div>
      </div>

      {/* Top Accent Blue Progress Line (for Brewing Stage) */}
      {stage === 'brewing' && (
        <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              isAlmostReady ? 'w-3/4 bg-amber-400' : 'w-1/3 bg-blue-500'
            }`}
          />
        </div>
      )}

      {/* Dishes & Drinks Listing */}
      <div className="space-y-1.5">
        {(order.items || []).map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs text-white/90">
            <div className="flex items-center space-x-2 min-w-0 pr-2">
              <span className="px-1.5 py-0.5 rounded-md bg-[#18392B] text-[#4ADE80] text-[11px] font-mono font-bold shrink-0">
                {item.quantity || 1}x
              </span>
              <span className="font-medium text-white truncate">{item.name}</span>
            </div>
            <span className="font-mono text-xs text-white/60 shrink-0">
              ₹{item.price_at_order || item.price || 179}
            </span>
          </div>
        ))}
      </div>

      {/* Special Kitchen Instructions */}
      {order.special_instructions && (
        <div
          className={`p-2.5 rounded-xl text-xs space-y-0.5 border ${
            stage === 'incoming'
              ? 'bg-[#23201C] text-amber-200/90 border-amber-500/20'
              : stage === 'brewing'
              ? 'bg-[#142332] text-blue-200 border-blue-500/20'
              : 'bg-[#152A20] text-emerald-200 border-emerald-500/20'
          }`}
        >
          <p className="font-bold flex items-center space-x-1 text-[11px] opacity-90">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>Special Notes:</span>
          </p>
          <p className="text-[11px] leading-relaxed opacity-95">{order.special_instructions}</p>
        </div>
      )}

      {/* 4-Stage Stepper inside Brewing Card (Matching Screenshot) */}
      {stage === 'brewing' && (
        <div className="py-2 px-1">
          <div className="relative">
            {/* Background line */}
            <div className="absolute top-3.5 left-4 right-4 h-[1.5px] bg-white/15 -z-0" />

            <div className="grid grid-cols-4 relative z-10 text-center">
              {/* Step 1: Brewing (Active Blue) */}
              <div className="flex flex-col items-center">
                <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/30 ring-2 ring-blue-400">
                  <Coffee className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-bold text-blue-400 mt-1 leading-none">
                  Brewing
                </span>
              </div>

              {/* Step 2: Prep */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-white border transition-colors ${
                    isAlmostReady ? 'bg-blue-600 border-blue-400' : 'bg-[#1E2838] border-white/10'
                  }`}
                >
                  <Coffee className="w-3.5 h-3.5 opacity-70" />
                </div>
                <span className="text-[9px] font-medium text-white/50 mt-1 leading-none">
                  Prep
                </span>
              </div>

              {/* Step 3: Almost Ready */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-white border transition-colors ${
                    isAlmostReady
                      ? 'bg-amber-500 border-amber-400 shadow-md shadow-amber-500/30 text-black'
                      : 'bg-[#1E2838] border-white/10'
                  }`}
                >
                  <ChefHat className="w-3.5 h-3.5" />
                </div>
                <span
                  className={`text-[9px] font-medium mt-1 leading-none ${
                    isAlmostReady ? 'text-amber-300 font-bold' : 'text-white/50'
                  }`}
                >
                  Almost Ready
                </span>
              </div>

              {/* Step 4: Ready */}
              <div className="flex flex-col items-center">
                <div className="w-7 h-7 rounded-full bg-[#1E2838] border border-white/10 flex items-center justify-center text-white/40">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-medium text-white/40 mt-1 leading-none">
                  Ready
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stage Action Controls */}
      <div className="pt-1 flex items-center gap-2">
        {onRevert && (
          <button
            onClick={onRevert}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-colors active:scale-95"
            title="Move back to previous stage"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        {/* 1-Click Almost Ready Button (For Brewing Stage) */}
        {stage === 'brewing' && onAlmostReady && (
          <button
            onClick={onAlmostReady}
            className={`py-3 px-3.5 rounded-xl font-sans text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center space-x-1.5 shrink-0 ${
              isAlmostReady
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : 'bg-[#F59E0B] hover:bg-[#FBBF24] text-black font-bold'
            }`}
            title="Set status to Almost Ready"
          >
            <span>⚡ Almost Ready</span>
          </button>
        )}

        {/* Advance Main Button */}
        <button
          onClick={onAdvance}
          className={`flex-1 py-3 px-4 rounded-xl font-sans text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-lg active:scale-[0.98] cursor-pointer ${
            stage === 'incoming'
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold'
              : stage === 'brewing'
              ? 'bg-blue-600 hover:bg-blue-500 text-white font-bold'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold'
          }`}
        >
          <span>{advanceLabel}</span>
        </button>
      </div>

    </div>
  )
}

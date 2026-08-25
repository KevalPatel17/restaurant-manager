import React, { useState, useEffect, useMemo } from 'react';
import { ChefHat, Coffee, Volume2, VolumeX, RefreshCw, Filter, Bell, CheckCircle2, Clock } from 'lucide-react';
import OrderCard from '../components/OrderCard';
import { api } from '../lib/api';
import { supabase, isSupabaseReady } from '../lib/supabase';
import { playCafeOrderChime } from '../utils/soundAlert';
import toast from 'react-hot-toast';

export default function KitchenDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedTable, setSelectedTable] = useState('ALL');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await api.getOrders();
      setOrders(data || []);
    } catch (err) {
      console.error('Fetch orders error:', err);
      toast.error('Failed to update kitchen queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Auto poll fallback
    const interval = setInterval(fetchOrders, 8000);

    // Supabase Realtime Subscription
    if (isSupabaseReady && supabase) {
      const channel = supabase
        .channel('kitchen-orders-realtime')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'orders' },
          (payload) => {
            if (soundEnabled) {
              playCafeOrderChime();
            }
            toast.custom((t) => (
              <div className="bg-[#1E130D] text-white p-4 rounded-2xl shadow-xl flex items-center space-x-3 border border-[#DF9B52]">
                <Bell className="w-5 h-5 text-[#ECC980] animate-bounce" />
                <div>
                  <h4 className="font-bold text-sm">New Order from Table #{payload.new.table_number}!</h4>
                  <p className="text-xs text-white/70">Order #{payload.new.order_number || ''}</p>
                </div>
              </div>
            ));
            fetchOrders();
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders' },
          () => {
            fetchOrders();
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'orders' },
          () => {
            fetchOrders();
          }
        )
        .subscribe();

      return () => {
        clearInterval(interval);
        supabase.removeChannel(channel);
      };
    }

    return () => clearInterval(interval);
  }, [soundEnabled]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      // Optimistic update
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );

      await api.updateOrderStatus(orderId, newStatus);
      toast.success(`Order status updated to ${newStatus}`);
    } catch (err) {
      console.error('Status update failed:', err);
      toast.error('Failed to update status');
      fetchOrders();
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      await api.deleteOrder(orderId);
      toast.success('Order deleted');
    } catch (err) {
      console.error('Delete order failed:', err);
      toast.error('Failed to delete order');
      fetchOrders();
    }
  };

  // Group orders by status
  const filteredOrders = useMemo(() => {
    if (selectedTable === 'ALL') return orders;
    return orders.filter((o) => o.table_number === selectedTable);
  }, [orders, selectedTable]);

  const newOrders = filteredOrders.filter((o) => o.status === 'New');
  const preparingOrders = filteredOrders.filter((o) => o.status === 'Preparing');
  const readyOrders = filteredOrders.filter((o) => o.status === 'Ready');
  const servedOrders = filteredOrders.filter((o) => o.status === 'Served');

  const uniqueTables = Array.from(new Set(orders.map((o) => o.table_number))).sort();

  return (
    <div className="min-h-screen bg-[#FDF8F2] pb-16">
      
      {/* Header Bar */}
      <div className="bg-[#1E130D] text-white py-5 px-4 sm:px-6 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-[#C86D3B] text-white">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
                <span>Barista & Kitchen KDS</span>
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              </h1>
              <p className="text-xs text-white/70">
                Musafir Cafe Live Order Stream • Realtime Synchronization
              </p>
            </div>
          </div>

          {/* Quick Controls */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            
            {/* Table Filter */}
            <div className="flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-xs">
              <Filter className="w-3.5 h-3.5 text-[#DF9B52]" />
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="bg-transparent text-white focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="text-black">All Tables</option>
                {uniqueTables.map((t) => (
                  <option key={t} value={t} className="text-black">Table #{t}</option>
                ))}
              </select>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={() => {
                setSoundEnabled((s) => !s);
                if (!soundEnabled) playCafeOrderChime();
              }}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition-colors ${
                soundEnabled
                  ? 'bg-[#DF9B52] text-[#1E130D] border-[#DF9B52]'
                  : 'bg-white/10 text-white/70 border-white/10 hover:bg-white/20'
              }`}
              title={soundEnabled ? 'Order Bell Sound: ON' : 'Order Bell Sound: OFF'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{soundEnabled ? 'Bell ON' : 'Muted'}</span>
            </button>

            {/* Manual Refresh */}
            <button
              onClick={fetchOrders}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
              title="Refresh Queue"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

        </div>

        {/* Stats Row */}
        <div className="max-w-7xl mx-auto mt-4 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white/5 rounded-xl p-2.5">
            <span className="text-white/60 block">Incoming Orders</span>
            <span className="font-serif font-bold text-lg text-[#ECC980]">{newOrders.length}</span>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5">
            <span className="text-white/60 block">In Prep / Brewing</span>
            <span className="font-serif font-bold text-lg text-blue-400">{preparingOrders.length}</span>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5">
            <span className="text-white/60 block">Ready for Table</span>
            <span className="font-serif font-bold text-lg text-green-400">{readyOrders.length}</span>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5">
            <span className="text-white/60 block">Completed Today</span>
            <span className="font-serif font-bold text-lg text-white/90">{servedOrders.length}</span>
          </div>
        </div>
      </div>

      {/* Kanban Multi-Column Queue */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Column 1: New Orders */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b-2 border-amber-400">
              <h2 className="font-serif font-bold text-lg text-[#1E130D] flex items-center space-x-2">
                <span>🟡 Incoming Orders</span>
                <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-sans">
                  {newOrders.length}
                </span>
              </h2>
            </div>

            {newOrders.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center text-[#7A6F68] border border-[#F4EDE4] text-xs">
                No new orders waiting. All caught up!
              </div>
            ) : (
              <div className="space-y-4">
                {newOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={handleStatusChange}
                    onDeleteOrder={handleDeleteOrder}
                    onRefresh={fetchOrders}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Column 2: Preparing */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b-2 border-blue-500">
              <h2 className="font-serif font-bold text-lg text-[#1E130D] flex items-center space-x-2">
                <span>🔵 Brewing & Prep</span>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-sans">
                  {preparingOrders.length}
                </span>
              </h2>
            </div>

            {preparingOrders.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center text-[#7A6F68] border border-[#F4EDE4] text-xs">
                No items currently brewing.
              </div>
            ) : (
              <div className="space-y-4">
                {preparingOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={handleStatusChange}
                    onDeleteOrder={handleDeleteOrder}
                    onRefresh={fetchOrders}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Column 3: Ready for Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b-2 border-green-500">
              <h2 className="font-serif font-bold text-lg text-[#1E130D] flex items-center space-x-2">
                <span>🟢 Ready for Table</span>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-sans">
                  {readyOrders.length}
                </span>
              </h2>
            </div>

            {readyOrders.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center text-[#7A6F68] border border-[#F4EDE4] text-xs">
                No orders waiting for table delivery.
              </div>
            ) : (
              <div className="space-y-4">
                {readyOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={handleStatusChange}
                    onDeleteOrder={handleDeleteOrder}
                    onRefresh={fetchOrders}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

    </div>
  );
}

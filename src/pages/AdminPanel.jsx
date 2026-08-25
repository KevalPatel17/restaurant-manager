import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Coffee,
  Layers,
  ShoppingBag,
  QrCode,
  LogOut,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  X,
  Sparkles,
  Loader2,
  Search,
  Settings,
  Smartphone,
  Receipt,
  User,
  Phone,
  Check,
  MessageCircle,
  Send,
  Zap,
  Radio,
  Terminal,
  ExternalLink,
} from 'lucide-react';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import BillInvoiceModal from '../components/BillInvoiceModal';
import toast from 'react-hot-toast';

export default function AdminPanel() {
  const navigate = useNavigate();
  const { cafeSettings, updateCafeSettings } = useCart();
  const [activeTab, setActiveTab] = useState('overview'); // overview, menu, categories, orders, customers, settings
  const [analytics, setAnalytics] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected Order for Bill Modal
  const [selectedBillOrder, setSelectedBillOrder] = useState(null);

  // WAHA Live Test & Health State
  const [testPhone, setTestPhone] = useState('919537533472');
  const [isTestingWaha, setIsTestingWaha] = useState(false);
  const [wahaStatus, setWahaStatus] = useState('checking'); // 'connected' | 'disconnected' | 'checking'
  const [wahaLastChecked, setWahaLastChecked] = useState(null);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    cafe_name: cafeSettings.cafe_name || 'Musafir Cafe & Roasters',
    cafe_address: cafeSettings.cafe_address || 'Sanctuary Lane, Wanderer Street',
    cafe_gst: cafeSettings.cafe_gst || '27AABCU9603R1ZM',
    cafe_phone: cafeSettings.cafe_phone || '+91 9537533472',
    upi_id: cafeSettings.upi_id || 'musafir.cafe@okaxis',
    gpay_qr_url: cafeSettings.gpay_qr_url || '/gpay_scanner.jpg',
    waha_api_url: 'http://localhost:3000',
    waha_session: 'default',
    restaurant_numbers: '919537533472',
  });

  // Modal states
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: '',
    photo_url: '',
    category_id: '',
    is_available: true,
    is_special: false,
    dietary_tags: [],
    prep_time_minutes: 8,
  });

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    icon_name: 'Coffee',
    description: '',
    display_order: 1,
  });

  const [searchFilter, setSearchFilter] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsData, catData, itemsData, ordersData] = await Promise.all([
        api.getAnalytics(),
        api.getCategories(),
        api.getAllMenuItems(),
        api.getOrders(),
      ]);

      setAnalytics(analyticsData);
      setCategories(catData || []);
      setMenuItems(itemsData || []);
      setOrders(ordersData || []);
    } catch (err) {
      console.error('Admin data load error:', err);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  // Ping WAHA Edge Function to check health
  const checkWahaHealth = async () => {
    try {
      setWahaStatus('checking');
      const { data, error } = await supabase.functions.invoke('whatsapp-test', {
        body: {
          phone: testPhone || '919537533472',
          message: 'Ping health check from Admin Panel',
        },
      });

      if (error || !data?.success) {
        setWahaStatus('disconnected');
      } else {
        setWahaStatus('connected');
      }
      setWahaLastChecked(new Date().toLocaleTimeString());
    } catch {
      setWahaStatus('disconnected');
      setWahaLastChecked(new Date().toLocaleTimeString());
    }
  };

  useEffect(() => {
    loadData();
    checkWahaHealth();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('musafir_admin_auth');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  // Send Test WhatsApp via Supabase Edge Function
  const handleTestWahaEdgeFunction = async () => {
    if (!testPhone.trim()) {
      toast.error('Please enter a recipient phone number');
      return;
    }

    setIsTestingWaha(true);
    const toastId = toast.loading('Calling Supabase Edge Function (whatsapp-test)...');

    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-test', {
        body: {
          phone: testPhone.trim(),
          message: `🧪 *WAHA WHATSAPP LIVE TEST*
━━━━━━━━━━━━━━━━━━━
✅ *Status:* Connected Successfully!
🕐 *Timestamp:* ${new Date().toLocaleTimeString()}
📡 *Engine:* Supabase Edge Functions + WAHA
📱 *Recipient:* +${testPhone.trim()}
━━━━━━━━━━━━━━━━━━━
_Musafir Cafe Restaurant POS_`,
        },
      });

      if (error) {
        throw error;
      }

      if (data && data.success) {
        setWahaStatus('connected');
        toast.success(`WhatsApp sent successfully via WAHA to +${testPhone}!`, { id: toastId });
      } else {
        setWahaStatus('disconnected');
        toast.error(`WAHA failed: ${data?.error || 'Could not reach WAHA gateway'}`, { id: toastId });
      }
    } catch (err) {
      console.error('Test WAHA error:', err);
      setWahaStatus('disconnected');
      toast.error(`Edge Function error: ${err.message || 'Check WAHA Docker / ngrok tunnel'}`, { id: toastId });
    } finally {
      setIsTestingWaha(false);
      setWahaLastChecked(new Date().toLocaleTimeString());
    }
  };

  // Toggle item availability
  const handleToggleAvailability = async (item) => {
    const newStatus = !item.is_available;
    try {
      setMenuItems((prev) =>
        prev.map((m) => (m.id === item.id ? { ...m, is_available: newStatus } : m))
      );
      await api.toggleMenuItemAvailability(item.id, newStatus);
      toast.success(`${item.name} is now ${newStatus ? 'Available' : 'Sold Out (86)'}`);
    } catch (err) {
      console.error('Availability toggle error:', err);
      toast.error('Failed to update availability');
      loadData();
    }
  };

  // Toggle Order Payment Status
  const handleTogglePaymentStatus = async (order) => {
    const nextStatus = order.payment_status === 'Paid' ? 'Pending' : 'Paid';
    try {
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, payment_status: nextStatus } : o))
      );
      await api.updateOrderPayment(order.id, { payment_status: nextStatus });
      toast.success(`Order #${order.order_number || order.id.slice(0, 5)} marked as ${nextStatus}`);
    } catch (err) {
      toast.error('Failed to update payment status');
      loadData();
    }
  };

  // Delete item
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await api.deleteMenuItem(itemId);
      setMenuItems((prev) => prev.filter((m) => m.id !== itemId));
      toast.success('Menu item deleted');
    } catch (err) {
      toast.error('Failed to delete item');
    }
  };

  // Delete order
  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    try {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      await api.deleteOrder(orderId);
      toast.success('Order deleted successfully');
      loadData();
    } catch (err) {
      toast.error('Failed to delete order');
    }
  };

  // Save Settings & GPay QR
  const handleSaveSettings = (e) => {
    e.preventDefault();
    updateCafeSettings(settingsForm);
    toast.success('Cafe & WAHA settings saved!');
  };

  // Save (Create or Update) Item
  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!itemForm.name || !itemForm.price || !itemForm.category_id) {
      toast.error('Please fill in name, price, and category');
      return;
    }

    try {
      if (editingItem) {
        await api.updateMenuItem(editingItem.id, itemForm);
        toast.success('Menu item updated');
      } else {
        await api.createMenuItem(itemForm);
        toast.success('New menu item created');
      }
      setShowItemModal(false);
      setEditingItem(null);
      loadData();
    } catch (err) {
      toast.error('Failed to save menu item');
    }
  };

  // Save Category
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name) {
      toast.error('Category name is required');
      return;
    }

    try {
      await api.createCategory(categoryForm);
      toast.success('Category added');
      setShowCategoryModal(false);
      loadData();
    } catch (err) {
      toast.error('Failed to add category');
    }
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description || '',
      price: item.price,
      photo_url: item.photo_url || '',
      category_id: item.category_id,
      is_available: item.is_available,
      is_special: item.is_special || false,
      dietary_tags: item.dietary_tags || [],
      prep_time_minutes: item.prep_time_minutes || 8,
    });
    setShowItemModal(true);
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setItemForm({
      name: '',
      description: '',
      price: '',
      photo_url: '',
      category_id: categories[0]?.id || '',
      is_available: true,
      is_special: false,
      dietary_tags: [],
      prep_time_minutes: 8,
    });
    setShowItemModal(true);
  };

  const filteredMenuItems = menuItems.filter((m) =>
    m.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  // Group unique customers from orders
  const uniqueCustomers = Array.from(
    new Map(
      orders
        .filter((o) => o.customer_phone || o.customer_name)
        .map((o) => [
          o.customer_phone || o.customer_name,
          {
            name: o.customer_name || 'Musafir Guest',
            phone: o.customer_phone || 'N/A',
            lastTable: o.table_number,
            lastOrderDate: o.created_at,
            totalOrders: orders.filter(
              (x) => (x.customer_phone && x.customer_phone === o.customer_phone) || x.customer_name === o.customer_name
            ).length,
            totalSpent: orders
              .filter(
                (x) => (x.customer_phone && x.customer_phone === o.customer_phone) || x.customer_name === o.customer_name
              )
              .reduce((sum, item) => sum + Number(item.total || 0), 0),
          },
        ])
    ).values()
  );

  return (
    <div className="min-h-screen bg-[#FDF8F2] flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-[#1E130D] text-white p-5 flex flex-col justify-between border-r border-[#DF9B52]/20">
        <div className="space-y-6">
          
          {/* Brand */}
          <div className="flex items-center space-x-3 pb-4 border-b border-white/10">
            <img src="/logo.jpg" alt="Logo" className="w-9 h-9 rounded-full object-contain bg-white p-0.5" />
            <div>
              <h2 className="font-serif font-bold text-base text-white">Musafir Cafe</h2>
              <span className="text-[10px] text-[#DF9B52] uppercase font-bold tracking-wider">
                Management Portal
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'overview'
                  ? 'bg-[#C86D3B] text-white shadow-md'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-[#ECC980]" />
              <span>Overview Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('menu')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'menu'
                  ? 'bg-[#C86D3B] text-white shadow-md'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Coffee className="w-4 h-4 text-[#ECC980]" />
              <span>Menu & Stock (86'd)</span>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'categories'
                  ? 'bg-[#C86D3B] text-white shadow-md'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4 text-[#ECC980]" />
              <span>Category Manager</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'orders'
                  ? 'bg-[#C86D3B] text-white shadow-md'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-[#ECC980]" />
              <span>All Orders & Invoices</span>
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'customers'
                  ? 'bg-[#C86D3B] text-white shadow-md'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <User className="w-4 h-4 text-[#ECC980]" />
              <span>Guest Contacts ({uniqueCustomers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'settings'
                  ? 'bg-[#C86D3B] text-white shadow-md'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <MessageCircle className="w-4 h-4 text-[#25D366] fill-[#25D366]" />
              <span>WAHA & GPay Settings</span>
            </button>

            <button
              onClick={() => navigate('/qr')}
              className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all"
            >
              <QrCode className="w-4 h-4 text-[#ECC980]" />
              <span>QR Code Standees</span>
            </button>
          </nav>
        </div>

        {/* Footer Logout */}
        <div className="pt-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/40 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content Area */}
      <main className="flex-1 p-5 sm:p-8 overflow-y-auto">
        
        {/* TAB 1: OVERVIEW ANALYTICS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E130D]">
                  Cafe Performance Overview
                </h1>
                <p className="text-xs text-[#7A6F68] mt-0.5">
                  Realtime revenue and table order metrics for Musafir Cafe.
                </p>
              </div>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-[#DF9B52]/20 shadow-cafe-soft">
                <div className="flex items-center justify-between text-[#7A6F68] text-xs font-bold uppercase tracking-wider">
                  <span>Gross Revenue</span>
                  <DollarSign className="w-4 h-4 text-[#2D8A4E]" />
                </div>
                <div className="mt-2 font-serif font-black text-2xl text-[#1E130D]">
                  ${analytics?.totalRevenue?.toFixed(2) || '0.00'}
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-[#DF9B52]/20 shadow-cafe-soft">
                <div className="flex items-center justify-between text-[#7A6F68] text-xs font-bold uppercase tracking-wider">
                  <span>Total Orders</span>
                  <TrendingUp className="w-4 h-4 text-[#C86D3B]" />
                </div>
                <div className="mt-2 font-serif font-black text-2xl text-[#1E130D]">
                  {analytics?.totalOrders || orders.length}
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-[#DF9B52]/20 shadow-cafe-soft">
                <div className="flex items-center justify-between text-[#7A6F68] text-xs font-bold uppercase tracking-wider">
                  <span>Active Queue</span>
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <div className="mt-2 font-serif font-black text-2xl text-[#1E130D]">
                  {analytics?.activeOrders || 0}
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-[#DF9B52]/20 shadow-cafe-soft">
                <div className="flex items-center justify-between text-[#7A6F68] text-xs font-bold uppercase tracking-wider">
                  <span>WAHA Gateway</span>
                  <span className={`w-2.5 h-2.5 rounded-full ${wahaStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
                </div>
                <div className="mt-2 font-serif font-black text-xl text-[#1E130D] flex items-center space-x-1.5">
                  <span className="text-xs uppercase font-bold text-[#25D366]">
                    {wahaStatus === 'connected' ? 'Connected' : 'Ready / Local'}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Orders Snapshot */}
            <div className="bg-white rounded-3xl p-6 border border-[#DF9B52]/20 shadow-cafe-soft space-y-4">
              <h3 className="font-serif font-bold text-lg text-[#1E130D]">Recent Orders</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#F4EDE4] text-[#7A6F68] uppercase font-bold text-[10px]">
                      <th className="pb-3">Order #</th>
                      <th className="pb-3">Table</th>
                      <th className="pb-3">Guest & Phone</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Payment</th>
                      <th className="pb-3">Total</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#FDF8F2]">
                    {orders.slice(0, 5).map((o) => (
                      <tr key={o.id} className="hover:bg-[#FDF8F2]">
                        <td className="py-3 font-mono font-bold text-[#1E130D]">
                          #{o.order_number || o.id.slice(0, 5)}
                        </td>
                        <td className="py-3 font-semibold">Table #{o.table_number}</td>
                        <td className="py-3">
                          <span className="font-bold text-[#1E130D] block">{o.customer_name || 'Guest'}</span>
                          {o.customer_phone && (
                            <span className="text-[10px] text-[#7A6F68] font-mono">{o.customer_phone}</span>
                          )}
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F4EDE4] text-[#1E130D]">
                            {o.status}
                          </span>
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              o.payment_status === 'Paid'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {o.payment_status === 'Paid' ? 'PAID ✓' : 'UNPAID'} ({o.payment_method || 'Cash'})
                          </span>
                        </td>
                        <td className="py-3 font-bold text-[#1E130D]">
                          ${Number(o.total).toFixed(2)}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => setSelectedBillOrder(o)}
                              className="p-1.5 text-[#7A6F68] hover:text-[#1E130D] rounded-lg"
                              title="Print Bill"
                            >
                              <Receipt className="w-3.5 h-3.5 text-[#C86D3B]" />
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(o.id)}
                              className="p-1.5 text-[#7A6F68] hover:text-red-600 rounded-lg"
                              title="Delete order"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MENU & STOCK MANAGEMENT */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E130D]">
                  Menu & Stock Catalog
                </h1>
                <p className="text-xs text-[#7A6F68] mt-0.5">
                  Update pricing, toggle 86'd out-of-stock items, or add new seasonal creations.
                </p>
              </div>

              <button
                onClick={openCreateModal}
                className="py-2.5 px-4 rounded-xl bg-[#1E130D] hover:bg-[#C86D3B] text-white text-xs font-bold flex items-center space-x-1.5 shadow transition-colors"
              >
                <Plus className="w-4 h-4 text-[#ECC980]" />
                <span>Add Menu Item</span>
              </button>
            </div>

            {/* Search Filter */}
            <div className="relative max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A6F68]" />
              <input
                type="text"
                placeholder="Filter by dish or coffee name..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-white border border-[#DF9B52]/30 focus:outline-none focus:ring-1 focus:ring-[#C86D3B]"
              />
            </div>

            {/* Menu Items Table */}
            <div className="bg-white rounded-3xl border border-[#DF9B52]/20 shadow-cafe-soft overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FDF8F2] border-b border-[#DF9B52]/20 text-[#7A6F68] uppercase text-[10px] font-bold">
                    <tr>
                      <th className="p-4">Item</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Tags</th>
                      <th className="p-4">Available (Stock)</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F4EDE4]">
                    {filteredMenuItems.map((item) => (
                      <tr key={item.id} className="hover:bg-[#FDF8F2]/50">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <img
                              src={item.photo_url || '/logo.jpg'}
                              alt={item.name}
                              className="w-10 h-10 rounded-xl object-cover border border-[#DF9B52]/20"
                            />
                            <div>
                              <div className="font-bold text-[#1E130D] text-sm">{item.name}</div>
                              <div className="text-[#7A6F68] text-[11px] max-w-xs truncate">
                                {item.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-bold text-[#1E130D]">
                          ${Number(item.price).toFixed(2)}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {item.is_special && (
                              <span className="text-[10px] font-bold bg-[#C86D3B]/10 text-[#C86D3B] px-2 py-0.5 rounded">
                                Special
                              </span>
                            )}
                            {item.dietary_tags?.map((t) => (
                              <span key={t} className="text-[10px] bg-[#F4EDE4] text-[#3D5A45] px-1.5 py-0.5 rounded">
                                {t}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleToggleAvailability(item)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                              item.is_available
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            {item.is_available ? 'In Stock ✓' : '86 / Sold Out ✕'}
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-2 rounded-lg bg-[#F4EDE4] hover:bg-[#DF9B52]/20 text-[#1E130D]"
                              title="Edit item"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600"
                              title="Delete item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CATEGORIES */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E130D]">
                  Category Manager
                </h1>
                <p className="text-xs text-[#7A6F68] mt-0.5">
                  Organize menu sections (Artisanal Brews, Brunch, Desserts).
                </p>
              </div>
              <button
                onClick={() => setShowCategoryModal(true)}
                className="py-2.5 px-4 rounded-xl bg-[#1E130D] hover:bg-[#C86D3B] text-white text-xs font-bold flex items-center space-x-1.5 shadow"
              >
                <Plus className="w-4 h-4 text-[#ECC980]" />
                <span>Add Category</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white p-5 rounded-3xl border border-[#DF9B52]/20 shadow-cafe-soft flex justify-between items-center"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#C86D3B]">
                      Order #{cat.display_order} • Icon: {cat.icon_name}
                    </span>
                    <h3 className="font-serif font-bold text-base text-[#1E130D] mt-0.5">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-[#7A6F68] mt-1">{cat.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: ALL ORDERS & BILLING */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E130D]">
                Orders Ledger & Digital Invoices
              </h1>
              <p className="text-xs text-[#7A6F68] mt-0.5">
                Complete history of all orders placed across cafe tables with automatic WAHA WhatsApp triggers.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-[#DF9B52]/20 shadow-cafe-soft overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FDF8F2] border-b border-[#DF9B52]/20 text-[#7A6F68] uppercase text-[10px] font-bold">
                    <tr>
                      <th className="p-4">Order</th>
                      <th className="p-4">Table</th>
                      <th className="p-4">Guest & Mobile</th>
                      <th className="p-4">Timestamp</th>
                      <th className="p-4">Kitchen Status</th>
                      <th className="p-4">Payment</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F4EDE4]">
                    {orders.map((order) => {
                      const isPaid = order.payment_status === 'Paid';
                      return (
                        <tr key={order.id} className="hover:bg-[#FDF8F2]/50">
                          <td className="p-4 font-mono font-bold text-[#1E130D]">
                            #{order.order_number || order.id.slice(0, 5)}
                          </td>
                          <td className="p-4 font-semibold">Table #{order.table_number}</td>
                          <td className="p-4">
                            <span className="font-bold text-[#1E130D] block">{order.customer_name || 'Guest'}</span>
                            <span className="text-[10px] text-[#7A6F68] font-mono">{order.customer_phone || 'N/A'}</span>
                          </td>
                          <td className="p-4 text-[#7A6F68]">
                            {order.created_at ? new Date(order.created_at).toLocaleTimeString() : 'Recent'}
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#F4EDE4] text-[#1E130D]">
                              {order.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleTogglePaymentStatus(order)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${
                                isPaid
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                              }`}
                              title="Click to toggle Paid/Pending"
                            >
                              {isPaid ? 'PAID ✓' : 'PENDING (Click to Pay)'} ({order.payment_method || 'Cash'})
                            </button>
                          </td>
                          <td className="p-4 font-bold text-[#1E130D]">
                            ${Number(order.total).toFixed(2)}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => setSelectedBillOrder(order)}
                                className="p-2 rounded-lg bg-[#F4EDE4] hover:bg-[#DF9B52]/20 text-[#1E130D]"
                                title="Print / Download Bill"
                              >
                                <Receipt className="w-3.5 h-3.5 text-[#C86D3B]" />
                              </button>
                              <button
                                onClick={() => handleDeleteOrder(order.id)}
                                className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                                title="Delete Order Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: GUEST CONTACTS DIRECTORY */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E130D]">
                Guest Contacts Directory
              </h1>
              <p className="text-xs text-[#7A6F68] mt-0.5">
                All customer names and mobile numbers captured via table QR check-ins.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-[#DF9B52]/20 shadow-cafe-soft overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FDF8F2] border-b border-[#DF9B52]/20 text-[#7A6F68] uppercase text-[10px] font-bold">
                    <tr>
                      <th className="p-4">Customer Name</th>
                      <th className="p-4">Mobile Phone</th>
                      <th className="p-4">Last Seated Table</th>
                      <th className="p-4">Total Orders</th>
                      <th className="p-4 text-right">Total Spent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F4EDE4]">
                    {uniqueCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-[#7A6F68]">
                          No guest check-ins recorded yet.
                        </td>
                      </tr>
                    ) : (
                      uniqueCustomers.map((cust, idx) => (
                        <tr key={idx} className="hover:bg-[#FDF8F2]/50">
                          <td className="p-4 font-bold text-[#1E130D] flex items-center space-x-2">
                            <div className="w-7 h-7 rounded-full bg-[#1E130D] text-[#ECC980] flex items-center justify-center text-xs">
                              {cust.name[0]}
                            </div>
                            <span>{cust.name}</span>
                          </td>
                          <td className="p-4 font-mono text-[#7A6F68]">{cust.phone}</td>
                          <td className="p-4 font-semibold">Table #{cust.lastTable}</td>
                          <td className="p-4">{cust.totalOrders} order(s)</td>
                          <td className="p-4 text-right font-bold text-[#2D8A4E]">
                            ${cust.totalSpent.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: WAHA & CAFE SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E130D]">
                WAHA (WhatsApp API) & Edge Functions
              </h1>
              <p className="text-xs text-[#7A6F68] mt-0.5">
                Manage automated WhatsApp notifications via WAHA container and Supabase Edge Functions.
              </p>
            </div>

            {/* WAHA Live Gateway Status & Test Tool */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#25D366]/40 shadow-cafe-soft space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F4EDE4]">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-2xl bg-[#25D366]/15 text-[#25D366]">
                    <MessageCircle className="w-6 h-6 fill-[#25D366]" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-[#1E130D] flex items-center space-x-2">
                      <span>WAHA Engine Status</span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          wahaStatus === 'connected'
                            ? 'bg-green-100 text-green-800'
                            : wahaStatus === 'checking'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {wahaStatus === 'connected' ? '● ONLINE' : wahaStatus === 'checking' ? 'Checking...' : '● READY (Local/Tunnel)'}
                      </span>
                    </h3>
                    <p className="text-xs text-[#7A6F68]">
                      WAHA API (Deno Edge Functions) • Checked: {wahaLastChecked || 'Just now'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={checkWahaHealth}
                  className="px-3 py-1.5 rounded-xl bg-[#F4EDE4] text-xs font-bold text-[#1E130D] hover:bg-[#DF9B52]/20 transition-colors"
                >
                  Ping Health
                </button>
              </div>

              {/* Test Message Dispatcher */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1E130D]">
                  Test WAHA Message via Supabase Edge Function
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="tel"
                    placeholder="e.g. 919537533472"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-[#DF9B52]/30 bg-[#FDF8F2] font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleTestWahaEdgeFunction}
                    disabled={isTestingWaha}
                    className="py-2.5 px-5 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow transition-all active:scale-[0.98] disabled:opacity-60"
                  >
                    {isTestingWaha ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Invoking Edge Function...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Test WhatsApp</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-[#7A6F68]">
                  Calls <code className="bg-[#F4EDE4] px-1 py-0.5 rounded text-[#C86D3B]">supabase.functions.invoke('whatsapp-test')</code>.
                </p>
              </div>

              {/* Quick CLI Commands reference */}
              <div className="p-4 bg-[#1E130D] text-white rounded-2xl space-y-2 text-xs">
                <div className="flex items-center space-x-1.5 text-[#ECC980] font-mono font-bold">
                  <Terminal className="w-4 h-4" />
                  <span>WAHA Local Start & Deploy Commands:</span>
                </div>
                <div className="font-mono text-[11px] text-white/80 space-y-1 bg-black/40 p-2.5 rounded-xl overflow-x-auto">
                  <p><span className="text-[#25D366]"># 1. Start WAHA Docker:</span></p>
                  <p className="text-white">docker run -it --rm -p 3000:3000 devlikeapro/waha</p>
                  <p className="pt-1"><span className="text-[#25D366]"># 2. Expose via ngrok:</span></p>
                  <p className="text-white">ngrok http 3000</p>
                  <p className="pt-1"><span className="text-[#25D366]"># 3. Deploy Edge Functions:</span></p>
                  <p className="text-white">supabase functions deploy notify-new-order</p>
                </div>
              </div>
            </div>

            {/* General Cafe Settings Form */}
            <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl p-6 sm:p-8 border border-[#DF9B52]/20 shadow-cafe-soft space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#1E130D] mb-1.5">
                    Cafe Business Name
                  </label>
                  <input
                    type="text"
                    value={settingsForm.cafe_name}
                    onChange={(e) => setSettingsForm({ ...settingsForm, cafe_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#DF9B52]/30 bg-[#FDF8F2]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[#1E130D] mb-1.5">
                    Restaurant WhatsApp Number (Sender)
                  </label>
                  <input
                    type="text"
                    value={settingsForm.cafe_phone}
                    onChange={(e) => setSettingsForm({ ...settingsForm, cafe_phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#DF9B52]/30 bg-[#FDF8F2] font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#1E130D] mb-1.5">
                  Cafe Address (for Receipts)
                </label>
                <input
                  type="text"
                  value={settingsForm.cafe_address}
                  onChange={(e) => setSettingsForm({ ...settingsForm, cafe_address: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#DF9B52]/30 bg-[#FDF8F2]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#1E130D] mb-1.5">
                    GSTIN / Tax ID
                  </label>
                  <input
                    type="text"
                    value={settingsForm.cafe_gst}
                    onChange={(e) => setSettingsForm({ ...settingsForm, cafe_gst: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#DF9B52]/30 bg-[#FDF8F2]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[#1E130D] mb-1.5">
                    Google Pay / UPI ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. musafir.cafe@okaxis"
                    value={settingsForm.upi_id}
                    onChange={(e) => setSettingsForm({ ...settingsForm, upi_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#DF9B52]/30 bg-[#FDF8F2] font-mono font-bold"
                    required
                  />
                </div>
              </div>

              {/* GPay QR Image URL / Standee */}
              <div>
                <label className="block text-xs font-bold uppercase text-[#1E130D] mb-1.5">
                  GPay QR Standee Image URL
                </label>
                <input
                  type="text"
                  placeholder="/gpay_scanner.jpg or https://..."
                  value={settingsForm.gpay_qr_url}
                  onChange={(e) => setSettingsForm({ ...settingsForm, gpay_qr_url: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#DF9B52]/30 bg-[#FDF8F2]"
                />

                {/* Realtime QR Preview */}
                <div className="mt-3 p-3 bg-[#FDF8F2] rounded-2xl border border-[#DF9B52]/20 flex items-center space-x-4">
                  <img
                    src={settingsForm.gpay_qr_url || '/gpay_scanner.jpg'}
                    alt="GPay Scanner Preview"
                    className="w-20 h-20 rounded-xl object-contain bg-white p-1 border shadow-sm"
                  />
                  <div>
                    <span className="font-bold text-xs text-[#1E130D] block">GPay Standee Preview</span>
                    <span className="text-[11px] text-[#7A6F68] block">
                      This QR image is shown to guests when they click "Pay via GPay".
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#F4EDE4]">
                <button
                  type="submit"
                  className="py-3 px-6 rounded-2xl bg-[#1E130D] hover:bg-[#C86D3B] text-white font-bold text-xs shadow-md transition-colors flex items-center space-x-2"
                >
                  <Check className="w-4 h-4 text-[#ECC980]" />
                  <span>Save All Settings</span>
                </button>
              </div>

            </form>
          </div>
        )}

      </main>

      {/* MODAL: ADD / EDIT MENU ITEM */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-[#DF9B52]/30 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-[#F4EDE4]">
              <h3 className="font-serif font-bold text-lg text-[#1E130D]">
                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h3>
              <button onClick={() => setShowItemModal(false)}>
                <X className="w-5 h-5 text-[#7A6F68]" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold uppercase text-[#1E130D] mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vanilla Bean Affogato"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#DF9B52]/30 bg-[#FDF8F2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-[#1E130D] mb-1">Price ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="5.50"
                    value={itemForm.price}
                    onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#DF9B52]/30 bg-[#FDF8F2]"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-[#1E130D] mb-1">Category</label>
                  <select
                    value={itemForm.category_id}
                    onChange={(e) => setItemForm({ ...itemForm, category_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#DF9B52]/30 bg-[#FDF8F2]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-[#1E130D] mb-1">Photo URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={itemForm.photo_url}
                  onChange={(e) => setItemForm({ ...itemForm, photo_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#DF9B52]/30 bg-[#FDF8F2]"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-[#1E130D] mb-1">Description</label>
                <textarea
                  rows="3"
                  placeholder="Mouthwatering description with notes, origins, or ingredients..."
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#DF9B52]/30 bg-[#FDF8F2]"
                />
              </div>

              <div className="flex items-center space-x-4 pt-2">
                <label className="flex items-center space-x-2 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    checked={itemForm.is_special}
                    onChange={(e) => setItemForm({ ...itemForm, is_special: e.target.checked })}
                    className="rounded text-[#C86D3B]"
                  />
                  <span>Musafir Special ⭐</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    checked={itemForm.is_available}
                    onChange={(e) => setItemForm({ ...itemForm, is_available: e.target.checked })}
                    className="rounded text-[#C86D3B]"
                  />
                  <span>Available in Stock</span>
                </label>
              </div>

              <div className="pt-3 border-t border-[#F4EDE4] flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#F4EDE4] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#1E130D] hover:bg-[#C86D3B] text-white font-bold transition-colors"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CATEGORY */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-[#DF9B52]/30 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[#F4EDE4]">
              <h3 className="font-serif font-bold text-lg text-[#1E130D]">Add Category</h3>
              <button onClick={() => setShowCategoryModal(false)}>
                <X className="w-5 h-5 text-[#7A6F68]" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold uppercase text-[#1E130D] mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Seasonal Holiday Specials"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#DF9B52]/30 bg-[#FDF8F2]"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-[#1E130D] mb-1">Display Order</label>
                <input
                  type="number"
                  value={categoryForm.display_order}
                  onChange={(e) => setCategoryForm({ ...categoryForm, display_order: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#DF9B52]/30 bg-[#FDF8F2]"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-[#1E130D] mb-1">Description</label>
                <textarea
                  rows="2"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#DF9B52]/30 bg-[#FDF8F2]"
                />
              </div>

              <div className="pt-3 border-t border-[#F4EDE4] flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#F4EDE4] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#1E130D] hover:bg-[#C86D3B] text-white font-bold transition-colors"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW / PRINT DIGITAL INVOICE BILL */}
      {selectedBillOrder && (
        <BillInvoiceModal
          isOpen={Boolean(selectedBillOrder)}
          onClose={() => setSelectedBillOrder(null)}
          order={selectedBillOrder}
          onStatusUpdated={loadData}
        />
      )}

    </div>
  );
}

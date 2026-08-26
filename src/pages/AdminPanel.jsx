import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Coffee,
  Layers,
  ShoppingBag,
  LogOut,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  TrendingUp,
  Clock,
  X,
  Loader2,
  Search,
  Receipt,
  User,
  Check,
  MessageCircle,
  Send,
  Terminal,
  UploadCloud,
  Image as ImageIcon,
  QrCode,
  Printer,
  Download,
  Copy,
  ExternalLink,
  ChefHat,
  Flame,
  Menu as MenuIcon,
} from 'lucide-react';
import QRCode from 'qrcode';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import BillInvoiceModal from '../components/BillInvoiceModal';
import toast from 'react-hot-toast';

// Helper to process, resize and convert image files to optimized Base64
function processImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file selected'));
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Please select a valid image file (PNG, JPG, WEBP)'));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 900;
        const MAX_HEIGHT = 700;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to read image file'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const { cafeSettings, updateCafeSettings } = useCart();
  const [activeTab, setActiveTab] = useState('overview'); // overview, menu, categories, tables, orders, customers, settings
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [tableQrs, setTableQrs] = useState({});
  const [loading, setLoading] = useState(true);

  // Selected Order for Bill Modal
  const [selectedBillOrder, setSelectedBillOrder] = useState(null);

  // WAHA Live Test & Health State
  const [testPhone, setTestPhone] = useState('9537533472');
  const [isTestingWaha, setIsTestingWaha] = useState(false);
  const [wahaStatus, setWahaStatus] = useState('checking'); // 'connected' | 'disconnected' | 'checking'
  const [wahaLastChecked, setWahaLastChecked] = useState(null);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    cafe_name: cafeSettings?.cafe_name || 'Musafir Cafe & Roasters',
    cafe_address: cafeSettings?.cafe_address || 'Sanctuary Lane, Wanderer Street',
    cafe_gst: cafeSettings?.cafe_gst || '27AABCU9603R1ZM',
    cafe_phone: cafeSettings?.cafe_phone || '+91 9537533472',
    upi_id: cafeSettings?.upi_id || 'musafir.cafe@okaxis',
    gpay_qr_url: cafeSettings?.gpay_qr_url || '/gpay_scanner.jpg',
    waha_api_url: cafeSettings?.waha_api_url || 'http://localhost:3000',
    waha_session: cafeSettings?.waha_session || 'default',
    waha_api_key: cafeSettings?.waha_api_key || 'musafir123',
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
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    icon_name: 'Coffee',
    description: '',
    photo_url: '',
    display_order: 1,
  });

  // Table Modal & Form state
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableForm, setTableForm] = useState({
    table_number: '',
    table_label: '',
  });

  const [searchFilter, setSearchFilter] = useState('');

  // Check auth on load
  useEffect(() => {
    const auth = localStorage.getItem('musafir_admin_auth');
    if (!auth) {
      navigate('/login');
    }
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsData, catData, itemsData, ordersData, tablesData] = await Promise.all([
        api.getAnalytics(),
        api.getCategories(),
        api.getAllMenuItems(),
        api.getOrders(),
        api.getTables(),
      ]);

      setAnalytics(analyticsData);
      setCategories(catData || []);
      setMenuItems(itemsData || []);
      setOrders(ordersData || []);
      setTables(tablesData || []);
    } catch (err) {
      console.error('Admin data load error:', err);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate QR codes for each table whenever tables change
  useEffect(() => {
    async function generateQrs() {
      const qrs = {};
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://musafir-cafe-7sx.pages.dev';
      for (const t of tables) {
        const orderUrl = `${baseUrl}/menu?table=${t.table_number}`;
        try {
          const dataUrl = await QRCode.toDataURL(orderUrl, {
            width: 340,
            margin: 2,
            color: {
              dark: '#1C1C1C',
              light: '#FFFFFF',
            },
          });
          qrs[t.table_number] = dataUrl;
        } catch (err) {
          console.warn('QR gen error for table ' + t.table_number, err);
        }
      }
      setTableQrs(qrs);
    }
    if (tables.length > 0) {
      generateQrs();
    }
  }, [tables]);

  const checkWahaHealth = async () => {
    try {
      setWahaStatus('checking');
      const { data, error } = await supabase.functions.invoke('whatsapp-test', {
        body: {
          phone: testPhone || '9537533472',
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

  const handleTestWahaEdgeFunction = async () => {
    if (!testPhone.trim()) {
      toast.error('Please enter a recipient phone number');
      return;
    }

    setIsTestingWaha(true);
    const toastId = toast.loading('Sending test message via WAHA...');

    try {
      // 1. Direct browser fetch to local WAHA with API Key
      const cleanPhone = testPhone.trim().replace(/\D/g, '');
      const chatId = cleanPhone.length === 10 ? `91${cleanPhone}@c.us` : `${cleanPhone}@c.us`;

      let sentDirectly = false;
      try {
        const response = await fetch(`${settingsForm.waha_api_url || 'http://localhost:3000'}/api/sendText`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Api-Key': settingsForm.waha_api_key || 'musafir123',
          },
          body: JSON.stringify({
            session: settingsForm.waha_session || 'default',
            chatId: chatId,
            text: `🧪 *WAHA WHATSAPP LIVE TEST*\n━━━━━━━━━━━━━━━━━━━\n✅ *Status:* Connected Successfully!\n🕐 *Timestamp:* ${new Date().toLocaleTimeString()}\n📡 *Portal:* Musafir Cafe Admin\n━━━━━━━━━━━━━━━━━━━\n_Musafir Cafe POS_`,
          }),
        });
        if (response.ok) {
          sentDirectly = true;
        }
      } catch { }

      if (sentDirectly) {
        setWahaStatus('connected');
        toast.success(`WhatsApp sent successfully via WAHA to +${cleanPhone}!`, { id: toastId });
        return;
      }

      // 2. Fallback to Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('whatsapp-test', {
        body: {
          phone: testPhone.trim(),
          message: `🧪 *WAHA WHATSAPP LIVE TEST*\n━━━━━━━━━━━━━━━━━━━\n✅ *Status:* Connected Successfully!\n🕐 *Timestamp:* ${new Date().toLocaleTimeString()}\n📡 *Portal:* Musafir Cafe Admin\n━━━━━━━━━━━━━━━━━━━\n_Musafir Cafe POS_`,
        },
      });

      if (error) throw error;

      if (data && data.success) {
        setWahaStatus('connected');
        toast.success(`WhatsApp sent successfully to +${testPhone}!`, { id: toastId });
      } else {
        setWahaStatus('disconnected');
        toast.error(`WAHA failed: ${data?.error || 'Ensure WAHA session is WORKING'}`, { id: toastId });
      }
    } catch (err) {
      console.error('Test WAHA error:', err);
      setWahaStatus('disconnected');
      toast.error(`Error: ${err.message || 'Check WAHA Docker / ngrok tunnel'}`, { id: toastId });
    } finally {
      setIsTestingWaha(false);
      setWahaLastChecked(new Date().toLocaleTimeString());
    }
  };

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

  const handleSaveSettings = (e) => {
    e.preventDefault();
    updateCafeSettings(settingsForm);
    toast.success('Cafe & WAHA settings saved!');
  };

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

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name) {
      toast.error('Category name is required');
      return;
    }

    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, categoryForm);
        toast.success('Category updated successfully');
      } else {
        await api.createCategory(categoryForm);
        toast.success('New category added');
      }
      setShowCategoryModal(false);
      setEditingCategory(null);
      loadData();
    } catch (err) {
      console.error('Save category error:', err);
      toast.error('Failed to save category');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category? All menu items linked to it may also be affected.')) return;
    try {
      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
      await api.deleteCategory(categoryId);
      toast.success('Category deleted successfully');
      loadData();
    } catch (err) {
      console.error('Delete category error:', err);
      toast.error('Failed to delete category');
      loadData();
    }
  };

  const openCreateCategoryModal = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      icon_name: 'Coffee',
      description: '',
      photo_url: '',
      display_order: categories.length + 1,
    });
    setShowCategoryModal(true);
  };

  const openEditCategoryModal = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name || '',
      icon_name: cat.icon_name || 'Coffee',
      description: cat.description || '',
      photo_url: cat.photo_url || cat.image_url || '',
      display_order: cat.display_order || 1,
    });
    setShowCategoryModal(true);
  };

  // Table Management Handlers
  const handleSaveTable = async (e) => {
    e.preventDefault();
    if (!tableForm.table_number.trim()) {
      toast.error('Table number is required');
      return;
    }

    try {
      await api.createTable({
        table_number: tableForm.table_number.trim(),
        table_label: tableForm.table_label.trim() || `Table #${tableForm.table_number.trim()}`,
      });
      toast.success(`Table #${tableForm.table_number} added with live QR scanner!`);
      setShowTableModal(false);
      setTableForm({ table_number: '', table_label: '' });
      loadData();
    } catch (err) {
      console.error('Save table error:', err);
      toast.error('Failed to add table');
    }
  };

  const handleDeleteTable = async (tableId, tableNum) => {
    if (!window.confirm(`Are you sure you want to delete Table #${tableNum}?`)) return;
    try {
      setTables((prev) => prev.filter((t) => t.id !== tableId));
      await api.deleteTable(tableId);
      toast.success(`Table #${tableNum} deleted`);
      loadData();
    } catch (err) {
      console.error('Delete table error:', err);
      toast.error('Failed to delete table');
      loadData();
    }
  };

  const handleDownloadQr = (tableNum) => {
    const qrDataUrl = tableQrs[tableNum];
    if (!qrDataUrl) {
      toast.error('QR code generating, please try again in a moment');
      return;
    }
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `Musafir_Cafe_Table_${tableNum}_QR.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`Downloaded QR Code for Table #${tableNum}`);
  };

  const handleCopyTableUrl = (tableNum) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://musafir-cafe-7sx.pages.dev';
    const orderUrl = `${baseUrl}/menu?table=${tableNum}`;
    navigator.clipboard.writeText(orderUrl);
    toast.success(`Copied table link: ${orderUrl}`);
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
    <div className="min-h-screen bg-cream flex flex-col md:flex-row font-sans">

      {/* ─── 1. MOBILE TOP ADMIN BAR (md:hidden) ─── */}
      <header className="md:hidden bg-green text-white px-4 py-3 sticky top-0 z-40 shadow-md border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-[#FAF7F2] p-0.5 flex items-center justify-center overflow-hidden shrink-0 shadow-xs border border-white/20">
            <img
              src="/logo.jpg"
              alt="Musafir Logo"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div>
            <h2 className="font-serif font-bold text-sm text-white leading-tight">Musafir Cafe</h2>
            <span className="text-[9px] text-white/70 uppercase font-bold tracking-widest block">
              Admin Portal
            </span>
          </div>
        </div>

        {/* Right Mobile Actions */}
        <div className="flex items-center space-x-2">
          <Link
            to="/order-status"
            target="_blank"
            className="p-2 rounded-xl bg-white/10 text-emerald-300 border border-emerald-400/30 text-xs font-bold flex items-center"
            title="Order Status Board"
          >
            <Flame className="w-4 h-4" />
          </Link>
          <Link
            to="/kitchen"
            target="_blank"
            className="p-2 rounded-xl bg-white/10 text-amber-300 border border-amber-400/30 text-xs font-bold flex items-center"
            title="Kitchen KDS"
          >
            <ChefHat className="w-4 h-4" />
          </Link>
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Toggle Admin Navigation"
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ─── 2. MOBILE OFF-CANVAS SLIDE-OUT DRAWER OVERLAY ─── */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-fade-in">
          {/* Backdrop */}
          <div
            onClick={() => setMobileNavOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Menu */}
          <div className="relative w-72 bg-green text-white p-6 flex flex-col justify-between h-full shadow-2xl z-10 animate-slide-right">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/15">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#FAF7F2] p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-sm border border-white/20">
                    <img
                      src="/logo.jpg"
                      alt="Musafir Logo"
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <div>
                    <h2 className="font-serif font-bold text-base text-white">Musafir Cafe</h2>
                    <span className="text-[10px] text-white/70 uppercase font-bold tracking-widest block">
                      Admin Portal
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileNavOpen(false)}
                  className="p-1 text-white/70 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-1 text-xs font-semibold">
                <button
                  onClick={() => {
                    setActiveTab('overview');
                    setMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ${
                    activeTab === 'overview'
                      ? 'bg-white text-green shadow-md font-bold'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Overview Analytics</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('menu');
                    setMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ${
                    activeTab === 'menu'
                      ? 'bg-white text-green shadow-md font-bold'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Coffee className="w-4 h-4" />
                  <span>Menu &amp; Stock (86'd)</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('categories');
                    setMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ${
                    activeTab === 'categories'
                      ? 'bg-white text-green shadow-md font-bold'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Category Manager</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('tables');
                    setMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ${
                    activeTab === 'tables'
                      ? 'bg-white text-green shadow-md font-bold'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>Tables &amp; QR Standees</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('orders');
                    setMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ${
                    activeTab === 'orders'
                      ? 'bg-white text-green shadow-md font-bold'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>All Orders &amp; Invoices</span>
                </button>

                {/* Direct Link to Kitchen KDS Screen */}
                <Link
                  to="/kitchen"
                  target="_blank"
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-all font-bold group"
                >
                  <div className="flex items-center space-x-3">
                    <ChefHat className="w-4 h-4 text-amber-400" />
                    <span>Kitchen KDS Screen</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </Link>

                {/* Direct Link to Live Order Status Display */}
                <Link
                  to="/order-status"
                  target="_blank"
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-all font-bold group"
                >
                  <div className="flex items-center space-x-3">
                    <Flame className="w-4 h-4 text-emerald-400" />
                    <span>Order Status Display</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </Link>

                <button
                  onClick={() => {
                    setActiveTab('customers');
                    setMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ${
                    activeTab === 'customers'
                      ? 'bg-white text-green shadow-md font-bold'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Guest Contacts ({uniqueCustomers.length})</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ${
                    activeTab === 'settings'
                      ? 'bg-white text-green shadow-md font-bold'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  <span>WAHA &amp; GPay Settings</span>
                </button>
              </nav>
            </div>

            {/* Footer Logout */}
            <div className="pt-4 border-t border-white/15">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-2 px-3 py-2.5 text-xs font-semibold text-red-300 hover:bg-red-950/40 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 4. DESKTOP STICKY SIDEBAR (hidden on md:, visible on desktop) ─── */}
      <aside className="hidden md:flex md:w-64 bg-green text-white p-6 flex-col justify-between border-r border-white/10 md:sticky md:top-0 md:h-screen md:overflow-y-auto shrink-0 shadow-lg">
        <div className="space-y-6">

          {/* Brand */}
          <div className="flex items-center space-x-3 pb-4 border-b border-white/15">
            <div className="w-10 h-10 rounded-full bg-[#FAF7F2] p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-sm border border-white/20">
              <img
                src="/logo.jpg"
                alt="Musafir Cafe Logo"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div>
              <h2 className="font-serif font-bold text-base text-white leading-tight">Musafir Cafe</h2>
              <span className="text-[10px] text-white/70 uppercase font-bold tracking-widest block mt-0.5">
                Admin Portal
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl transition-all ${activeTab === 'overview'
                  ? 'bg-white text-green shadow-md font-bold'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('menu')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl transition-all ${activeTab === 'menu'
                  ? 'bg-white text-green shadow-md font-bold'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
            >
              <Coffee className="w-4 h-4" />
              <span>Menu & Stock (86'd)</span>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl transition-all ${activeTab === 'categories'
                  ? 'bg-white text-green shadow-md font-bold'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
            >
              <Layers className="w-4 h-4" />
              <span>Category Manager</span>
            </button>

            <button
              onClick={() => setActiveTab('tables')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl transition-all ${activeTab === 'tables'
                  ? 'bg-white text-green shadow-md font-bold'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Tables &amp; QR Standees</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl transition-all ${activeTab === 'orders'
                  ? 'bg-white text-green shadow-md font-bold'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>All Orders & Invoices</span>
            </button>

            {/* Direct Link to Kitchen KDS Screen */}
            <Link
              to="/kitchen"
              target="_blank"
              className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-all font-bold group"
            >
              <div className="flex items-center space-x-3">
                <ChefHat className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>Kitchen KDS Screen</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
            </Link>

            {/* Direct Link to Live Order Status Display */}
            <Link
              to="/order-status"
              target="_blank"
              className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-all font-bold group"
            >
              <div className="flex items-center space-x-3">
                <Flame className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>Order Status Display</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
            </Link>

            <button
              onClick={() => setActiveTab('customers')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl transition-all ${activeTab === 'customers'
                  ? 'bg-white text-green shadow-md font-bold'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
            >
              <User className="w-4 h-4" />
              <span>Guest Contacts ({uniqueCustomers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl transition-all ${activeTab === 'settings'
                  ? 'bg-white text-green shadow-md font-bold'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
            >
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              <span>WAHA & GPay Settings</span>
            </button>
          </nav>
        </div>

        {/* Footer Logout */}
        <div className="pt-4 border-t border-white/15">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-950/40 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ─── 5. MAIN ADMIN CONTENT AREA (RESPONSIVE) ─── */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 xl:p-10 overflow-y-auto">

        {/* TAB 1: OVERVIEW ANALYTICS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1C1C]">
                  Cafe Performance Overview
                </h1>
                <p className="text-xs text-muted mt-0.5">
                  Realtime revenue and table order metrics for Musafir Cafe.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to="/order-status"
                  target="_blank"
                  className="py-2 sm:py-2.5 px-3.5 sm:px-4 rounded-xl sm:rounded-2xl bg-[#243524] hover:bg-[#1E2E1E] text-white text-xs font-bold flex items-center space-x-1.5 sm:space-x-2 shadow-md transition-all border border-emerald-500/30"
                >
                  <Flame className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Order Status TV ➔</span>
                </Link>

                <Link
                  to="/kitchen"
                  target="_blank"
                  className="py-2 sm:py-2.5 px-3.5 sm:px-4 rounded-xl sm:rounded-2xl bg-[#1C1C1C] hover:bg-black text-white text-xs font-bold flex items-center space-x-1.5 sm:space-x-2 shadow-lg transition-all"
                >
                  <ChefHat className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kitchen KDS ➔</span>
                </Link>
              </div>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-border shadow-xs">
                <div className="flex items-center justify-between text-muted text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                  <span>Gross Revenue</span>
                  <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green" />
                </div>
                <div className="mt-1.5 sm:mt-2 font-serif font-black text-xl sm:text-2xl text-[#1C1C1C]">
                  ${analytics?.totalRevenue?.toFixed(2) || '0.00'}
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-border shadow-xs">
                <div className="flex items-center justify-between text-muted text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                  <span>Total Orders</span>
                  <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green" />
                </div>
                <div className="mt-1.5 sm:mt-2 font-serif font-black text-xl sm:text-2xl text-[#1C1C1C]">
                  {analytics?.totalOrders || 0}
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-border shadow-xs">
                <div className="flex items-center justify-between text-muted text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                  <span>Active Queue</span>
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                </div>
                <div className="mt-1.5 sm:mt-2 font-serif font-black text-xl sm:text-2xl text-[#1C1C1C]">
                  {analytics?.activeOrders || 0}
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-border shadow-xs">
                <div className="flex items-center justify-between text-muted text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                  <span>WAHA Gateway</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      wahaStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                </div>
                <div className="mt-1.5 sm:mt-2 font-serif font-black text-lg sm:text-xl text-[#1C1C1C] flex items-center space-x-1.5">
                  <span className="text-xs uppercase font-bold text-[#25D366]">
                    {wahaStatus === 'connected' ? 'Connected' : 'Ready / Local'}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Orders Snapshot */}
            <div className="bg-white rounded-3xl p-6 border border-border shadow-sm space-y-4">
              <h3 className="font-serif font-bold text-lg text-[#1C1C1C]">Recent Orders</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted uppercase font-bold text-[10px]">
                      <th className="pb-3">Order #</th>
                      <th className="pb-3">Table</th>
                      <th className="pb-3">Guest & Phone</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Payment</th>
                      <th className="pb-3">Total</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {orders.slice(0, 5).map((o) => (
                      <tr key={o.id} className="hover:bg-cream">
                        <td className="py-3 font-mono font-bold text-[#1C1C1C]">
                          #{o.order_number || o.id.slice(0, 5)}
                        </td>
                        <td className="py-3 font-semibold">Table #{o.table_number}</td>
                        <td className="py-3">
                          <span className="font-bold text-[#1C1C1C] block">{o.customer_name || 'Guest'}</span>
                          {o.customer_phone && (
                            <span className="text-[10px] text-muted font-mono">{o.customer_phone}</span>
                          )}
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cream text-[#1C1C1C]">
                            {o.status}
                          </span>
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${o.payment_status === 'Paid'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-amber-100 text-amber-800'
                              }`}
                          >
                            {o.payment_status === 'Paid' ? 'PAID ✓' : 'UNPAID'} ({o.payment_method || 'Cash'})
                          </span>
                        </td>
                        <td className="py-3 font-bold text-[#1C1C1C]">
                          ${Number(o.total).toFixed(2)}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => setSelectedBillOrder(o)}
                              className="p-1.5 text-muted hover:text-[#1C1C1C] rounded-lg"
                              title="Print Bill"
                            >
                              <Receipt className="w-3.5 h-3.5 text-green" />
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(o.id)}
                              className="p-1.5 text-muted hover:text-red-600 rounded-lg"
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
                <h1 className="font-serif text-3xl font-bold text-[#1C1C1C]">
                  Menu & Stock Catalog
                </h1>
                <p className="text-xs text-muted mt-0.5">
                  Update pricing, toggle 86'd out-of-stock items, or add new creations.
                </p>
              </div>

              <button
                onClick={openCreateModal}
                className="py-2.5 px-4 rounded-xl bg-green hover:bg-green-dark text-white text-xs font-bold flex items-center space-x-1.5 shadow transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Menu Item</span>
              </button>
            </div>

            <div className="relative max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="Filter by dish or coffee name..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-white border border-border focus:outline-none focus:ring-1 focus:ring-green"
              />
            </div>

            <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-cream border-b border-border text-muted uppercase text-[10px] font-bold">
                    <tr>
                      <th className="p-4">Item</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Tags</th>
                      <th className="p-4">Available (Stock)</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredMenuItems.map((item) => (
                      <tr key={item.id} className="hover:bg-cream">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <img
                              src={item.photo_url || '/logo.jpg'}
                              alt={item.name}
                              className="w-10 h-10 rounded-xl object-cover border border-border"
                            />
                            <div>
                              <div className="font-bold text-[#1C1C1C] text-sm">{item.name}</div>
                              <div className="text-muted text-[11px] max-w-xs truncate">
                                {item.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-bold text-[#1C1C1C]">
                          ${Number(item.price).toFixed(2)}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {item.is_special && (
                              <span className="text-[10px] font-bold bg-green/10 text-green px-2 py-0.5 rounded">
                                Special
                              </span>
                            )}
                            {item.dietary_tags?.map((t) => (
                              <span key={t} className="text-[10px] bg-cream text-green px-1.5 py-0.5 rounded border border-border">
                                {t}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleToggleAvailability(item)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${item.is_available
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
                              className="p-2 rounded-lg bg-cream hover:bg-border text-[#1C1C1C]"
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
                <h1 className="font-serif text-3xl font-bold text-[#1C1C1C]">
                  Category Manager
                </h1>
                <p className="text-xs text-muted mt-0.5">
                  Organize menu sections (Artisanal Brews, Brunch, Desserts).
                </p>
              </div>
              <button
                onClick={openCreateCategoryModal}
                className="py-2.5 px-4 rounded-xl bg-green hover:bg-green-dark text-white text-xs font-bold flex items-center space-x-1.5 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white p-5 rounded-3xl border border-border shadow-sm flex items-center justify-between gap-4 h-full min-h-[120px]"
                >
                  <div className="flex items-center space-x-4 overflow-hidden flex-1">
                    <img
                      src={cat.photo_url || cat.image_url || 'https://www.gingerandwhite.com/cdn/shop/files/eggs-sourdough.jpg?v=1692816641'}
                      alt={cat.name}
                      className="w-16 h-16 rounded-2xl object-cover border border-border flex-shrink-0"
                    />
                    <div className="overflow-hidden flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-green block">
                        Order #{cat.display_order} • Icon: {cat.icon_name}
                      </span>
                      <h3 className="font-serif font-bold text-base text-[#1C1C1C] mt-0.5 truncate">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-muted mt-1 line-clamp-2 leading-relaxed">{cat.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 flex-shrink-0">
                    <button
                      onClick={() => openEditCategoryModal(cat)}
                      className="p-2 rounded-lg bg-cream hover:bg-border text-[#1C1C1C] transition-colors"
                      title="Edit Category"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: TABLES & AUTO-GENERATED QR STANDEES */}
        {activeTab === 'tables' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="font-serif text-3xl font-bold text-[#1C1C1C]">
                  Tables &amp; QR Standees
                </h1>
                <p className="text-xs text-muted mt-0.5">
                  Manage dining tables. Each table automatically generates a high-resolution QR scanner linking to the online menu.
                </p>
              </div>
              <button
                onClick={() => {
                  setTableForm({ table_number: '', table_label: '' });
                  setShowTableModal(true);
                }}
                className="py-2.5 px-4 rounded-xl bg-green hover:bg-green-dark text-white text-xs font-bold flex items-center space-x-1.5 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Table</span>
              </button>
            </div>

            {/* Quick Stats Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-border flex items-center space-x-3 shadow-sm">
                <div className="p-3 bg-green/10 rounded-xl text-green">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Active Tables</span>
                  <p className="font-serif text-xl font-bold text-[#1C1C1C]">{tables.length} Tables</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-border flex items-center space-x-3 shadow-sm">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                  <ExternalLink className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Ordering Flow</span>
                  <p className="font-serif text-sm font-bold text-[#1C1C1C]">Direct Table Link via QR</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-border flex items-center space-x-3 shadow-sm">
                <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Print Quality</span>
                  <p className="font-serif text-sm font-bold text-[#1C1C1C]">300 DPI High-Res Standees</p>
                </div>
              </div>
            </div>

            {/* Grid of Auto-Generated Table Standees */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {tables.map((table) => {
                const qrUrl = tableQrs[table.table_number];
                const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://musafir-cafe-7sx.pages.dev';
                const targetUrl = `${baseUrl}/menu?table=${table.table_number}`;

                return (
                  <div
                    key={table.id || table.table_number}
                    className="bg-white rounded-3xl border-2 border-border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between"
                  >
                    {/* Standee Header */}
                    <div className="bg-green text-white p-4 text-center border-b border-green-dark">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-white/80 block">
                        Musafir Cafe &amp; Roasters
                      </span>
                      <h3 className="font-serif text-2xl font-bold mt-0.5">
                        Table #{table.table_number}
                      </h3>
                      {table.table_label && (
                        <span className="text-xs text-white/90 font-light mt-0.5 block">
                          {table.table_label}
                        </span>
                      )}
                    </div>

                    {/* QR Code Body */}
                    <div className="p-6 flex flex-col items-center justify-center text-center space-y-3 bg-[#FAF8F4]">
                      <div className="p-3 bg-white rounded-2xl border border-border shadow-sm">
                        {qrUrl ? (
                          <img
                            src={qrUrl}
                            alt={`Table ${table.table_number} QR Code`}
                            className="w-48 h-48 object-contain rounded-lg"
                          />
                        ) : (
                          <div className="w-48 h-48 flex items-center justify-center text-muted">
                            <Loader2 className="w-8 h-8 animate-spin text-green" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <p className="font-serif text-sm font-bold text-[#1C1C1C]">
                          Scan to View Menu &amp; Order
                        </p>
                        <p className="text-[10px] text-muted font-mono bg-white px-2.5 py-1 rounded-md border border-border truncate max-w-[220px]">
                          {targetUrl}
                        </p>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="p-4 bg-white border-t border-border flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleDownloadQr(table.table_number)}
                        className="flex-1 py-2 px-3 rounded-xl bg-cream hover:bg-border text-[#1C1C1C] text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
                        title="Download QR PNG"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PNG</span>
                      </button>

                      <button
                        onClick={() => handleCopyTableUrl(table.table_number)}
                        className="py-2 px-3 rounded-xl bg-cream hover:bg-border text-[#1C1C1C] text-xs font-bold flex items-center justify-center transition-colors"
                        title="Copy Table URL"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => window.open(targetUrl, '_blank')}
                        className="py-2 px-3 rounded-xl bg-cream hover:bg-border text-[#1C1C1C] text-xs font-bold flex items-center justify-center transition-colors"
                        title="Open Menu Page for this Table"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteTable(table.id, table.table_number)}
                        className="py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center transition-colors"
                        title="Delete Table"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: ALL ORDERS & BILLING */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div>
              <h1 className="font-serif text-3xl font-bold text-[#1C1C1C]">
                Orders Ledger & Invoices
              </h1>
              <p className="text-xs text-muted mt-0.5">
                Complete history of all orders placed across cafe tables with WhatsApp triggers.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-cream border-b border-border text-muted uppercase text-[10px] font-bold">
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
                  <tbody className="divide-y divide-border">
                    {orders.map((order) => {
                      const isPaid = order.payment_status === 'Paid';
                      return (
                        <tr key={order.id} className="hover:bg-cream">
                          <td className="p-4 font-mono font-bold text-[#1C1C1C]">
                            #{order.order_number || order.id.slice(0, 5)}
                          </td>
                          <td className="p-4 font-semibold">Table #{order.table_number}</td>
                          <td className="p-4">
                            <span className="font-bold text-[#1C1C1C] block">{order.customer_name || 'Guest'}</span>
                            <span className="text-[10px] text-muted font-mono">{order.customer_phone || 'N/A'}</span>
                          </td>
                          <td className="p-4 text-muted">
                            {order.created_at ? new Date(order.created_at).toLocaleTimeString() : 'Recent'}
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-cream text-[#1C1C1C] border border-border">
                              {order.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleTogglePaymentStatus(order)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${isPaid
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                }`}
                              title="Click to toggle Paid/Pending"
                            >
                              {isPaid ? 'PAID ✓' : 'PENDING'} ({order.payment_method || 'Cash'})
                            </button>
                          </td>
                          <td className="p-4 font-bold text-[#1C1C1C]">
                            ${Number(order.total).toFixed(2)}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => setSelectedBillOrder(order)}
                                className="p-2 rounded-lg bg-cream hover:bg-border text-[#1C1C1C]"
                                title="Print / Download Bill"
                              >
                                <Receipt className="w-3.5 h-3.5 text-green" />
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
              <h1 className="font-serif text-3xl font-bold text-[#1C1C1C]">
                Guest Contacts Directory
              </h1>
              <p className="text-xs text-muted mt-0.5">
                All customer names and mobile numbers captured via table QR check-ins.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-cream border-b border-border text-muted uppercase text-[10px] font-bold">
                    <tr>
                      <th className="p-4">Customer Name</th>
                      <th className="p-4">Mobile Phone</th>
                      <th className="p-4">Last Seated Table</th>
                      <th className="p-4">Total Orders</th>
                      <th className="p-4 text-right">Total Spent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {uniqueCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-muted">
                          No guest check-ins recorded yet.
                        </td>
                      </tr>
                    ) : (
                      uniqueCustomers.map((cust, idx) => (
                        <tr key={idx} className="hover:bg-cream">
                          <td className="p-4 font-bold text-[#1C1C1C] flex items-center space-x-2">
                            <div className="w-7 h-7 rounded-full bg-green text-white flex items-center justify-center text-xs">
                              {cust.name[0]}
                            </div>
                            <span>{cust.name}</span>
                          </td>
                          <td className="p-4 font-mono text-muted">{cust.phone}</td>
                          <td className="p-4 font-semibold">Table #{cust.lastTable}</td>
                          <td className="p-4">{cust.totalOrders} order(s)</td>
                          <td className="p-4 text-right font-bold text-green">
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
              <h1 className="font-serif text-3xl font-bold text-[#1C1C1C]">
                WAHA (WhatsApp API) & Settings
              </h1>
              <p className="text-xs text-muted mt-0.5">
                Manage automated WhatsApp notifications via WAHA container and Supabase Edge Functions.
              </p>
            </div>

            {/* WAHA Live Gateway Status & Test Tool */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#25D366]/40 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-2xl bg-[#25D366]/15 text-[#25D366]">
                    <MessageCircle className="w-6 h-6 fill-[#25D366]" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-[#1C1C1C] flex items-center space-x-2">
                      <span>WAHA Engine Status</span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${wahaStatus === 'connected'
                            ? 'bg-green-100 text-green-800'
                            : wahaStatus === 'checking'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                      >
                        {wahaStatus === 'connected' ? '● ONLINE' : wahaStatus === 'checking' ? 'Checking...' : '● READY (Local/Docker)'}
                      </span>
                    </h3>
                    <p className="text-xs text-muted">
                      WAHA API (Port 3000) • Checked: {wahaLastChecked || 'Just now'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={checkWahaHealth}
                  className="px-3 py-1.5 rounded-xl bg-cream text-xs font-bold text-[#1C1C1C] hover:bg-border transition-colors border border-border"
                >
                  Ping Health
                </button>
              </div>

              {/* Test Message Dispatcher */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1C]">
                  Test WAHA Message Dispatch
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="tel"
                    placeholder="e.g. 9537533472"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-border bg-cream font-mono font-bold"
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
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Test WhatsApp</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Quick CLI Commands reference */}
              <div className="p-4 bg-green text-white rounded-2xl space-y-2 text-xs">
                <div className="flex items-center space-x-1.5 text-white/90 font-mono font-bold">
                  <Terminal className="w-4 h-4" />
                  <span>WAHA Local Credentials:</span>
                </div>
                <div className="font-mono text-[11px] text-white/80 space-y-1 bg-black/30 p-2.5 rounded-xl overflow-x-auto">
                  <p>Dashboard: <a href="http://localhost:3000/dashboard" target="_blank" rel="noreferrer" className="underline text-white">http://localhost:3000/dashboard</a></p>
                  <p>Username: <span className="text-white">admin</span> | Password: <span className="text-white">admin</span></p>
                  <p>API Key: <span className="text-white">musafir123</span></p>
                </div>
              </div>
            </div>

            {/* General Cafe Settings Form */}
            <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl p-6 sm:p-8 border border-border shadow-sm space-y-5">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#1C1C1C] mb-1.5">
                    Cafe Business Name
                  </label>
                  <input
                    type="text"
                    value={settingsForm.cafe_name}
                    onChange={(e) => setSettingsForm({ ...settingsForm, cafe_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-border bg-cream"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[#1C1C1C] mb-1.5">
                    Restaurant WhatsApp Number (Sender)
                  </label>
                  <input
                    type="text"
                    value={settingsForm.cafe_phone}
                    onChange={(e) => setSettingsForm({ ...settingsForm, cafe_phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-border bg-cream font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#1C1C1C] mb-1.5">
                  Cafe Address (for Receipts)
                </label>
                <input
                  type="text"
                  value={settingsForm.cafe_address}
                  onChange={(e) => setSettingsForm({ ...settingsForm, cafe_address: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-border bg-cream"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#1C1C1C] mb-1.5">
                    GSTIN / Tax ID
                  </label>
                  <input
                    type="text"
                    value={settingsForm.cafe_gst}
                    onChange={(e) => setSettingsForm({ ...settingsForm, cafe_gst: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-border bg-cream"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[#1C1C1C] mb-1.5">
                    Google Pay / UPI ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. musafir.cafe@okaxis"
                    value={settingsForm.upi_id}
                    onChange={(e) => setSettingsForm({ ...settingsForm, upi_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-border bg-cream font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#1C1C1C] mb-1.5">
                  GPay QR Standee Image URL
                </label>
                <input
                  type="text"
                  placeholder="/gpay_scanner.jpg or https://..."
                  value={settingsForm.gpay_qr_url}
                  onChange={(e) => setSettingsForm({ ...settingsForm, gpay_qr_url: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-border bg-cream"
                />

                <div className="mt-3 p-3 bg-cream rounded-2xl border border-border flex items-center space-x-4">
                  <img
                    src={settingsForm.gpay_qr_url || '/gpay_scanner.jpg'}
                    alt="GPay Scanner Preview"
                    className="w-20 h-20 rounded-xl object-contain bg-white p-1 border shadow-sm"
                  />
                  <div>
                    <span className="font-bold text-xs text-[#1C1C1C] block">GPay Standee Preview</span>
                    <span className="text-[11px] text-muted block">
                      This QR image is shown to guests when viewing the GPay scanner.
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border">
                <button
                  type="submit"
                  className="py-3 px-6 rounded-2xl bg-green hover:bg-green-dark text-white font-bold text-xs shadow-md transition-colors flex items-center space-x-2"
                >
                  <Check className="w-4 h-4" />
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
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-border space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <h3 className="font-serif font-bold text-lg text-[#1C1C1C]">
                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h3>
              <button onClick={() => setShowItemModal(false)}>
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold uppercase text-[#1C1C1C] mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vanilla Bean Affogato"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-cream"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-[#1C1C1C] mb-1">Price ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="5.50"
                    value={itemForm.price}
                    onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-cream"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-[#1C1C1C] mb-1">Category</label>
                  <select
                    value={itemForm.category_id}
                    onChange={(e) => setItemForm({ ...itemForm, category_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-cream"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-[#1C1C1C] mb-1">
                  Dish / Drink Photo
                </label>
                {itemForm.photo_url ? (
                  <div className="relative rounded-2xl overflow-hidden border border-border bg-[#FAF8F4] group">
                    <img
                      src={itemForm.photo_url}
                      alt="Item Preview"
                      className="w-full h-36 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                      <label className="px-3 py-1.5 rounded-xl bg-white text-green text-xs font-bold cursor-pointer hover:bg-cream transition-colors shadow">
                        <span>Change Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const dataUrl = await processImageFile(file);
                                setItemForm((prev) => ({ ...prev, photo_url: dataUrl }));
                                toast.success('Image uploaded successfully!');
                              } catch (err) {
                                toast.error(err.message || 'Failed to process image');
                              }
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setItemForm((prev) => ({ ...prev, photo_url: '' }))}
                        className="p-1.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors shadow"
                        title="Remove Photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-green bg-cream/60 hover:bg-cream rounded-2xl p-5 cursor-pointer transition-colors text-center group">
                    <UploadCloud className="w-7 h-7 text-muted group-hover:text-green transition-colors mb-1.5" />
                    <span className="font-bold text-xs text-[#1C1C1C]">Click to upload dish photo</span>
                    <span className="text-[10px] text-muted mt-0.5">PNG, JPG, WEBP from your device</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const dataUrl = await processImageFile(file);
                            setItemForm((prev) => ({ ...prev, photo_url: dataUrl }));
                            toast.success('Image uploaded successfully!');
                          } catch (err) {
                            toast.error(err.message || 'Failed to process image');
                          }
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              <div>
                <label className="block font-bold uppercase text-[#1C1C1C] mb-1">Description</label>
                <textarea
                  rows="3"
                  placeholder="Mouthwatering description with tasting notes..."
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-cream"
                />
              </div>

              <div className="flex items-center space-x-4 pt-2">
                <label className="flex items-center space-x-2 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    checked={itemForm.is_special}
                    onChange={(e) => setItemForm({ ...itemForm, is_special: e.target.checked })}
                    className="rounded text-green"
                  />
                  <span>Musafir Special ⭐</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    checked={itemForm.is_available}
                    onChange={(e) => setItemForm({ ...itemForm, is_available: e.target.checked })}
                    className="rounded text-green"
                  />
                  <span>Available in Stock</span>
                </label>
              </div>

              <div className="pt-3 border-t border-border flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 rounded-xl bg-cream font-bold border border-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-green hover:bg-green-dark text-white font-bold transition-colors"
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
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-border space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <h3 className="font-serif font-bold text-lg text-[#1C1C1C]">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button onClick={() => setShowCategoryModal(false)}>
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold uppercase text-[#1C1C1C] mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Seasonal Specials"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-cream"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-[#1C1C1C] mb-1">Display Order</label>
                <input
                  type="number"
                  value={categoryForm.display_order}
                  onChange={(e) => setCategoryForm({ ...categoryForm, display_order: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-cream"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-[#1C1C1C] mb-1">
                  Category Showcase Photo
                </label>
                {categoryForm.photo_url ? (
                  <div className="relative rounded-2xl overflow-hidden border border-border bg-[#FAF8F4] group">
                    <img
                      src={categoryForm.photo_url}
                      alt="Category Preview"
                      className="w-full h-36 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                      <label className="px-3 py-1.5 rounded-xl bg-white text-green text-xs font-bold cursor-pointer hover:bg-cream transition-colors shadow">
                        <span>Change Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const dataUrl = await processImageFile(file);
                                setCategoryForm((prev) => ({ ...prev, photo_url: dataUrl }));
                                toast.success('Category image uploaded!');
                              } catch (err) {
                                toast.error(err.message || 'Failed to process image');
                              }
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setCategoryForm((prev) => ({ ...prev, photo_url: '' }))}
                        className="p-1.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors shadow"
                        title="Remove Photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-green bg-cream/60 hover:bg-cream rounded-2xl p-6 cursor-pointer transition-colors text-center group">
                    <UploadCloud className="w-8 h-8 text-muted group-hover:text-green transition-colors mb-1.5" />
                    <span className="font-bold text-xs text-[#1C1C1C]">Click to upload category showcase image</span>
                    <span className="text-[10px] text-muted mt-0.5">PNG, JPG, WEBP from your device (Auto-resized)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const dataUrl = await processImageFile(file);
                            setCategoryForm((prev) => ({ ...prev, photo_url: dataUrl }));
                            toast.success('Category image uploaded!');
                          } catch (err) {
                            toast.error(err.message || 'Failed to process image');
                          }
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              <div>
                <label className="block font-bold uppercase text-[#1C1C1C] mb-1">Description</label>
                <textarea
                  rows="2"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-cream"
                />
              </div>

              <div className="pt-3 border-t border-border flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 rounded-xl bg-cream font-bold border border-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-green hover:bg-green-dark text-white font-bold transition-colors"
                >
                  {editingCategory ? 'Update Category' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD TABLE & GENERATE QR */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-border space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <h3 className="font-serif font-bold text-lg text-[#1C1C1C] flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-green" />
                <span>Add Table &amp; Generate QR</span>
              </h3>
              <button onClick={() => setShowTableModal(false)}>
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>

            <form onSubmit={handleSaveTable} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold uppercase text-[#1C1C1C] mb-1">
                  Table Number / Identifier
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 7, 8, T-12, Garden-1"
                  value={tableForm.table_number}
                  onChange={(e) => setTableForm({ ...tableForm, table_number: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-cream text-sm font-bold"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-[#1C1C1C] mb-1">
                  Table Label / Zone (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Garden Patio Terrace 7"
                  value={tableForm.table_label}
                  onChange={(e) => setTableForm({ ...tableForm, table_label: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-cream text-xs"
                />
              </div>

              <div className="p-3.5 bg-[#FAF8F4] rounded-2xl border border-border space-y-1 text-muted">
                <p className="font-bold text-[#1C1C1C] text-[11px] flex items-center space-x-1.5">
                  <QrCode className="w-3.5 h-3.5 text-green" />
                  <span>Instant QR Code Generation</span>
                </p>
                <p className="text-[10px] leading-relaxed">
                  A high-resolution QR scanner linking to <span className="font-mono text-green font-bold">/menu?table={tableForm.table_number || 'N'}</span> will be generated automatically as soon as you save.
                </p>
              </div>

              <div className="pt-3 border-t border-border flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowTableModal(false)}
                  className="px-4 py-2 rounded-xl bg-cream font-bold border border-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-green hover:bg-green-dark text-white font-bold transition-colors shadow flex items-center space-x-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Table &amp; Generate QR</span>
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

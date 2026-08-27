import React, { useState, useEffect, useRef } from 'react';
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
  CheckSquare,
  Square,
  AlertTriangle,
  Filter,
  Award,
  Gift,
  Sparkles,
  Coins,
  Film,
  Video,
  Play,
} from 'lucide-react';
import { FaInstagram, FaYoutube } from 'react-icons/fa';
import QRCode from 'qrcode';
import { api } from '../lib/api';
import { supabase, isSupabaseReady } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import BillInvoiceModal from '../components/BillInvoiceModal';
import ConfirmModal from '../components/ConfirmModal';
import toast from 'react-hot-toast';

// Helper to play an order notification chime using Web Audio API
const playNotificationChime = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
    osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.6);
  } catch { }
};

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

  // Order Selection & Filter States (Batch Actions)
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [isDeletingOrders, setIsDeletingOrders] = useState(false);

  // Selected Order for Bill Modal
  const [selectedBillOrder, setSelectedBillOrder] = useState(null);

  // Attractive Confirm Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    type: 'danger',
    requireMatch: null,
    matchPlaceholder: '',
    isLoading: false,
    onConfirm: () => { },
  });

  // WAHA Live Test & Health State
  const [testPhone, setTestPhone] = useState('7555417487');
  const [isTestingWaha, setIsTestingWaha] = useState(false);
  const [wahaStatus, setWahaStatus] = useState('checking'); // 'connected' | 'disconnected' | 'checking'
  const [wahaLastChecked, setWahaLastChecked] = useState(null);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    cafe_name: cafeSettings?.cafe_name || 'Musafir Cafe & Roasters',
    cafe_address: cafeSettings?.cafe_address || 'Sanctuary Lane, Wanderer Street',
    cafe_gst: cafeSettings?.cafe_gst || '27AABCU9603R1ZM',
    cafe_phone: cafeSettings?.cafe_phone || '+91 7555417487',
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

  // Travel Tokens Rules State & Form
  const [tokenRules, setTokenRules] = useState([]);
  const [showTokenRuleModal, setShowTokenRuleModal] = useState(false);
  const [editingTokenRule, setEditingTokenRule] = useState(null);
  const [tokenRuleForm, setTokenRuleForm] = useState({
    min_order_amount: '',
    tokens_awarded: '',
  });

  // Reward Items Catalog State & Form
  const [rewardItems, setRewardItems] = useState([]);
  const [showRewardItemModal, setShowRewardItemModal] = useState(false);
  const [editingRewardItem, setEditingRewardItem] = useState(null);
  const [rewardItemForm, setRewardItemForm] = useState({
    name: '',
    points_cost: '',
    active: true,
    description: '',
    image_url: '',
  });

  // Registered Customers List with Travel Tokens
  const [customersList, setCustomersList] = useState([]);

  // Social Reels Catalog State & Form
  const [socialReels, setSocialReels] = useState([]);
  const [showReelModal, setShowReelModal] = useState(false);
  const [editingReel, setEditingReel] = useState(null);
  const [reelForm, setReelForm] = useState({
    title: '',
    video_url: '',
    thumbnail_url: '',
    platform: 'video',
    views_count: '15.4k',
    active: true,
  });

  const [searchFilter, setSearchFilter] = useState('');

  // ─── CHARTS & GRAPHS STATE ───
  const [chartRange, setChartRange] = useState('7days'); // 'today' | '7days' | '30days'
  const [chartMetric, setChartMetric] = useState('revenue'); // 'revenue' | 'orders'
  const [activeHoverPoint, setActiveHoverPoint] = useState(null);

  // Helper computations for dynamic interactive charts
  const getTimelineChartData = () => {
    const now = new Date();
    const result = [];

    if (chartRange === 'today') {
      const slots = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
      slots.forEach((slot) => {
        const slotHour = parseInt(slot.split(':')[0], 10);
        const matchingOrders = orders.filter((o) => {
          if (!o.created_at) return false;
          const od = new Date(o.created_at);
          const isToday = od.toDateString() === now.toDateString();
          const orderHour = od.getHours();
          return isToday && orderHour >= slotHour && orderHour < slotHour + 2;
        });

        const rev = matchingOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
        result.push({
          label: slot,
          fullLabel: `Today at ${slot}`,
          revenue: rev,
          orders: matchingOrders.length,
        });
      });
    } else if (chartRange === '7days') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateStr = d.toDateString();
        const shortLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

        const matchingOrders = orders.filter((o) => {
          if (!o.created_at) return false;
          return new Date(o.created_at).toDateString() === dateStr;
        });

        const rev = matchingOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
        result.push({
          label: dayName,
          fullLabel: shortLabel,
          revenue: rev,
          orders: matchingOrders.length,
        });
      }
    } else {
      for (let i = 5; i >= 0; i--) {
        const startDay = new Date();
        startDay.setDate(now.getDate() - (i + 1) * 5);
        const endDay = new Date();
        endDay.setDate(now.getDate() - i * 5);

        const matchingOrders = orders.filter((o) => {
          if (!o.created_at) return false;
          const od = new Date(o.created_at);
          return od >= startDay && od <= endDay;
        });

        const rev = matchingOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
        const label = `${endDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        result.push({
          label,
          fullLabel: `${startDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          revenue: rev,
          orders: matchingOrders.length,
        });
      }
    }

    return result;
  };

  const getTopSellingItems = () => {
    const itemMap = {};
    orders.forEach((o) => {
      (o.items || []).forEach((it) => {
        const name = it.name || 'Artisan Dish';
        if (!itemMap[name]) {
          itemMap[name] = { name, quantity: 0, revenue: 0, photo_url: it.photo_url };
        }
        itemMap[name].quantity += Number(it.quantity) || 1;
        itemMap[name].revenue += (Number(it.price_at_order) || 0) * (Number(it.quantity) || 1);
      });
    });

    return Object.values(itemMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  };

  const getTableActivity = () => {
    const tableMap = {};
    orders.forEach((o) => {
      const t = String(o.table_number || '1');
      if (!tableMap[t]) tableMap[t] = { table: t, orders: 0, revenue: 0 };
      tableMap[t].orders += 1;
      tableMap[t].revenue += Number(o.total) || 0;
    });

    return Object.values(tableMap)
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 6);
  };

  const getPaymentAndLoyaltyStats = () => {
    let upiCount = 0;
    let cashCount = 0;
    let identifiedGuests = 0;
    let anonymousGuests = 0;

    orders.forEach((o) => {
      if (o.payment_method === 'UPI' || (o.payment_details && o.payment_details.includes('UPI'))) {
        upiCount++;
      } else {
        cashCount++;
      }
      if (o.customer_phone) {
        identifiedGuests++;
      } else {
        anonymousGuests++;
      }
    });

    const total = orders.length || 1;
    return {
      upiCount,
      cashCount,
      upiPercent: Math.round((upiCount / total) * 100),
      cashPercent: Math.round((cashCount / total) * 100),
      identifiedGuests,
      anonymousGuests,
      identifiedPercent: Math.round((identifiedGuests / total) * 100),
    };
  };

  // Check auth on load
  useEffect(() => {
    const auth = localStorage.getItem('musafir_admin_auth');
    if (!auth) {
      navigate('/login');
    }
  }, [navigate]);

  const prevOrderCountRef = useRef(0);

  const loadData = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const [analyticsData, catData, itemsData, ordersData, tablesData, rulesData, rewardsData, dbCustomers, reelsData] = await Promise.all([
        api.getAnalytics(),
        api.getCategories(),
        api.getAllMenuItems(),
        api.getOrders(),
        api.getTables(),
        api.getTokenRules(),
        api.getRewardItems(false),
        api.getAllCustomers(),
        api.getSocialReels(false),
      ]);

      setAnalytics(analyticsData);
      setCategories(catData || []);
      setMenuItems(itemsData || []);

      const newOrders = ordersData || [];
      // Play sound and toast notification when new orders arrive
      if (!isInitial && newOrders.length > prevOrderCountRef.current && prevOrderCountRef.current > 0) {
        playNotificationChime();
        const latest = newOrders[0];
        toast.success(`🔔 New Order #${latest?.order_number || ''} for Table #${latest?.table_number || '1'}!`, {
          duration: 5000,
        });
      }
      prevOrderCountRef.current = newOrders.length;
      setOrders(newOrders);

      setTables(tablesData || []);
      setTokenRules(rulesData || []);
      setRewardItems(rewardsData || []);
      setCustomersList(dbCustomers || []);
      setSocialReels(reelsData || []);
    } catch (err) {
      console.error('Admin data load error:', err);
      if (isInitial) toast.error('Failed to load admin data');
    } finally {
      if (isInitial) setLoading(false);
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
          phone: testPhone || '7555417487',
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

  // ─── INSTANT REAL-TIME DATA SYNC (Like Socket.io / WebSockets) ───
  useEffect(() => {
    loadData(true);
    checkWahaHealth();

    // 1. SUPABASE REALTIME WEBSOCKET FEED (Instant live push across all devices)
    let channel = null;
    if (isSupabaseReady && supabase) {
      channel = supabase
        .channel('admin-realtime-global-feed')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          loadData(false);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => {
          loadData(false);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => {
          loadData(false);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
          loadData(false);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
          loadData(false);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, () => {
          loadData(false);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'token_rules' }, () => {
          loadData(false);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reward_items' }, () => {
          loadData(false);
        })
        .subscribe();
    }

    // 2. BROADCAST CHANNEL (Instant 0ms Cross-Tab Sync across all open windows)
    let bc = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel('musafir_orders_channel');
        bc.onmessage = () => {
          loadData(false);
        };
      } catch { }
    }

    // 3. WINDOW CUSTOM EVENT LISTENERS (0ms intra-window communication)
    const handleOrderChange = () => loadData(false);
    window.addEventListener('musafir:new-order', handleOrderChange);
    window.addEventListener('musafir:order-change', handleOrderChange);
    window.addEventListener('musafir:order-status', handleOrderChange);
    window.addEventListener('musafir:customer-change', handleOrderChange);

    // 4. HEARTBEAT LIVE POLLING (Ensures 100% sync even through mobile reconnects)
    const pollTimer = setInterval(() => {
      loadData(false);
    }, 3000);

    return () => {
      if (channel && supabase) supabase.removeChannel(channel);
      if (bc) bc.close();
      window.removeEventListener('musafir:new-order', handleOrderChange);
      window.removeEventListener('musafir:order-change', handleOrderChange);
      window.removeEventListener('musafir:order-status', handleOrderChange);
      window.removeEventListener('musafir:customer-change', handleOrderChange);
      clearInterval(pollTimer);
    };
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

  const handleDeleteItem = (itemId, itemName) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Menu Item?',
      message: `Are you sure you want to delete "${itemName || 'this item'}"? It will be removed from your cafe menu catalog.`,
      confirmText: 'Delete Item',
      cancelText: 'Cancel',
      type: 'danger',
      requireMatch: null,
      onConfirm: async () => {
        try {
          await api.deleteMenuItem(itemId);
          setMenuItems((prev) => prev.filter((m) => m.id !== itemId));
          toast.success('Menu item deleted');
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } catch (err) {
          toast.error('Failed to delete item');
        }
      },
    });
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

  const handleDeleteCategory = (categoryId, categoryName) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Category?',
      message: `Are you sure you want to delete category "${categoryName || 'this category'}"? All menu items linked to this section may also be affected.`,
      confirmText: 'Delete Category',
      cancelText: 'Cancel',
      type: 'danger',
      requireMatch: null,
      onConfirm: async () => {
        try {
          setCategories((prev) => prev.filter((c) => c.id !== categoryId));
          await api.deleteCategory(categoryId);
          toast.success('Category deleted successfully');
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          loadData();
        } catch (err) {
          console.error('Delete category error:', err);
          toast.error('Failed to delete category');
          loadData();
        }
      },
    });
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

  const handleDeleteTable = (tableId, tableNum) => {
    setConfirmModal({
      isOpen: true,
      title: `Delete Table #${tableNum}?`,
      message: `Are you sure you want to delete Table #${tableNum}? The live QR scanner standee for this table will no longer work.`,
      confirmText: 'Delete Table',
      cancelText: 'Cancel',
      type: 'danger',
      requireMatch: null,
      onConfirm: async () => {
        try {
          setTables((prev) => prev.filter((t) => t.id !== tableId));
          await api.deleteTable(tableId);
          toast.success(`Table #${tableNum} deleted`);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          loadData();
        } catch (err) {
          console.error('Delete table error:', err);
          toast.error('Failed to delete table');
          loadData();
        }
      },
    });
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

  // Order Selection & Batch Action Handlers
  const handleToggleSelectOrder = (orderId) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleSelectAllOrders = (displayedOrders) => {
    const displayedIds = displayedOrders.map((o) => o.id);
    const allSelected = displayedIds.length > 0 && displayedIds.every((id) => selectedOrderIds.includes(id));
    if (allSelected) {
      setSelectedOrderIds((prev) => prev.filter((id) => !displayedIds.includes(id)));
    } else {
      setSelectedOrderIds((prev) => Array.from(new Set([...prev, ...displayedIds])));
    }
  };

  const handleDeleteOrder = (orderId, orderNumber) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Order Record?',
      message: `Are you sure you want to delete Order #${orderNumber || orderId.slice(0, 5)}? This order and its item records will be permanently deleted.`,
      confirmText: 'Delete Order',
      cancelText: 'Cancel',
      type: 'danger',
      requireMatch: null,
      onConfirm: async () => {
        try {
          setOrders((prev) => prev.filter((o) => o.id !== orderId));
          setSelectedOrderIds((prev) => prev.filter((id) => id !== orderId));
          await api.deleteOrder(orderId);
          toast.success('Order deleted successfully');
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          loadData();
        } catch (err) {
          console.error('Delete order error:', err);
          toast.error('Failed to delete order');
          loadData();
        }
      },
    });
  };

  const handleDeleteSelectedOrders = () => {
    if (selectedOrderIds.length === 0) return;
    setConfirmModal({
      isOpen: true,
      title: `Delete ${selectedOrderIds.length} Selected Orders?`,
      message: `You are about to delete ${selectedOrderIds.length} selected order(s) permanently from the database. This action cannot be undone.`,
      confirmText: `Delete ${selectedOrderIds.length} Orders`,
      cancelText: 'Cancel',
      type: 'danger',
      requireMatch: null,
      onConfirm: async () => {
        try {
          setIsDeletingOrders(true);
          const idsToDelete = [...selectedOrderIds];
          setOrders((prev) => prev.filter((o) => !idsToDelete.includes(o.id)));
          setSelectedOrderIds([]);
          await api.deleteOrders(idsToDelete);
          toast.success(`Deleted ${idsToDelete.length} selected order(s) successfully!`);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          loadData();
        } catch (err) {
          console.error('Batch delete orders error:', err);
          toast.error('Failed to delete selected orders');
          loadData();
        } finally {
          setIsDeletingOrders(false);
        }
      },
    });
  };

  const handleDeleteAllOrders = () => {
    if (orders.length === 0) {
      toast.error('No orders available to delete');
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: 'Delete ALL Orders?',
      message: `Are you sure you want to permanently delete all ${orders.length} orders in the entire system? This action cannot be undone.`,
      confirmText: 'Delete All Orders',
      cancelText: 'Cancel',
      type: 'danger',
      requireMatch: null,
      onConfirm: async () => {
        try {
          setIsDeletingOrders(true);
          setOrders([]);
          setSelectedOrderIds([]);
          await api.deleteAllOrders();
          toast.success('All orders have been deleted permanently!');
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          loadData();
        } catch (err) {
          console.error('Delete all orders error:', err);
          toast.error('Failed to delete all orders');
          loadData();
        } finally {
          setIsDeletingOrders(false);
        }
      },
    });
  };

  const handleTogglePaymentStatus = async (order) => {
    const newStatus = order.payment_status === 'Paid' ? 'Pending' : 'Paid';
    try {
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, payment_status: newStatus } : o))
      );
      await api.updateOrderPayment(order.id, { payment_status: newStatus });
      toast.success(`Order #${order.order_number || order.id.slice(0, 5)} marked as ${newStatus}`);
    } catch (err) {
      console.error('Toggle payment error:', err);
      toast.error('Failed to update payment status');
      loadData();
    }
  };

  // ─── TRAVEL TOKENS RULES HANDLERS ───
  const handleSaveTokenRule = async (e) => {
    e.preventDefault();
    try {
      if (!tokenRuleForm.min_order_amount || !tokenRuleForm.tokens_awarded) {
        toast.error('Please enter min order amount and tokens awarded');
        return;
      }
      if (editingTokenRule) {
        await api.updateTokenRule(editingTokenRule.id, tokenRuleForm);
        toast.success('Token rule updated successfully');
      } else {
        await api.createTokenRule(tokenRuleForm);
        toast.success('New token rule added successfully');
      }
      setShowTokenRuleModal(false);
      setEditingTokenRule(null);
      setTokenRuleForm({ min_order_amount: '', tokens_awarded: '' });
      loadData();
    } catch (err) {
      toast.error('Failed to save token rule');
    }
  };

  const handleDeleteTokenRule = (ruleId, minAmount) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Token Rule?',
      message: `Are you sure you want to delete the earning rule for orders above ₹${minAmount}?`,
      confirmText: 'Delete Rule',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.deleteTokenRule(ruleId);
          toast.success('Token rule deleted');
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          loadData();
        } catch {
          toast.error('Failed to delete rule');
        }
      },
    });
  };

  // ─── REWARD ITEMS HANDLERS ───
  const handleSaveRewardItem = async (e) => {
    e.preventDefault();
    try {
      if (!rewardItemForm.name || !rewardItemForm.points_cost) {
        toast.error('Please enter item name and points cost');
        return;
      }
      if (editingRewardItem) {
        await api.updateRewardItem(editingRewardItem.id, rewardItemForm);
        toast.success('Reward item updated successfully');
      } else {
        await api.createRewardItem(rewardItemForm);
        toast.success('New reward item added to catalog');
      }
      setShowRewardItemModal(false);
      setEditingRewardItem(null);
      setRewardItemForm({ name: '', points_cost: '', active: true, description: '', image_url: '' });
      loadData();
    } catch (err) {
      toast.error('Failed to save reward item');
    }
  };

  const handleToggleRewardActive = async (item) => {
    try {
      await api.toggleRewardItemActive(item.id, !item.active);
      toast.success(`"${item.name}" is now ${!item.active ? 'Active' : 'Inactive'}`);
      loadData();
    } catch {
      toast.error('Failed to update reward status');
    }
  };

  const handleDeleteRewardItem = (itemId, itemName) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Reward Item?',
      message: `Are you sure you want to remove "${itemName}" from the rewards catalog?`,
      confirmText: 'Delete Reward',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.deleteRewardItem(itemId);
          toast.success('Reward item removed');
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          loadData();
        } catch {
          toast.error('Failed to delete reward');
        }
      },
    });
  };

  // ─── CUSTOMER TOKENS ADJUSTMENT ───
  const handleAdjustCustomerTokens = async (cust, delta) => {
    try {
      const phoneToUse = cust.phone || cust.mobile;
      if (!phoneToUse || phoneToUse === 'N/A') {
        toast.error('No mobile number available for this guest');
        return;
      }
      await api.updateCustomerTokens(phoneToUse, delta);
      toast.success(`${delta > 0 ? `+${delta}` : delta} Tokens updated for ${cust.name}`);
      loadData();
    } catch {
      toast.error('Failed to adjust tokens');
    }
  };

  const handleDeleteCustomer = (cust) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Customer Record?',
      message: `Are you sure you want to delete "${cust.name}" (${cust.phone}) and remove their loyalty Travel Tokens profile? This action is permanent.`,
      confirmText: 'Delete Customer',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        try {
          const target = cust.phone || cust.mobile || cust.id;
          await api.deleteCustomer(target);
          toast.success(`Customer "${cust.name}" deleted successfully!`);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          loadData();
        } catch {
          toast.error('Failed to delete customer record');
        }
      },
    });
  };

  const handleDeleteAllCustomers = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete All Customer Records?',
      message: `Are you sure you want to delete all ${uniqueCustomers.length} customer records and wipe their loyalty Travel Tokens? This action is permanent and cannot be undone.`,
      confirmText: 'Delete All Guests',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.deleteAllCustomers();
          toast.success('All customer records have been deleted successfully!');
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          loadData();
        } catch {
          toast.error('Failed to delete all customers');
        }
      },
    });
  };

  // Combined Customers List (DB records + Order ledger metrics)
  const allCombinedCustomers = (() => {
    const map = new Map();

    // 1. Registered Customers from DB
    for (const c of customersList) {
      const key = c.mobile || c.phone;
      if (!key) continue;
      map.set(key, {
        name: c.name || 'Musafir Guest',
        phone: key,
        mobile: key,
        travel_tokens: Number(c.travel_tokens || 0),
        lastTable: c.table_number || '-',
        lastOrderDate: c.created_at,
        totalOrders: 0,
        totalSpent: 0,
      });
    }

    // 2. Order metrics
    for (const o of orders) {
      const key = o.customer_phone || o.customer_mobile || o.customer_name;
      if (!key) continue;
      const existing = map.get(key) || {
        name: o.customer_name || 'Musafir Guest',
        phone: o.customer_phone || 'N/A',
        mobile: o.customer_phone || 'N/A',
        travel_tokens: 0,
        lastTable: o.table_number || '-',
        lastOrderDate: o.created_at,
        totalOrders: 0,
        totalSpent: 0,
      };
      existing.totalOrders += 1;
      existing.totalSpent += Number(o.total || 0);
      if (o.table_number) existing.lastTable = o.table_number;
      if (o.created_at) existing.lastOrderDate = o.created_at;
      map.set(key, existing);
    }

    return Array.from(map.values());
  })();

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      !orderSearchQuery ||
      (o.order_number && String(o.order_number).toLowerCase().includes(orderSearchQuery.toLowerCase())) ||
      (o.id && o.id.toLowerCase().includes(orderSearchQuery.toLowerCase())) ||
      (o.table_number && String(o.table_number).toLowerCase().includes(orderSearchQuery.toLowerCase())) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(orderSearchQuery.toLowerCase())) ||
      (o.customer_phone && o.customer_phone.toLowerCase().includes(orderSearchQuery.toLowerCase()));

    const matchesStatus =
      orderStatusFilter === 'ALL' ||
      (o.status && o.status.toLowerCase() === orderStatusFilter.toLowerCase());

    return matchesSearch && matchesStatus;
  });

  const filteredMenuItems = menuItems.filter((m) =>
    m.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  // ─── REEL VIDEOS MANAGEMENT HANDLERS ───
  const handleSaveReel = async (e) => {
    e.preventDefault();
    if (!reelForm.video_url.trim()) {
      toast.error('Please enter a valid Reel or Video link');
      return;
    }

    const trimmedUrl = reelForm.video_url.trim();
    let detectedPlatform = 'video';
    if (trimmedUrl.includes('instagram.com') || trimmedUrl.includes('instagr.am')) {
      detectedPlatform = 'instagram';
    } else if (trimmedUrl.includes('youtube.com') || trimmedUrl.includes('youtu.be')) {
      detectedPlatform = 'youtube';
    }

    try {
      if (editingReel) {
        await api.updateSocialReel(editingReel.id, {
          ...reelForm,
          platform: detectedPlatform,
        });
        toast.success('Reel updated successfully');
      } else {
        await api.createSocialReel({
          ...reelForm,
          platform: detectedPlatform,
        });
        toast.success('New Social Reel link added to website!');
      }
      setShowReelModal(false);
      setEditingReel(null);
      setReelForm({
        title: '',
        video_url: '',
        thumbnail_url: '',
        platform: 'video',
        views_count: '15.4k',
        active: true,
      });
      loadData();
    } catch (err) {
      toast.error('Failed to save Reel link');
    }
  };

  const openCreateReelModal = () => {
    setEditingReel(null);
    setReelForm({
      title: '',
      video_url: '',
      thumbnail_url: '',
      platform: 'video',
      views_count: '18.2k',
      active: true,
    });
    setShowReelModal(true);
  };

  const openEditReelModal = (reel) => {
    setEditingReel(reel);
    setReelForm({
      title: reel.title || '',
      video_url: reel.video_url || '',
      thumbnail_url: reel.thumbnail_url || '',
      platform: reel.platform || 'video',
      views_count: reel.views_count || '12.5k',
      active: reel.active !== false,
    });
    setShowReelModal(true);
  };

  const handleToggleReelActive = async (reel) => {
    try {
      const newActive = !reel.active;
      setSocialReels((prev) =>
        prev.map((r) => (r.id === reel.id ? { ...r, active: newActive } : r))
      );
      await api.updateSocialReel(reel.id, { active: newActive });
      toast.success(`Reel ${newActive ? 'activated' : 'hidden'} on website`);
    } catch {
      toast.error('Failed to update reel status');
    }
  };

  const handleDeleteReel = (reelId, title) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Social Reel?',
      message: `Are you sure you want to remove "${title || 'this reel'}" from the website?`,
      confirmText: 'Delete Reel',
      cancelText: 'Cancel',
      type: 'danger',
      requireMatch: null,
      onConfirm: async () => {
        try {
          setSocialReels((prev) => prev.filter((r) => r.id !== reelId));
          await api.deleteSocialReel(reelId);
          toast.success('Reel removed successfully');
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          loadData();
        } catch {
          toast.error('Failed to delete reel');
        }
      },
    });
  };

  const uniqueCustomers = allCombinedCustomers;

  return (
    <div className="min-h-screen bg-cream flex flex-col md:flex-row font-sans">

      {/* ─── 1. MOBILE TOP ADMIN BAR (md:hidden) ─── */}
      <header className="md:hidden bg-green text-white px-4 py-3 sticky top-0 z-40 shadow-md border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <img
            src="/newlg.png"
            alt="Musafir Logo"
            className="w-9 h-9 rounded-full object-cover shrink-0"
          />
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
                  <img
                    src="/newlg.png"
                    alt="Musafir Logo"
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
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
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ${activeTab === 'overview'
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
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ${activeTab === 'menu'
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
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ${activeTab === 'categories'
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
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ${activeTab === 'tables'
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
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ${activeTab === 'orders'
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
                    setActiveTab('token_rules');
                    setMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ${activeTab === 'token_rules'
                    ? 'bg-white text-green shadow-md font-bold'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  <Award className="w-4 h-4 text-[#E0A96D]" />
                  <span>Token Earning Rules</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('reward_items');
                    setMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ${activeTab === 'reward_items'
                    ? 'bg-white text-green shadow-md font-bold'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  <Gift className="w-4 h-4 text-[#E0A96D]" />
                  <span>Reward Items Catalog</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('reels');
                    setMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ${activeTab === 'reels'
                    ? 'bg-white text-green shadow-md font-bold'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  <Film className="w-4 h-4 text-rose-400" />
                  <span>Social Reels ({socialReels.length})</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('customers');
                    setMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ${activeTab === 'customers'
                    ? 'bg-white text-green shadow-md font-bold'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  <User className="w-4 h-4" />
                  <span>Guest &amp; Loyalty ({uniqueCustomers.length})</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ${activeTab === 'settings'
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
            <img
              src="/newlg.png"
              alt="Musafir Cafe Logo"
              className="w-11 h-11 rounded-full object-cover shrink-0"
            />
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
              <span>Menu & Stock ({menuItems.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl transition-all ${activeTab === 'categories'
                ? 'bg-white text-green shadow-md font-bold'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
            >
              <Layers className="w-4 h-4" />
              <span>Menu Categories ({categories.length})</span>
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

            {/* Travel Tokens Rules */}
            <button
              onClick={() => setActiveTab('token_rules')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl transition-all ${activeTab === 'token_rules'
                ? 'bg-white text-green shadow-md font-bold'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
            >
              <Award className="w-4 h-4 text-[#E0A96D]" />
              <span>Token Earning Rules</span>
            </button>

            {/* Reward Items Catalog */}
            <button
              onClick={() => setActiveTab('reward_items')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl transition-all ${activeTab === 'reward_items'
                ? 'bg-white text-green shadow-md font-bold'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
            >
              <Gift className="w-4 h-4 text-[#E0A96D]" />
              <span>Reward Items Catalog</span>
            </button>

            {/* Social Reel Videos */}
            <button
              onClick={() => setActiveTab('reels')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl transition-all ${activeTab === 'reels'
                ? 'bg-white text-green shadow-md font-bold'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
            >
              <Film className="w-4 h-4 text-rose-400" />
              <span>Social Reels ({socialReels.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl transition-all ${activeTab === 'customers'
                ? 'bg-white text-green shadow-md font-bold'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
            >
              <User className="w-4 h-4" />
              <span>Guest &amp; Loyalty ({uniqueCustomers.length})</span>
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
                  ₹{analytics?.totalRevenue?.toFixed(2) || '0.00'}
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
                    className={`w-2 h-2 rounded-full ${wahaStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-amber-500'
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

            {/* ─── INTERACTIVE REVENUE & SALES TIMELINE GRAPH ─── */}
            {(() => {
              const timelineData = getTimelineChartData();
              const topSelling = getTopSellingItems();
              const tableActivity = getTableActivity();
              const paymentStats = getPaymentAndLoyaltyStats();

              const values = timelineData.map((d) => (chartMetric === 'revenue' ? d.revenue : d.orders));
              const maxVal = Math.max(...values, chartMetric === 'revenue' ? 200 : 5);
              const minVal = 0;
              const rangeSum = values.reduce((a, b) => a + b, 0);

              const svgWidth = 700;
              const svgHeight = 220;
              const padX = 45;
              const padY = 25;
              const plotW = svgWidth - padX * 2;
              const plotH = svgHeight - padY * 2;

              const points = timelineData.map((d, i) => {
                const val = chartMetric === 'revenue' ? d.revenue : d.orders;
                const x = padX + (i / Math.max(timelineData.length - 1, 1)) * plotW;
                const y = padY + (1 - (val - minVal) / (maxVal - minVal || 1)) * plotH;
                return { x, y, data: d, val };
              });

              const linePath = points.reduce((acc, pt, i) => {
                if (i === 0) return `M ${pt.x} ${pt.y}`;
                const prev = points[i - 1];
                const cx1 = prev.x + (pt.x - prev.x) / 2;
                const cy1 = prev.y;
                const cx2 = prev.x + (pt.x - prev.x) / 2;
                const cy2 = pt.y;
                return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${pt.x} ${pt.y}`;
              }, '');

              const areaPath = points.length > 0
                ? `${linePath} L ${points[points.length - 1].x} ${svgHeight - padY} L ${points[0].x} ${svgHeight - padY} Z`
                : '';

              return (
                <>
                  {/* MAIN CHART CONTAINER */}
                  <div className="bg-white rounded-3xl p-5 sm:p-7 border border-border shadow-xs space-y-5">
                    {/* Chart Header Controls */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-2 border-b border-border/60">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-serif font-bold text-lg sm:text-xl text-[#1C1C1C]">
                            {chartMetric === 'revenue' ? '📈 Revenue Trend Graph' : '📊 Order Volume Graph'}
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green/10 text-green uppercase tracking-wider">
                            Live Dynamic
                          </span>
                        </div>
                        <p className="text-xs text-muted mt-0.5">
                          {chartMetric === 'revenue' ? 'Total Period Revenue: ' : 'Total Period Orders: '}
                          <strong className="text-[#1C1C1C] font-mono text-sm">
                            {chartMetric === 'revenue' ? `₹${rangeSum.toFixed(2)}` : rangeSum}
                          </strong>
                        </p>
                      </div>

                      {/* Filter & Metric Toggles */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Metric Selector */}
                        <div className="bg-cream p-1 rounded-xl flex items-center text-xs font-semibold">
                          <button
                            onClick={() => setChartMetric('revenue')}
                            className={`px-3 py-1.5 rounded-lg transition-all ${chartMetric === 'revenue'
                              ? 'bg-white text-green font-bold shadow-xs'
                              : 'text-muted hover:text-[#1C1C1C]'
                              }`}
                          >
                            ₹ Revenue
                          </button>
                          <button
                            onClick={() => setChartMetric('orders')}
                            className={`px-3 py-1.5 rounded-lg transition-all ${chartMetric === 'orders'
                              ? 'bg-white text-green font-bold shadow-xs'
                              : 'text-muted hover:text-[#1C1C1C]'
                              }`}
                          >
                            Orders
                          </button>
                        </div>

                        {/* Range Selector */}
                        <div className="bg-cream p-1 rounded-xl flex items-center text-xs font-semibold">
                          <button
                            onClick={() => setChartRange('today')}
                            className={`px-3 py-1.5 rounded-lg transition-all ${chartRange === 'today'
                              ? 'bg-green text-white font-bold shadow-xs'
                              : 'text-muted hover:text-[#1C1C1C]'
                              }`}
                          >
                            Today
                          </button>
                          <button
                            onClick={() => setChartRange('7days')}
                            className={`px-3 py-1.5 rounded-lg transition-all ${chartRange === '7days'
                              ? 'bg-green text-white font-bold shadow-xs'
                              : 'text-muted hover:text-[#1C1C1C]'
                              }`}
                          >
                            7 Days
                          </button>
                          <button
                            onClick={() => setChartRange('30days')}
                            className={`px-3 py-1.5 rounded-lg transition-all ${chartRange === '30days'
                              ? 'bg-green text-white font-bold shadow-xs'
                              : 'text-muted hover:text-[#1C1C1C]'
                              }`}
                          >
                            30 Days
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* SVG Curve Chart */}
                    <div className="relative w-full overflow-hidden">
                      <div className="w-full overflow-x-auto">
                        <svg
                          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                          className="w-full h-48 sm:h-64 select-none"
                        >
                          <defs>
                            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#243524" stopOpacity="0.32" />
                              <stop offset="60%" stopColor="#243524" stopOpacity="0.08" />
                              <stop offset="100%" stopColor="#243524" stopOpacity="0" />
                            </linearGradient>
                          </defs>

                          {/* Horizontal Gridlines */}
                          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                            const y = padY + ratio * plotH;
                            const labelVal = Math.round(maxVal * (1 - ratio));
                            return (
                              <g key={idx}>
                                <line
                                  x1={padX}
                                  y1={y}
                                  x2={svgWidth - padX}
                                  y2={y}
                                  stroke="#EAE5DC"
                                  strokeDasharray="4 4"
                                  strokeWidth="1"
                                />
                                <text
                                  x={padX - 8}
                                  y={y + 3}
                                  textAnchor="end"
                                  className="text-[9px] fill-muted font-mono"
                                >
                                  {chartMetric === 'revenue' ? `₹${labelVal}` : labelVal}
                                </text>
                              </g>
                            );
                          })}

                          {/* Gradient Fill Area */}
                          {areaPath && (
                            <path d={areaPath} fill="url(#areaGradient)" />
                          )}

                          {/* Spline Line */}
                          {linePath && (
                            <path
                              d={linePath}
                              fill="none"
                              stroke="#243524"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          )}

                          {/* Data Points and Interactivity */}
                          {points.map((pt, i) => {
                            const isHovered = activeHoverPoint?.index === i;
                            return (
                              <g key={i}>
                                {/* Vertical hover guide line */}
                                {isHovered && (
                                  <line
                                    x1={pt.x}
                                    y1={padY}
                                    x2={pt.x}
                                    y2={svgHeight - padY}
                                    stroke="#243524"
                                    strokeDasharray="2 2"
                                    strokeWidth="1"
                                  />
                                )}

                                {/* Outer circle */}
                                <circle
                                  cx={pt.x}
                                  cy={pt.y}
                                  r={isHovered ? 7 : 4.5}
                                  fill="#FFFFFF"
                                  stroke="#243524"
                                  strokeWidth={isHovered ? 3.5 : 2.5}
                                  className="transition-all duration-150 cursor-pointer"
                                  onMouseEnter={() =>
                                    setActiveHoverPoint({ index: i, ...pt })
                                  }
                                  onMouseLeave={() => setActiveHoverPoint(null)}
                                />

                                {/* X-Axis Label */}
                                <text
                                  x={pt.x}
                                  y={svgHeight - 6}
                                  textAnchor="middle"
                                  className={`text-[10px] ${isHovered ? 'fill-[#1C1C1C] font-bold' : 'fill-muted'
                                    }`}
                                >
                                  {pt.data.label}
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      </div>

                      {/* Tooltip Float Popover */}
                      {activeHoverPoint && (
                        <div
                          className="absolute z-20 pointer-events-none -top-1 px-3.5 py-2 rounded-xl bg-[#1C1C1C] text-white text-xs shadow-xl border border-white/20 -translate-x-1/2 transition-all duration-75"
                          style={{
                            left: `${(activeHoverPoint.x / svgWidth) * 100}%`,
                          }}
                        >
                          <div className="font-semibold text-white/80 text-[10px]">
                            {activeHoverPoint.data.fullLabel}
                          </div>
                          <div className="font-mono font-bold text-sm text-[#E0A96D] mt-0.5">
                            {chartMetric === 'revenue'
                              ? `₹${activeHoverPoint.data.revenue.toFixed(2)}`
                              : `${activeHoverPoint.data.orders} Orders`}
                          </div>
                          <div className="text-[10px] text-white/60">
                            {chartMetric === 'revenue'
                              ? `${activeHoverPoint.data.orders} orders placed`
                              : `₹${activeHoverPoint.data.revenue.toFixed(2)} earned`}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ─── 3 SUB-ANALYTICS CARDS ROW ─── */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* CARD 1: TOP SELLING MENU ITEMS */}
                    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-border shadow-xs space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif font-bold text-base text-[#1C1C1C] flex items-center space-x-2">
                          <Coffee className="w-4 h-4 text-green" />
                          <span>Top Selling Delights</span>
                        </h4>
                        <span className="text-[10px] text-muted font-bold uppercase">By Volume</span>
                      </div>

                      {topSelling.length === 0 ? (
                        <div className="text-center py-8 text-muted text-xs">
                          No order item data yet
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {topSelling.map((it, idx) => {
                            const maxQty = topSelling[0]?.quantity || 1;
                            const percent = Math.round((it.quantity / maxQty) * 100);
                            return (
                              <div key={it.name} className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-semibold text-[#1C1C1C] flex items-center space-x-1.5 truncate max-w-[170px]">
                                    <span className="w-4 h-4 rounded-full bg-cream text-muted text-[10px] font-bold flex items-center justify-center shrink-0">
                                      #{idx + 1}
                                    </span>
                                    <span className="truncate">{it.name}</span>
                                  </span>
                                  <span className="text-muted text-[11px] font-mono shrink-0">
                                    <strong className="text-[#1C1C1C]">{it.quantity}</strong> sold (₹{it.revenue.toFixed(0)})
                                  </span>
                                </div>
                                <div className="h-2 w-full bg-cream rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-green rounded-full transition-all duration-500"
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* CARD 2: TABLE ACTIVITY & UTILIZATION */}
                    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-border shadow-xs space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif font-bold text-base text-[#1C1C1C] flex items-center space-x-2">
                          <QrCode className="w-4 h-4 text-green" />
                          <span>Table Demand</span>
                        </h4>
                        <span className="text-[10px] text-muted font-bold uppercase">Utilization</span>
                      </div>

                      {tableActivity.length === 0 ? (
                        <div className="text-center py-8 text-muted text-xs">
                          No table activity recorded
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {tableActivity.map((t) => {
                            const totalOrd = orders.length || 1;
                            const share = Math.round((t.orders / totalOrd) * 100);
                            return (
                              <div key={t.table} className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-semibold text-[#1C1C1C] flex items-center space-x-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span>Table #{t.table}</span>
                                  </span>
                                  <span className="text-muted text-[11px] font-mono">
                                    <strong className="text-[#1C1C1C]">{t.orders}</strong> orders ({share}%)
                                  </span>
                                </div>
                                <div className="h-2 w-full bg-cream rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-[#E0A96D] rounded-full transition-all duration-500"
                                    style={{ width: `${share}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* CARD 3: PAYMENT & LOYALTY INTELLIGENCE */}
                    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-border shadow-xs space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif font-bold text-base text-[#1C1C1C] flex items-center space-x-2">
                          <Award className="w-4 h-4 text-[#E0A96D]" />
                          <span>Payment &amp; Loyalty</span>
                        </h4>
                        <span className="text-[10px] text-muted font-bold uppercase">Insights</span>
                      </div>

                      <div className="space-y-4">
                        {/* Payment Breakdown Bar */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#1C1C1C]">Payment Methods</span>
                            <span className="text-muted text-[10px] font-mono">
                              UPI: {paymentStats.upiPercent}% | Cash: {paymentStats.cashPercent}%
                            </span>
                          </div>
                          <div className="h-2.5 w-full bg-cream rounded-full overflow-hidden flex">
                            <div
                              className="h-full bg-[#25D366] transition-all duration-500"
                              style={{ width: `${paymentStats.upiPercent}%` }}
                              title={`UPI: ${paymentStats.upiCount} orders`}
                            />
                            <div
                              className="h-full bg-amber-500 transition-all duration-500"
                              style={{ width: `${paymentStats.cashPercent}%` }}
                              title={`Cash: ${paymentStats.cashCount} orders`}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-muted">
                            <span className="flex items-center space-x-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#25D366]" />
                              <span>UPI (GPay / QR)</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              <span>Cash on Counter</span>
                            </span>
                          </div>
                        </div>

                        {/* Guest Identification Ratio */}
                        <div className="space-y-1.5 pt-2 border-t border-border/50">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#1C1C1C]">Loyalty Capture Rate</span>
                            <span className="text-green text-xs font-bold font-mono">
                              {paymentStats.identifiedPercent}%
                            </span>
                          </div>
                          <div className="h-2.5 w-full bg-cream rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green rounded-full transition-all duration-500"
                              style={{ width: `${paymentStats.identifiedPercent}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-muted">
                            <span>{paymentStats.identifiedGuests} Identified Loyalty Members</span>
                            <span>{paymentStats.anonymousGuests} Walk-ins</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
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
                          ₹{Number(item.price).toFixed(2)}
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
                              onClick={() => handleDeleteItem(item.id, item.name)}
                              className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
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
                      onClick={() => handleDeleteCategory(cat.id, cat.name)}
                      className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
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
            {/* Header & Main Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1C1C]">
                    Orders Ledger &amp; Invoices
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green/10 text-green border border-green/20">
                    {orders.length} Total
                  </span>
                </div>
                <p className="text-xs text-muted mt-1">
                  Manage incoming cafe orders, print receipts, or perform batch cleanup.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Delete Selected (Batch) Button */}
                {selectedOrderIds.length > 0 && (
                  <div className="flex items-center space-x-2 animate-fade-in">
                    <button
                      onClick={handleDeleteSelectedOrders}
                      disabled={isDeletingOrders}
                      className="py-2 px-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                      title="Delete all selected orders"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Selected ({selectedOrderIds.length})</span>
                    </button>
                    <button
                      onClick={() => setSelectedOrderIds([])}
                      className="py-2 px-3 rounded-xl bg-white hover:bg-border text-[#555] border border-border text-xs font-semibold transition-colors cursor-pointer"
                      title="Deselect all"
                    >
                      Deselect
                    </button>
                  </div>
                )}

                {/* Delete All Orders Button */}
                <button
                  onClick={handleDeleteAllOrders}
                  disabled={isDeletingOrders || orders.length === 0}
                  className="py-2 px-3.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center space-x-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Permanently delete all orders"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  <span>Delete All Orders</span>
                </button>
              </div>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="bg-white rounded-2xl p-4 border border-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  placeholder="Search by order #, table, customer name or phone..."
                  className="w-full pl-10 pr-9 py-2 rounded-xl border border-border bg-cream text-xs text-[#1C1C1C] focus:outline-none focus:ring-1 focus:ring-green"
                />
                {orderSearchQuery && (
                  <button
                    onClick={() => setOrderSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-black p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                {['ALL', 'New', 'Preparing', 'Ready', 'Served', 'Cancelled'].map((statusKey) => (
                  <button
                    key={statusKey}
                    onClick={() => setOrderStatusFilter(statusKey)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${orderStatusFilter === statusKey
                      ? 'bg-green text-white shadow-xs'
                      : 'bg-cream text-muted hover:bg-border hover:text-[#1C1C1C]'
                      }`}
                  >
                    {statusKey === 'ALL' ? 'All Statuses' : statusKey}
                  </button>
                ))}
              </div>
            </div>

            {/* Selection info bar if active */}
            {selectedOrderIds.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between animate-fade-in">
                <div className="flex items-center space-x-2">
                  <CheckSquare className="w-4 h-4 text-green" />
                  <span className="font-semibold">
                    {selectedOrderIds.length} of {orders.length} orders selected
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleDeleteSelectedOrders}
                    disabled={isDeletingOrders}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs transition-colors flex items-center space-x-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete Selected</span>
                  </button>
                  <button
                    onClick={() => setSelectedOrderIds([])}
                    className="text-muted hover:text-black underline text-xs ml-2"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {/* Orders Table Container */}
            <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-cream border-b border-border text-muted uppercase text-[10px] font-bold">
                    <tr>
                      {/* Checkbox Column */}
                      <th className="p-4 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={
                            filteredOrders.length > 0 &&
                            filteredOrders.every((o) => selectedOrderIds.includes(o.id))
                          }
                          onChange={() => handleSelectAllOrders(filteredOrders)}
                          className="w-4 h-4 rounded border-border text-green focus:ring-green cursor-pointer accent-[#2D4A3E]"
                          title="Select / Deselect all visible orders"
                        />
                      </th>
                      <th className="p-4">Order</th>
                      <th className="p-4">Table</th>
                      <th className="p-4">Guest &amp; Mobile</th>
                      <th className="p-4">Items Summary</th>
                      <th className="p-4">Timestamp</th>
                      <th className="p-4">Kitchen Status</th>
                      <th className="p-4">Payment</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map((order) => {
                        const isPaid = order.payment_status === 'Paid';
                        const isSelected = selectedOrderIds.includes(order.id);
                        const itemsList = order.items || order.order_items || [];

                        return (
                          <tr
                            key={order.id}
                            className={`transition-colors ${isSelected
                              ? 'bg-emerald-50/70 hover:bg-emerald-100/60'
                              : 'hover:bg-cream'
                              }`}
                          >
                            {/* Checkbox */}
                            <td className="p-4 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectOrder(order.id)}
                                className="w-4 h-4 rounded border-border text-green focus:ring-green cursor-pointer accent-[#2D4A3E]"
                              />
                            </td>

                            {/* Order ID */}
                            <td className="p-4 font-mono font-bold text-[#1C1C1C]">
                              #{order.order_number || order.id.slice(0, 5)}
                            </td>

                            {/* Table */}
                            <td className="p-4 font-semibold text-[#1C1C1C]">
                              Table #{order.table_number}
                            </td>

                            {/* Guest details */}
                            <td className="p-4">
                              <span className="font-bold text-[#1C1C1C] block">
                                {order.customer_name || 'Guest'}
                              </span>
                              <span className="text-[10px] text-muted font-mono">
                                {order.customer_phone || 'N/A'}
                              </span>
                            </td>

                            {/* Items count & preview */}
                            <td className="p-4 text-muted max-w-[180px]">
                              <span className="font-medium text-[#1C1C1C] block">
                                {itemsList.length} {itemsList.length === 1 ? 'item' : 'items'}
                              </span>
                              <span className="text-[10px] text-muted truncate block">
                                {itemsList.map((it) => it.name).join(', ') || 'Artisan Dish'}
                              </span>
                            </td>

                            {/* Timestamp */}
                            <td className="p-4 text-muted whitespace-nowrap">
                              {order.created_at
                                ? new Date(order.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                                : 'Recent'}
                            </td>

                            {/* Kitchen Status */}
                            <td className="p-4 whitespace-nowrap">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${order.status === 'Ready' || order.status === 'almost_ready'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : order.status === 'Preparing'
                                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                                    : order.status === 'Served'
                                      ? 'bg-gray-100 text-gray-700 border-gray-300'
                                      : 'bg-cream text-[#1C1C1C] border-border'
                                  }`}
                              >
                                {order.status}
                              </span>
                            </td>

                            {/* Payment Status Toggle */}
                            <td className="p-4 whitespace-nowrap">
                              <button
                                onClick={() => handleTogglePaymentStatus(order)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${isPaid
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                  }`}
                                title="Click to toggle Paid/Pending"
                              >
                                {isPaid ? 'PAID ✓' : 'PENDING'} ({order.payment_method || 'Cash'})
                              </button>
                            </td>

                            {/* Amount */}
                            <td className="p-4 font-bold text-[#1C1C1C] whitespace-nowrap">
                              ₹{Number(order.total).toFixed(2)}
                            </td>

                            {/* Actions */}
                            <td className="p-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end space-x-1.5">
                                <button
                                  onClick={() => setSelectedBillOrder(order)}
                                  className="p-2 rounded-lg bg-cream hover:bg-border text-[#1C1C1C] transition-colors cursor-pointer"
                                  title="Print / Download Bill"
                                >
                                  <Receipt className="w-3.5 h-3.5 text-green" />
                                </button>
                                <button
                                  onClick={() => handleDeleteOrder(order.id, order.order_number)}
                                  className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                                  title="Delete Order Record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={10} className="p-12 text-center text-muted">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <ShoppingBag className="w-8 h-8 text-[#C4BEB3]" />
                            <p className="font-serif text-base font-bold text-[#1C1C1C]">
                              No orders found
                            </p>
                            <p className="text-xs text-muted max-w-sm">
                              {orderSearchQuery || orderStatusFilter !== 'ALL'
                                ? 'Try adjusting your search query or status filter.'
                                : 'When customers place orders, they will appear here in real-time.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: TRAVEL TOKENS RULES (EARNING TIERS) */}
        {activeTab === 'token_rules' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="font-serif text-3xl font-bold text-[#1C1C1C] flex items-center space-x-2">
                  <span>Travel Tokens Rules</span>
                  <span className="text-xs font-sans font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                    Loyalty Engine
                  </span>
                </h1>
                <p className="text-xs text-muted mt-0.5">
                  Configure automatic token awarding tiers. When a customer's order meets or exceeds a spend tier, they receive that many Travel Tokens.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingTokenRule(null);
                  setTokenRuleForm({ min_order_amount: '', tokens_awarded: '' });
                  setShowTokenRuleModal(true);
                }}
                className="py-2.5 px-4 rounded-xl bg-green hover:bg-green-dark text-white text-xs font-bold flex items-center space-x-1.5 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Add Earning Rule</span>
              </button>
            </div>

            {/* Rules Table */}
            <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-cream border-b border-border text-muted uppercase text-[10px] font-bold">
                    <tr>
                      <th className="p-4">Minimum Order Amount</th>
                      <th className="p-4">Tokens Awarded</th>
                      <th className="p-4">Effective Reward Rate</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {tokenRules.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-muted">
                          No token rules configured yet. Click "Add Earning Rule" to create one.
                        </td>
                      </tr>
                    ) : (
                      tokenRules.map((rule) => (
                        <tr key={rule.id} className="hover:bg-cream">
                          <td className="p-4 font-bold text-[#1C1C1C] text-sm font-mono">
                            ₹{Number(rule.min_order_amount).toFixed(2)}+
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center space-x-1 bg-amber-50 border border-amber-200 text-amber-900 font-bold px-2.5 py-1 rounded-lg text-xs font-mono">
                              <span>⭐</span>
                              <span>+{rule.tokens_awarded} Travel Tokens</span>
                            </span>
                          </td>
                          <td className="p-4 text-muted">
                            {((rule.tokens_awarded / (rule.min_order_amount || 1)) * 100).toFixed(1)}% loyalty value
                          </td>
                          <td className="p-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => {
                                  setEditingTokenRule(rule);
                                  setTokenRuleForm({
                                    min_order_amount: rule.min_order_amount,
                                    tokens_awarded: rule.tokens_awarded,
                                  });
                                  setShowTokenRuleModal(true);
                                }}
                                className="p-2 rounded-lg bg-cream hover:bg-border text-[#1C1C1C] transition-colors cursor-pointer"
                                title="Edit Rule"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTokenRule(rule.id, rule.min_order_amount)}
                                className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                                title="Delete Rule"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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

        {/* TAB: REWARD ITEMS CATALOG */}
        {activeTab === 'reward_items' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="font-serif text-3xl font-bold text-[#1C1C1C] flex items-center space-x-2">
                  <span>Reward Items Catalog</span>
                  <span className="text-xs font-sans font-bold text-green bg-green/10 px-2.5 py-0.5 rounded-full">
                    {rewardItems.filter((r) => r.active).length} Active Rewards
                  </span>
                </h1>
                <p className="text-xs text-muted mt-0.5">
                  Artisanal complimentary treats customers can redeem using their Travel Tokens when ordering from a table.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingRewardItem(null);
                  setRewardItemForm({ name: '', points_cost: '', active: true, description: '', image_url: '' });
                  setShowRewardItemModal(true);
                }}
                className="py-2.5 px-4 rounded-xl bg-green hover:bg-green-dark text-white text-xs font-bold flex items-center space-x-1.5 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Add Reward Item</span>
              </button>
            </div>

            {/* Reward Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rewardItems.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white rounded-3xl border shadow-sm overflow-hidden flex flex-col justify-between transition-all ${item.active ? 'border-border hover:shadow-md' : 'border-border opacity-60 bg-gray-50'
                    }`}
                >
                  <div className="relative h-44 bg-[#FAF8F4] overflow-hidden">
                    <img
                      src={item.image_url || 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=400&q=80'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=400&q=80';
                      }}
                    />
                    <div className="absolute top-3 right-3 flex items-center space-x-1.5">
                      <span className="bg-black/75 backdrop-blur-md text-[#E0A96D] text-xs font-bold px-2.5 py-1 rounded-xl shadow border border-white/10 font-mono">
                        ⭐ {item.points_cost} Tokens
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-2 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif font-bold text-base text-[#1C1C1C]">
                        {item.name}
                      </h3>
                      <button
                        onClick={() => handleToggleRewardActive(item)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer transition-colors ${item.active
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                      >
                        {item.active ? 'ACTIVE ✓' : 'INACTIVE'}
                      </button>
                    </div>
                    <p className="text-xs text-muted leading-relaxed line-clamp-2">
                      {item.description || 'Specialty handcrafted reward.'}
                    </p>
                  </div>

                  <div className="p-4 bg-cream/60 border-t border-border flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setEditingRewardItem(item);
                        setRewardItemForm({
                          name: item.name,
                          points_cost: item.points_cost,
                          active: item.active,
                          description: item.description || '',
                          image_url: item.image_url || '',
                        });
                        setShowRewardItemModal(true);
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-border text-[#1C1C1C] text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteRewardItem(item.id, item.name)}
                      className="py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-colors"
                      title="Delete Reward Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: SOCIAL REEL VIDEOS */}
        {activeTab === 'reels' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="font-serif text-3xl font-bold text-[#1C1C1C] flex items-center space-x-2">
                  <span>Social Reel Videos</span>
                  <span className="text-xs font-sans font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
                    {socialReels.filter((r) => r.active).length} Active Reels
                  </span>
                </h1>
                <p className="text-xs text-muted mt-0.5">
                  Manage Instagram Reels, YouTube Shorts, or direct video links displayed in the "Musafir Cafe on Social" homepage section. No video files stored in Supabase!
                </p>
              </div>

              <button
                onClick={openCreateReelModal}
                className="py-2.5 px-4 rounded-2xl bg-green hover:bg-green-dark text-white font-bold text-xs shadow-md transition-all flex items-center space-x-2 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add Reel Link</span>
              </button>
            </div>

            {/* Reels Grid (Compact) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {socialReels.map((reel) => {
                const isIg = reel.video_url?.includes('instagram.com') || reel.video_url?.includes('instagr.am');
                const isYt = reel.video_url?.includes('youtube.com') || reel.video_url?.includes('youtu.be');

                return (
                  <div
                    key={reel.id}
                    className={`bg-white rounded-2xl border shadow-xs overflow-hidden flex flex-col justify-between transition-all ${reel.active ? 'border-border hover:shadow-md' : 'border-border opacity-60 bg-gray-50'
                      }`}
                  >
                    {/* Media Preview Header */}
                    <div className="relative aspect-[9/15] bg-[#1C1C1C] overflow-hidden group">
                      {reel.thumbnail_url ? (
                        <img
                          src={reel.thumbnail_url}
                          alt={reel.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center text-white/50 space-y-1.5">
                          <Film className="w-8 h-8 text-rose-400/60" />
                          <span className="text-[9px] truncate max-w-full px-1 font-mono">
                            {reel.video_url}
                          </span>
                        </div>
                      )}

                      {/* Top Badges */}
                      <div className="absolute top-2 inset-x-2 flex items-center justify-between z-10">
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-white text-[9px] font-bold border border-white/15">
                          {isIg ? (
                            <>
                              <FaInstagram className="w-2.5 h-2.5 text-rose-400" />
                              <span>Instagram</span>
                            </>
                          ) : isYt ? (
                            <>
                              <FaYoutube className="w-2.5 h-2.5 text-red-500" />
                              <span>YouTube</span>
                            </>
                          ) : (
                            <>
                              <Film className="w-2.5 h-2.5 text-[#E0A96D]" />
                              <span>Video</span>
                            </>
                          )}
                        </span>

                        <button
                          onClick={() => handleToggleReelActive(reel)}
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full cursor-pointer transition-colors shadow-xs ${reel.active
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                          {reel.active ? 'ACTIVE ✓' : 'HIDDEN'}
                        </button>
                      </div>

                      {/* Views Badge */}
                      {reel.views_count && (
                        <div className="absolute bottom-2 left-2 z-10 px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[9px] font-mono">
                          👁️ {reel.views_count}
                        </div>
                      )}
                    </div>

                    {/* Content Body */}
                    <div className="p-3 space-y-1 flex-1">
                      <h3 className="font-semibold text-[11px] text-[#1C1C1C] line-clamp-2 leading-snug">
                        {reel.title || 'Untitled Reel'}
                      </h3>
                      <a
                        href={reel.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-muted hover:text-green flex items-center space-x-1 truncate"
                        title={reel.video_url}
                      >
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{reel.video_url}</span>
                      </a>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-2.5 bg-cream/60 border-t border-border flex items-center justify-between gap-1.5">
                      <button
                        onClick={() => openEditReelModal(reel)}
                        className="flex-1 py-1.5 px-2 rounded-xl bg-white hover:bg-border text-[#1C1C1C] text-[11px] font-bold flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteReel(reel.id, reel.title)}
                        className="py-1.5 px-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-bold transition-colors cursor-pointer"
                        title="Delete Reel"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: GUEST CONTACTS & LOYALTY DIRECTORY */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="font-serif text-3xl font-bold text-[#1C1C1C]">
                  Guest &amp; Loyalty Directory
                </h1>
                <p className="text-xs text-muted mt-0.5">
                  All guests captured via table QR scans with real-time Travel Tokens balance and lifetime metrics.
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="px-3.5 py-2 bg-white border border-border rounded-2xl shadow-2xs text-xs font-bold text-[#1C1C1C]">
                  {uniqueCustomers.length} Total Customers
                </div>
                {uniqueCustomers.length > 0 && (
                  <button
                    onClick={handleDeleteAllCustomers}
                    className="px-3.5 py-2 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition-all shadow-2xs flex items-center space-x-1.5 cursor-pointer active:scale-95"
                    title="Delete all customer records"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete All Guests</span>
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-cream border-b border-border text-muted uppercase text-[10px] font-bold">
                    <tr>
                      <th className="p-4">Customer Name</th>
                      <th className="p-4">Mobile Number</th>
                      <th className="p-4">⭐ Travel Tokens</th>
                      <th className="p-4">Last Seated</th>
                      <th className="p-4">Total Orders</th>
                      <th className="p-4">Lifetime Spent</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {uniqueCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted">
                          No guest records captured yet.
                        </td>
                      </tr>
                    ) : (
                      uniqueCustomers.map((cust, idx) => (
                        <tr key={idx} className="hover:bg-cream">
                          <td className="p-4 font-bold text-[#1C1C1C] flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-green text-white flex items-center justify-center text-xs font-bold shrink-0">
                              {cust.name?.[0]?.toUpperCase() || 'G'}
                            </div>
                            <span className="truncate">{cust.name}</span>
                          </td>
                          <td className="p-4 font-mono font-semibold text-[#1C1C1C] whitespace-nowrap">
                            {cust.phone}
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-mono font-bold text-xs">
                              <span>⭐</span>
                              <span>{cust.travel_tokens || 0} Tokens</span>
                            </span>
                          </td>
                          <td className="p-4 font-semibold whitespace-nowrap">Table #{cust.lastTable}</td>
                          <td className="p-4 whitespace-nowrap">{cust.totalOrders} order(s)</td>
                          <td className="p-4 font-bold text-green whitespace-nowrap font-mono">
                            ₹{cust.totalSpent.toFixed(2)}
                          </td>
                          <td className="p-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => handleAdjustCustomerTokens(cust, 50)}
                                className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[10px] transition-colors cursor-pointer"
                                title="Award +50 Bonus Tokens"
                              >
                                +50 ⭐
                              </button>
                              <button
                                onClick={() => handleAdjustCustomerTokens(cust, -50)}
                                className="px-2 py-1 rounded-lg bg-cream hover:bg-border text-[#1C1C1C] font-bold text-[10px] transition-colors cursor-pointer"
                                title="Deduct 50 Tokens"
                              >
                                -50
                              </button>
                              <button
                                onClick={() => handleDeleteCustomer(cust)}
                                className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold transition-colors cursor-pointer"
                                title="Delete Customer Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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
                    placeholder="e.g. 7555417487"
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

      {/* MODAL: ADD / EDIT TOKEN RULE */}
      {showTokenRuleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-border space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="font-serif font-bold text-lg text-[#1C1C1C]">
                  {editingTokenRule ? 'Edit Token Earning Tier' : 'Add Token Earning Tier'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowTokenRuleModal(false);
                  setEditingTokenRule(null);
                }}
                className="text-muted hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTokenRule} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-[#1C1C1C] mb-1">
                  Minimum Order Spend (₹)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1"
                  placeholder="e.g. 500"
                  value={tokenRuleForm.min_order_amount}
                  onChange={(e) =>
                    setTokenRuleForm({ ...tokenRuleForm, min_order_amount: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-cream text-sm font-mono font-bold"
                />
                <p className="text-[10px] text-muted mt-1">
                  When a customer's cart subtotal meets or exceeds this amount.
                </p>
              </div>

              <div>
                <label className="block font-bold uppercase text-[#1C1C1C] mb-1">
                  Travel Tokens Awarded (⭐)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  placeholder="e.g. 50"
                  value={tokenRuleForm.tokens_awarded}
                  onChange={(e) =>
                    setTokenRuleForm({ ...tokenRuleForm, tokens_awarded: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-cream text-sm font-mono font-bold"
                />
                <p className="text-[10px] text-muted mt-1">
                  Number of Travel Tokens credited directly to their loyalty wallet.
                </p>
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-amber-900 text-[11px] space-y-1">
                <span className="font-bold block">💡 Rule Preview</span>
                <span>
                  Spend <strong>₹{tokenRuleForm.min_order_amount || '0'}</strong> ➔ Earn <strong>+{tokenRuleForm.tokens_awarded || '0'} Travel Tokens</strong>
                </span>
              </div>

              <div className="pt-3 border-t border-border flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowTokenRuleModal(false);
                    setEditingTokenRule(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-cream font-bold border border-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-green hover:bg-green-dark text-white font-bold transition-colors shadow"
                >
                  {editingTokenRule ? 'Update Rule' : 'Save Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT REWARD ITEM */}
      {showRewardItemModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-border space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-green/10 text-green">
                  <Gift className="w-5 h-5" />
                </div>
                <h3 className="font-serif font-bold text-lg text-[#1C1C1C]">
                  {editingRewardItem ? 'Edit Reward Item' : 'Add Reward Item'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowRewardItemModal(false);
                  setEditingRewardItem(null);
                }}
                className="text-muted hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRewardItem} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-[#1C1C1C] mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Free Artisanal Croissant, Complimentary Cappuccino"
                  value={rewardItemForm.name}
                  onChange={(e) =>
                    setRewardItemForm({ ...rewardItemForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-cream text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-[#1C1C1C] mb-1">
                    Cost (Tokens ⭐)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    placeholder="e.g. 100"
                    value={rewardItemForm.points_cost}
                    onChange={(e) =>
                      setRewardItemForm({ ...rewardItemForm, points_cost: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-cream text-sm font-mono font-bold"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center space-x-2 cursor-pointer font-bold p-2.5 bg-cream rounded-xl border border-border">
                    <input
                      type="checkbox"
                      checked={rewardItemForm.active}
                      onChange={(e) =>
                        setRewardItemForm({ ...rewardItemForm, active: e.target.checked })
                      }
                      className="rounded text-green"
                    />
                    <span>Active for Redemption</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-[#1C1C1C] mb-1">
                  Reward Description
                </label>
                <textarea
                  rows="2"
                  placeholder="Brief description of the treat or drink..."
                  value={rewardItemForm.description}
                  onChange={(e) =>
                    setRewardItemForm({ ...rewardItemForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-border bg-cream text-xs"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-[#1C1C1C] mb-1">
                  Photo URL or Upload
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://..."
                    value={rewardItemForm.image_url}
                    onChange={(e) =>
                      setRewardItemForm({ ...rewardItemForm, image_url: e.target.value })
                    }
                    className="flex-1 px-3 py-2 rounded-xl border border-border bg-cream text-xs"
                  />
                  <label className="px-3 py-2 rounded-xl bg-cream hover:bg-border border border-border font-bold text-xs cursor-pointer flex items-center space-x-1">
                    <UploadCloud className="w-4 h-4 text-green" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const dataUrl = await processImageFile(file);
                            setRewardItemForm((prev) => ({ ...prev, image_url: dataUrl }));
                            toast.success('Image attached');
                          } catch (err) {
                            toast.error('Failed to process image');
                          }
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {rewardItemForm.image_url && (
                <div className="h-28 rounded-2xl overflow-hidden border border-border bg-[#FAF8F4]">
                  <img
                    src={rewardItemForm.image_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-border flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRewardItemModal(false);
                    setEditingRewardItem(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-cream font-bold border border-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-green hover:bg-green-dark text-white font-bold transition-colors shadow"
                >
                  {editingRewardItem ? 'Update Reward' : 'Save Reward Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT SOCIAL REEL */}
      {showReelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-border space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <div className="flex items-center space-x-2">
                <Film className="w-5 h-5 text-rose-500" />
                <h3 className="font-serif font-bold text-lg text-[#1C1C1C]">
                  {editingReel ? 'Edit Social Reel Link' : 'Add Social Reel Link'}
                </h3>
              </div>
              <button
                onClick={() => setShowReelModal(false)}
                className="p-1 rounded-full hover:bg-cream transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>

            <form onSubmit={handleSaveReel} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold uppercase text-[#1C1C1C] mb-1">
                  Reel / Video Link <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="e.g. https://www.instagram.com/reel/Cxxxx/ or https://youtube.com/shorts/xxxx"
                  value={reelForm.video_url}
                  onChange={(e) => setReelForm({ ...reelForm, video_url: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-cream font-mono text-xs"
                />
                <p className="text-[10px] text-muted mt-1">
                  Paste any Instagram Reel URL, YouTube Shorts URL, or direct MP4 video link.
                </p>
              </div>

              <div>
                <label className="block font-bold uppercase text-[#1C1C1C] mb-1">
                  Caption / Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pouring our signature Swan Flat White ☕🦢"
                  value={reelForm.title}
                  onChange={(e) => setReelForm({ ...reelForm, title: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-cream"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-[#1C1C1C] mb-1">
                    View Count (Display)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 18.5k"
                    value={reelForm.views_count}
                    onChange={(e) => setReelForm({ ...reelForm, views_count: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-cream"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-[#1C1C1C] mb-1">
                    Status
                  </label>
                  <select
                    value={reelForm.active ? 'active' : 'hidden'}
                    onChange={(e) => setReelForm({ ...reelForm, active: e.target.value === 'active' })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-cream font-bold"
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="hidden">Hidden (Inactive)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-[#1C1C1C] mb-1">
                  Custom Cover / Thumbnail URL (Optional)
                </label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/... or leave blank"
                  value={reelForm.thumbnail_url}
                  onChange={(e) => setReelForm({ ...reelForm, thumbnail_url: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-cream text-xs"
                />
              </div>

              <div className="pt-3 border-t border-border flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowReelModal(false)}
                  className="py-2.5 px-4 rounded-xl border border-border text-muted hover:text-[#1C1C1C] font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-green hover:bg-green-dark text-white font-bold text-xs shadow-md transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingReel ? 'Update Reel' : 'Add Reel'}</span>
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

      {/* ATTRACTIVE REUSABLE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        type={confirmModal.type}
        requireMatch={confirmModal.requireMatch}
        matchPlaceholder={confirmModal.matchPlaceholder}
        isLoading={isDeletingOrders}
      />

    </div>
  );
}

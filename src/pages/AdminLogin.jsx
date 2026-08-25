import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Shield, Lock, Mail, Eye, EyeOff, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { supabase, isSupabaseReady } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      if (!isSupabaseReady || !supabase) {
        // Local Dev Mock Auth Login
        localStorage.setItem('musafir_admin_auth', JSON.stringify({
          email,
          role: 'admin',
          token: 'dev-token-musafir-cafe',
        }));
        toast.success('Welcome back, Cafe Manager!');
        navigate(from, { replace: true });
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      localStorage.setItem('musafir_admin_auth', JSON.stringify({
        email: data.user.email,
        role: 'admin',
        token: data.session.access_token,
      }));

      toast.success('Authenticated successfully!');
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      toast.error(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleDevQuickLogin = () => {
    localStorage.setItem('musafir_admin_auth', JSON.stringify({
      email: 'admin@musafir.cafe',
      role: 'admin',
      token: 'dev-token-musafir-cafe',
    }));
    toast.success('Logged in as Cafe Administrator');
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#FDF8F2] flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 border border-[#DF9B52]/30 shadow-cafe-card space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#DF9B52] shadow-sm bg-white p-1 mx-auto">
            <img src="/logo.jpg" alt="Musafir Cafe" className="w-full h-full object-contain" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#1E130D]">Musafir Cafe Portal</h1>
          <p className="text-xs text-[#7A6F68]">Admin & Barista Management Login</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1E130D] mb-1.5">
              Staff Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A6F68]" />
              <input
                type="email"
                placeholder="manager@musafir.cafe"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#DF9B52]/30 bg-[#FDF8F2] focus:outline-none focus:ring-2 focus:ring-[#C86D3B]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1E130D] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A6F68]" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-[#DF9B52]/30 bg-[#FDF8F2] focus:outline-none focus:ring-2 focus:ring-[#C86D3B]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A6F68] hover:text-[#1E130D]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#1E130D] hover:bg-[#C86D3B] text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-[0.99] flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Dev Demo Access */}
        <div className="pt-3 border-t border-[#F4EDE4] text-center space-y-2">
          <button
            onClick={handleDevQuickLogin}
            className="w-full py-2 px-3 rounded-xl bg-[#F4EDE4] hover:bg-[#DF9B52]/20 text-[#1E130D] text-xs font-bold transition-colors flex items-center justify-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C86D3B]" />
            <span>Quick Demo Manager Access (1-Click)</span>
          </button>

          <Link
            to="/menu"
            className="inline-block text-xs font-semibold text-[#7A6F68] hover:text-[#1E130D] pt-2"
          >
            ← Return to Customer Menu
          </Link>
        </div>

      </div>
    </div>
  );
}

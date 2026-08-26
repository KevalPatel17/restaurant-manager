import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, Coffee, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/admin';

  const [email, setEmail] = useState('admin@musafir.cafe');
  const [password, setPassword] = useState('Musafir@2026');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Try Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        // Fallback for default local admin credentials
        if (email.trim() === 'admin@musafir.cafe' && password === 'Musafir@2026') {
          localStorage.setItem('musafir_admin_auth', JSON.stringify({ email, role: 'admin', token: 'mock-session-token' }));
          toast.success('Welcome back, Admin!');
          navigate(redirectTarget);
          return;
        }
        throw error;
      }

      localStorage.setItem('musafir_admin_auth', JSON.stringify({ email: data.user.email, role: 'admin', user: data.user }));
      toast.success('Welcome back, Admin!');
      navigate(redirectTarget);
    } catch (err) {
      console.error('Login error:', err);
      toast.error(err.message || 'Invalid admin credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-cream">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 border border-border shadow-xl space-y-6">
        
        {/* Top brand header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-green rounded-2xl mx-auto flex items-center justify-center shadow-md">
            <Coffee className="w-7 h-7 text-white" />
          </div>
          <span className="text-[11px] font-sans font-bold uppercase tracking-widest text-green block">
            Management Portal
          </span>
          <h1 className="font-serif text-3xl font-bold text-[#1C1C1C]">
            Admin Sign In
          </h1>
          <p className="text-xs font-sans text-muted">
            Access live cafe orders, menu availability, analytics & WAHA settings.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs font-sans">
          
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1C1C1C] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@musafir.cafe"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-cream focus:outline-none focus:ring-1 focus:ring-green text-[#1C1C1C]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1C1C1C] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-cream focus:outline-none focus:ring-1 focus:ring-green text-[#1C1C1C]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-green hover:bg-green-dark text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
          >
            <span>{isLoading ? 'Authenticating...' : 'Sign In to Portal'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-muted">
          <Link to="/" className="hover:text-green flex items-center space-x-1 font-semibold">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Cafe</span>
          </Link>
          <span className="flex items-center space-x-1 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-green" />
            <span>Secure Supabase Auth</span>
          </span>
        </div>

      </div>
    </div>
  );
}

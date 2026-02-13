import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import {
  Ship,
  Lock,
  Mail,
  ArrowRight,
  QrCode,
  AlertCircle,
  Loader2,
} from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Supabase Auth ile Giriş
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data?.user) {
        // 2. Kullanıcının Rolünü Profiles Tablosundan Çek
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('Profil hatası:', profileError);
          throw new Error(
            'Yetki profiliniz bulunamadı. Lütfen yöneticiye başvurun.'
          );
        }

        // 3. Role Göre Yönlendir
        if (profile.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/personnel');
        }
      }
    } catch (err) {
      setErrorMsg(
        err.message || 'Giriş yapılamadı. Bilgilerinizi kontrol edin.'
      );
      console.error('Login süreci hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 antialiased">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="inline-flex p-4 bg-indigo-600 rounded-3xl text-white shadow-xl mb-4">
            <Ship size={40} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            CEMRE SHIPYARD
          </h1>
          <p className="text-slate-500 text-sm font-medium italic">
            Ekipman Kontrol & İSG Otomasyonu
          </p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6 relative z-10">
          {/* Hata Mesajı Alanı */}
          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold animate-in">
              <AlertCircle size={18} />
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                <Mail size={12} /> Personel E-Posta
              </label>
              <input
                required
                type="email"
                placeholder="isim@cemreshipyard.com"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5 text-left">
                <Lock size={12} /> Şifre
              </label>
              <input
                required
                type="password"
                placeholder="••••••••"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:bg-slate-300 active:scale-95"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Sisteme Giriş Yap <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-100"></span>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-white px-4 text-slate-300 font-black tracking-[0.2em]">
                Veya
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/home')}
            className="w-full border-2 border-slate-100 text-slate-600 font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-95"
          >
            <QrCode size={20} /> Saha Girişi (QR Tarat)
          </button>
        </div>

        <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-loose">
          Yalova Tersaneler Bölgesi <br /> © 2026 Cemre Shipyard ISG
        </p>
      </div>
    </div>
  );
};

export default Login;

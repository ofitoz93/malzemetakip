import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import {
  QrCode,
  LayoutDashboard,
  ClipboardCheck,
  Settings,
  LogIn,
  User,
  HardHat,
  Ship,
} from 'lucide-react';

const HomeDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null); // Giriş yapan kullanıcı state'i

  useEffect(() => {
    // Supabase Auth durumunu kontrol et
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Üst Bar: Tersane Logosu ve Profil */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
            <Ship size={20} />
          </div>
          <span className="font-bold text-slate-900 tracking-tight">
            CEMRE | ISG-X
          </span>
        </div>
        {user ? (
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
            <User size={14} /> {user.email}
          </div>
        ) : (
          <button
            onClick={() => navigate('/admin')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
          >
            Personel Girişi
          </button>
        )}
      </header>

      <main className="p-6 max-w-lg mx-auto space-y-8">
        {/* Karşılama Alanı */}
        <section className="pt-4">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {user ? 'Hoş Geldin, Denetçi' : 'Ekipman Kontrolü'}
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            Sahadaki ekipmanların güvenlik durumunu kontrol etmek için hemen
            taramaya başla.
          </p>
        </section>

        {/* Ana Aksiyon: Büyük QR Butonu */}
        <section>
          <button
            onClick={() => navigate('/scan')}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-100 flex flex-col items-center gap-4 transition-all active:scale-[0.97]"
          >
            <div className="bg-white/20 p-4 rounded-3xl">
              <QrCode size={48} strokeWidth={2.5} />
            </div>
            <div className="text-center">
              <span className="block text-xl font-black tracking-tight">
                QR KODU TARAT
              </span>
              <span className="text-indigo-200 text-xs font-medium uppercase tracking-widest mt-1">
                Kamerayı Başlat
              </span>
            </div>
          </button>
        </section>

        {/* Yetki Bazlı Menü */}
        <section className="grid grid-cols-2 gap-4">
          <MenuCard
            title="Kayıtlar"
            icon={<ClipboardCheck className="text-emerald-500" />}
            onClick={() => navigate(user ? '/admin' : '/scan')}
          />
          <MenuCard
            title="İSG Rehberi"
            icon={<HardHat className="text-amber-500" />}
            onClick={() => {}}
          />
        </section>

        {/* Bilgilendirme Kartı */}
        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 flex gap-4">
          <div className="bg-white p-3 rounded-2xl shadow-sm h-fit">
            <Settings size={20} className="text-slate-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Sistem Bilgisi</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Ekipman periyodik kontrolleri Yalova tersane sahası güvenlik
              protokolleri gereğince günlük yapılmalıdır.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

const MenuCard = ({ title, icon, onClick }) => (
  <button
    onClick={onClick}
    className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-3 active:scale-95"
  >
    <div className="bg-slate-50 p-3 rounded-2xl">{icon}</div>
    <span className="text-sm font-bold text-slate-700">{title}</span>
  </button>
);

export default HomeDashboard;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { QrCode, ListChecks, LogOut, HardHat, ShieldCheck } from 'lucide-react';

const PersonnelDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <ShieldCheck size={20} />
          </div>
          <div className="text-left">
            <h1 className="text-sm font-bold text-slate-900 leading-none text-left">
              İSG DENETÇİ PANELİ
            </h1>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1 text-left">
              Saha Kontrol Modülü
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
        >
          <LogOut size={20} />
        </button>
      </nav>

      <main className="p-6 max-w-lg mx-auto space-y-6">
        <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-100 flex flex-col items-center text-center space-y-4">
          <HardHat size={48} className="opacity-80" />
          <div>
            <h2 className="text-xl font-black">Denetim Başlat</h2>
            <p className="text-indigo-100 text-xs mt-1">
              Ekipmanı tarayarak İSG formunu doldurmaya başlayın.
            </p>
          </div>
          <button
            onClick={() => navigate('/scan')}
            className="w-full bg-white text-indigo-600 font-black py-4 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg"
          >
            <QrCode size={20} /> KAMERAYI AÇ
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">
            İşlemlerim
          </h3>
          <button className="w-full p-6 bg-white border border-slate-100 rounded-3xl flex items-center gap-4 text-left shadow-sm">
            <div className="p-3 bg-slate-50 rounded-2xl text-slate-400">
              <ListChecks size={24} />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">
                Son Denetimlerim
              </p>
              <p className="text-[11px] text-slate-400">
                Bugün yaptığınız kontrolleri görün.
              </p>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
};

export default PersonnelDashboard;

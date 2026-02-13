import React from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, ClipboardList, Info, Ship } from 'lucide-react';

const GuestHome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <header className="px-6 py-10 text-center">
        <div className="inline-flex p-4 bg-indigo-600 rounded-3xl text-white shadow-xl mb-6">
          <Ship size={40} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          CEMRE SAHA PORTALI
        </h1>
        <p className="text-slate-500 text-sm mt-2 font-medium">
          Güvenli Çalışma İçin Ekipman Kontrolü
        </p>
      </header>

      <main className="p-6 max-w-md mx-auto space-y-6">
        {/* En Önemli Aksiyon: QR Tarama */}
        <button
          onClick={() => navigate('/scan')}
          className="w-full bg-indigo-600 p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-100 flex flex-col items-center gap-4 active:scale-95 transition-all text-white"
        >
          <div className="bg-white/20 p-4 rounded-3xl">
            <QrCode size={48} />
          </div>
          <div className="text-center">
            <span className="block text-xl font-black uppercase tracking-tight">
              QR KODU OKUT
            </span>
            <span className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mt-1">
              Konum Güncelle & Bilgi Al
            </span>
          </div>
        </button>

        <div className="grid grid-cols-1 gap-4">
          <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex gap-4">
            <div className="bg-white p-3 rounded-2xl h-fit shadow-sm text-indigo-600">
              <ClipboardList size={20} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm text-left">
                İş Başlama Kontrolü
              </h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed text-left">
                Ekipman kullanmadan önce QR taratıp formu doldurmanız
                zorunludur.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full py-4 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
        >
          ← Personel Giriş Paneli
        </button>
      </main>
    </div>
  );
};

export default GuestHome;

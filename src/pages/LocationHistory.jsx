import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import {
  MapPin,
  ArrowLeft,
  Clock,
  History,
  Box,
  Loader2,
  Navigation,
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import EquipmentMap from '../components/EquipmentMap';

const LocationHistory = () => {
  const { qrId } = useParams();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [qrId]);

  const fetchHistory = async () => {
    try {
      // 1. Ekipman bilgisini al
      const { data: eq } = await supabase
        .from('equipment')
        .select('*, equipment_types(name)')
        .eq('qr_code', qrId)
        .single();
      setEquipment(eq);

      // 2. Son 20 konum kaydını çek
      const { data: historyLogs } = await supabase
        .from('location_logs')
        .select('*')
        .eq('equipment_id', eq.id)
        .order('created_at', { ascending: false })
        .limit(20);

      setLogs(historyLogs || []);
    } catch (err) {
      console.error('Geçmiş yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" />
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased text-left">
      <nav className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-50 rounded-xl transition-all"
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none text-left">
              Hareket Geçmişi
            </h1>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1 text-left">
              {equipment?.name} ({qrId})
            </p>
          </div>
        </div>
      </nav>

      <main className="p-8 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* SOL: HARİTA (Görsel İz) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-2 h-[500px] shadow-sm overflow-hidden">
            <EquipmentMap items={[equipment]} history={logs} />
          </div>
          <p className="text-[10px] text-slate-400 italic px-6">
            * Mavi kesikli çizgiler ekipmanın tarandığı noktalar arasındaki
            tahmini rotayı gösterir.
          </p>
        </div>

        {/* SAĞ: ZAMAN ÇİZELGESİ (Liste) */}
        <div className="space-y-6">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest ml-2 flex items-center gap-2">
            <History size={16} className="text-indigo-600" /> Kayıtlı Hareketler
          </h3>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {logs.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl text-center border-2 border-dashed border-slate-200">
                <MapPin size={32} className="mx-auto text-slate-200 mb-2" />
                <p className="text-xs font-bold text-slate-400 uppercase">
                  Kayıt Bulunamadı
                </p>
              </div>
            ) : (
              logs.map((log, idx) => (
                <div
                  key={log.id}
                  className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex items-start gap-4"
                >
                  <div
                    className={`p-2 rounded-xl ${
                      idx === 0
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-slate-50 text-slate-400'
                    }`}
                  >
                    <Navigation size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800">
                      {idx === 0
                        ? 'Mevcut Konum'
                        : `${logs.length - idx}. Durak`}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-tighter">
                      {format(new Date(log.created_at), 'dd MMM yyyy, HH:mm', {
                        locale: tr,
                      })}
                    </p>
                    <p className="text-[10px] font-mono text-indigo-500 mt-2 bg-indigo-50 px-2 py-0.5 rounded w-fit">
                      {log.lat.toFixed(4)}, {log.lng.toFixed(4)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default LocationHistory;

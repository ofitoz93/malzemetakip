import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import { format, differenceInDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  AlertTriangle,
  CheckCircle,
  Lock,
  MapPin,
  Camera,
  ArrowLeft,
  Calendar,
  Hash,
  Box,
  ChevronRight,
  Info,
  History,
  Loader2,
} from 'lucide-react';
import EquipmentMap from '../components/EquipmentMap';
import { useAuth } from '../hooks/useAuth';

const EquipmentDetail = () => {
  const { qrId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuth(); // Admin kontrolü için

  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(true);
  const [status, setStatus] = useState('active'); // active, warning, locked

  useEffect(() => {
    fetchData();
  }, [qrId]);

  // Ekipman verisi çekildikten sonra konumu güncelle
  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select(`*, equipment_types ( name, checklist_schema )`)
        .eq('qr_code', qrId)
        .single();

      if (error) throw error;
      if (data) {
        setEquipment(data);

        // Bakım durumunu belirle
        const daysLeft = differenceInDays(
          new Date(data.next_maintenance_date),
          new Date()
        );
        if (data.status === 'maintenance_required' || daysLeft < 0)
          setStatus('locked');
        else if (daysLeft <= 7) setStatus('warning');

        // ZORUNLU: Konumu sessizce güncelle ve log kaydı oluştur
        autoUpdateLocation(data.id);
      }
    } catch (err) {
      console.error('Hata:', err);
    } finally {
      setLoading(false);
    }
  };

  // OTOMATİK KONUM GÜNCELLEME VE İZ BIRAKMA
  const autoUpdateLocation = (eqId) => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          // 1. Anlık konumu ekipman tablosunda güncelle
          await supabase
            .from('equipment')
            .update({
              last_known_gps_lat: lat,
              last_known_gps_lng: lng,
              last_seen_at: new Date().toISOString(),
              location_description: 'QR Tarama (Otomatik)',
            })
            .eq('id', eqId);

          // 2. Hareket geçmişine (İz Takibi) yeni kayıt ekle
          await supabase.from('location_logs').insert({
            equipment_id: eqId,
            lat: lat,
            lng: lng,
            recorded_by: 'Saha Taraması',
          });

          setLocating(false);
        },
        (err) => {
          console.warn('Konum izni alınamadı, iz takibi yapılamıyor.');
          setLocating(false);
        }
      );
    }
  };

  if (loading)
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Sistem Sorgulanıyor...
        </p>
      </div>
    );

  if (!equipment)
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10 text-center">
        <AlertTriangle size={64} className="text-amber-500 mb-6" />
        <h1 className="text-2xl font-black text-slate-900">Kayıt Bulunamadı</h1>
        <p className="text-slate-500 mt-2 text-sm">
          QR Kod:{' '}
          <span className="font-mono font-bold text-indigo-600">{qrId}</span>
        </p>
        <button
          onClick={() => navigate('/home')}
          className="mt-8 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1"
        >
          Geri Dön
        </button>
      </div>
    );

  const theme = {
    active: {
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      label: 'SAĞLAM',
    },
    warning: {
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      label: 'BAKIM YAKLAŞTI',
    },
    locked: {
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-100',
      label: 'KULLANIM YASAK',
    },
  }[status];

  return (
    <div className="min-h-screen bg-white font-sans antialiased text-left pb-10">
      {/* Üst Navigasyon */}
      <header className="px-6 py-5 flex items-center justify-between border-b border-slate-50 sticky top-0 bg-white/90 backdrop-blur-md z-10">
        <button
          onClick={() => navigate('/home')}
          className="p-2 -ml-2 hover:bg-slate-50 rounded-xl transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div className="flex items-center gap-2">
          {!locating && (
            <span className="flex items-center gap-1 text-[9px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full uppercase">
              <CheckCircle size={10} /> Konum Kaydedildi
            </span>
          )}
          {role === 'admin' && (
            <button
              onClick={() => navigate(`/history/${qrId}`)}
              className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all shadow-sm"
              title="Hareket Geçmişini Gör"
            >
              <History size={20} />
            </button>
          )}
        </div>
      </header>

      <main className="p-8 max-w-lg mx-auto space-y-10">
        {/* Durum Rozeti ve Başlık */}
        <section className="space-y-4">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${theme.bg} ${theme.border} ${theme.color}`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                status === 'locked'
                  ? 'bg-red-500 animate-pulse'
                  : 'bg-emerald-500'
              }`}
            />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {theme.label}
            </span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight">
            {equipment.name}
          </h1>
          <div className="flex items-center gap-4 text-slate-500 font-bold text-sm">
            <span className="flex items-center gap-1.5">
              <Box size={16} className="text-indigo-400" />{' '}
              {equipment.equipment_types?.name}
            </span>
            <span className="text-slate-200">|</span>
            <span className="flex items-center gap-1.5 font-mono">
              <Hash size={14} /> {equipment.qr_code}
            </span>
          </div>
        </section>

        {/* Bilgi Kartları */}
        <div className="grid grid-cols-1 gap-4">
          <div className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] flex items-center gap-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600">
              <MapPin size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Tespit Edilen Konum
              </p>
              <p className="text-sm font-black text-slate-800">
                {equipment.last_known_gps_lat
                  ? `${equipment.last_known_gps_lat.toFixed(
                      4
                    )}, ${equipment.last_known_gps_lng.toFixed(4)}`
                  : 'Alınıyor...'}
              </p>
            </div>
          </div>
        </div>

        {/* HARİTA: Sadece bu ekipmanın son tespiti */}
        <section className="space-y-3">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
            Anlık Saha Haritası
          </h3>
          <div className="h-[250px] w-full bg-slate-50 rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-inner">
            <EquipmentMap items={[equipment]} />
          </div>
        </section>

        {/* Bakım Bilgisi */}
        <section className="bg-slate-900 p-6 rounded-[2.5rem] text-white flex justify-between items-center shadow-2xl shadow-indigo-100">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Periyodik Muayene
            </p>
            <p className="text-lg font-black">
              {format(
                new Date(equipment.next_maintenance_date),
                'dd MMMM yyyy',
                { locale: tr }
              )}
            </p>
          </div>
          <div className="p-3 bg-white/10 rounded-2xl">
            <Calendar size={24} />
          </div>
        </section>

        {/* AKSİYON ALANI */}
        <section className="pt-6">
          {status === 'locked' ? (
            <div className="p-6 bg-red-50 border border-red-100 rounded-[2rem] flex gap-4 items-start shadow-inner">
              <Lock className="text-red-500 shrink-0 mt-1" size={24} />
              <div>
                <p className="text-sm text-red-700 font-bold uppercase tracking-tight">
                  Kullanım Engellendi
                </p>
                <p className="text-xs text-red-600/80 font-medium mt-1 leading-relaxed">
                  Bu ekipman İSG standartlarına uymamaktadır. Lütfen en yakın
                  İSG sorumlusuna haber veriniz.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => navigate(`/worker-control/${qrId}`)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-[2.5rem] shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-95 transition-all group"
              >
                <Camera
                  size={22}
                  className="group-hover:rotate-12 transition-transform"
                />
                GÜNLÜK KONTROLÜ BAŞLAT
                <ChevronRight size={18} className="opacity-50" />
              </button>
              <div className="flex gap-2 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <Info size={18} className="text-amber-500 shrink-0" />
                <p className="text-[10px] text-amber-700 font-bold leading-relaxed">
                  Zorunlu ISG prosedürü: Ekipmanı kullanmadan önce yukarıdaki
                  formu doldurarak saha güvenliğine katkıda bulunun.
                </p>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default EquipmentDetail;

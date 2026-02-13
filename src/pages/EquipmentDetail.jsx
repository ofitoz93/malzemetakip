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
} from 'lucide-react';
import EquipmentMap from '../components/EquipmentMap';

/**
 * Ekipman Detay Sayfası
 * İşlev: Ekipman bilgilerini gösterir, QR tarama ile gelindiyse konumu günceller.
 */
const EquipmentDetail = () => {
  const { qrId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // QR tarayıcıdan gelinip gelinmediğini kontrol eder
  const isScanned = location.state?.scanned || false;

  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('active'); // active, warning, locked

  useEffect(() => {
    fetchEquipment();

    // EĞER QR TARANARAK GELİNDİYSE: Konumu anında güncelle
    if (isScanned) {
      updateGpsLocation();
    }
  }, [qrId]);

  // Ekipman verilerini ve türünü çek
  const fetchEquipment = async () => {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select(`*, equipment_types ( name )`)
        .eq('qr_code', qrId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setEquipment(null);
      } else {
        // Bakım gün sayısını hesapla ve durumu belirle
        const daysLeft = differenceInDays(
          new Date(data.next_maintenance_date),
          new Date()
        );
        if (daysLeft < 0) setStatus('locked');
        else if (daysLeft <= 7) setStatus('warning');

        setEquipment(data);
      }
    } catch (err) {
      console.error('Veri çekme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cihazın GPS konumunu al ve veritabanında güncelle
  const updateGpsLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { error } = await supabase
          .from('equipment')
          .update({
            last_known_gps_lat: pos.coords.latitude,
            last_known_gps_lng: pos.coords.longitude,
            last_seen_at: new Date().toISOString(),
          })
          .eq('qr_code', qrId);

        if (error) console.error('Konum güncelleme hatası:', error);
      });
    }
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-white text-indigo-600 font-bold uppercase tracking-widest text-xs">
        Sistem Sorgulanıyor...
      </div>
    );

  // DURUM 1: Ekipman sistemde kayıtlı değilse
  if (!equipment) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10 text-center animate-in">
        <div className="bg-amber-50 p-8 rounded-[3rem] text-amber-500 border border-amber-100 mb-8 shadow-inner">
          <AlertTriangle size={80} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight text-left">
          Ekipman Bulunamadı
        </h1>
        <p className="text-slate-500 mt-4 max-w-xs leading-relaxed text-left">
          <code className="bg-slate-100 text-indigo-600 px-2 py-1 rounded font-mono font-bold">
            {qrId}
          </code>{' '}
          kodlu cihaz envanterde kayıtlı değil.
        </p>
        <div className="w-full max-w-xs pt-12 space-y-4">
          <button
            onClick={() =>
              navigate('/admin', {
                state: { prefilledQr: qrId, openModal: true },
              })
            }
            className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-bold shadow-2xl shadow-indigo-200 active:scale-95 transition-all"
          >
            YENİ KAYIT OLUŞTUR
          </button>
          <button
            onClick={() => navigate('/home')}
            className="w-full text-slate-400 font-bold py-2 text-sm uppercase tracking-widest"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  // DURUM 2: Ekipman kayıtlıysa (Detay Kartı)
  const themes = {
    active: {
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      label: 'Kullanıma Hazır',
    },
    warning: {
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      label: 'Bakım Planlanmalı',
    },
    locked: {
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-100',
      label: 'Kullanım Yasak',
    },
  }[status];

  return (
    <div className="min-h-screen bg-white font-sans antialiased text-left">
      {/* Header */}
      <header className="px-6 py-5 flex items-center border-b border-slate-100 sticky top-0 bg-white/80 backdrop-blur-md z-10 text-left">
        <button
          onClick={() => navigate('/home')}
          className="p-2 -ml-2 hover:bg-slate-50 rounded-xl transition-colors text-left"
        >
          <ArrowLeft size={20} className="text-slate-600 text-left" />
        </button>
        <span className="ml-3 text-xs font-black text-slate-900 uppercase tracking-widest text-left">
          Ekipman Kimlik Kartı
        </span>
      </header>

      <main className="p-8 max-w-lg mx-auto space-y-10 text-left">
        {/* Durum Rozeti */}
        <div
          className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border ${themes.bg} ${themes.border} ${themes.color} text-left`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              status === 'locked'
                ? 'bg-red-500 animate-pulse'
                : 'bg-emerald-500'
            } text-left`}
          />
          <span className="text-[10px] font-black uppercase tracking-widest text-left">
            {themes.label}
          </span>
        </div>

        {/* Ana Bilgiler */}
        <section className="text-left">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight text-left">
            {equipment.name}
          </h1>
          <p className="text-slate-500 mt-2 flex items-center gap-2 text-sm font-semibold text-left">
            <Box size={18} className="text-indigo-400 text-left" />{' '}
            {equipment.equipment_types?.name}
          </p>
        </section>

        {/* Teknik Veri Kartları */}
        <section className="grid grid-cols-1 gap-5 text-left">
          <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm flex items-center gap-4 text-left">
            <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl text-left">
              <Hash size={20} />
            </div>
            <div className="text-left">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-left">
                Seri Numarası
              </p>
              <p className="text-sm font-bold text-slate-800 text-left">
                {equipment.serial_number || 'Belirtilmemiş'}
              </p>
            </div>
          </div>

          <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm flex items-center gap-4 text-left">
            <div className="p-3 bg-indigo-50 text-indigo-500 rounded-2xl text-left">
              <MapPin size={20} />
            </div>
            <div className="text-left">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-left">
                Saha Konumu
              </p>
              <p className="text-sm font-bold text-slate-800 text-left">
                {equipment.location_description || 'Tersane Sahası'}
              </p>
            </div>
          </div>
        </section>

        {/* HARİTA: Ekipmanın son görüldüğü nokta */}
        <section className="space-y-4 text-left">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2 text-left">
            <MapPin size={14} className="text-indigo-600 text-left" /> Ekipman
            Konum Bilgisi
          </h3>
          <div className="h-[250px] w-full bg-slate-50 rounded-[2rem] overflow-hidden border border-slate-100 shadow-inner text-left">
            <EquipmentMap items={[equipment]} />
          </div>
          {isScanned && (
            <p className="text-[10px] text-emerald-600 font-bold text-center bg-emerald-50 py-2 rounded-xl animate-bounce">
              ✓ Konumunuz Otomatik Olarak Güncellendi
            </p>
          )}
        </section>

        {/* Bakım Tarihleri */}
        <section className="flex gap-4 text-left">
          <div className="flex-1 bg-slate-50 border border-slate-100 p-5 rounded-3xl text-left">
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-2 tracking-widest text-left">
              Son Bakım
            </p>
            <p className="text-sm font-bold text-slate-700 text-left">
              {equipment.last_maintenance_date
                ? format(
                    new Date(equipment.last_maintenance_date),
                    'dd MMM yyyy',
                    { locale: tr }
                  )
                : 'Yeni Kayıt'}
            </p>
          </div>
          <div
            className={`flex-1 border p-5 rounded-3xl shadow-sm text-left ${
              status === 'locked'
                ? 'border-red-100 bg-red-50/50'
                : 'border-indigo-100 bg-indigo-50/50'
            }`}
          >
            <p
              className={`text-[10px] font-bold uppercase mb-2 tracking-widest text-left ${
                status === 'locked' ? 'text-red-400' : 'text-indigo-400'
              }`}
            >
              Sıradaki Bakım
            </p>
            <p
              className={`text-sm font-black text-left ${
                status === 'locked' ? 'text-red-700' : 'text-indigo-700'
              }`}
            >
              {format(
                new Date(equipment.next_maintenance_date),
                'dd MMM yyyy',
                { locale: tr }
              )}
            </p>
          </div>
        </section>

        {/* Alt Bilgi & Aksiyon */}
        <section className="pt-8 text-left">
          {status === 'locked' ? (
            <div className="p-6 bg-red-50 border border-red-100 rounded-[2rem] flex gap-4 items-start shadow-inner text-left">
              <Lock
                className="text-red-500 shrink-0 mt-1 text-left"
                size={24}
              />
              <p className="text-sm text-red-700 font-bold leading-relaxed text-left">
                BU EKİPMANIN KULLANIMI YASAKTIR. <br />
                <span className="font-medium text-red-600/80 text-left">
                  Periyodik muayene süresi dolmuştur veya arızalıdır.
                </span>
              </p>
            </div>
          ) : (
            <div className="space-y-4 text-left">
              <button
                onClick={() =>
                  navigate(`/worker-control/${qrId}`, {
                    state: { scanned: isScanned },
                  })
                }
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-[2rem] shadow-2xl shadow-indigo-200 flex items-center justify-center gap-4 transition-all active:scale-95 group text-left"
              >
                <Camera
                  size={24}
                  className="group-hover:rotate-12 transition-transform text-left"
                />
                GÜNLÜK KONTROLE BAŞLA
                <ChevronRight size={20} className="opacity-40 text-left" />
              </button>
              <p className="text-[10px] text-slate-400 text-center font-medium leading-relaxed px-4 text-left">
                İş sağlığı ve güvenliği gereği ekipmanı kullanmadan önce kontrol
                formunu doldurmanız zorunludur.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default EquipmentDetail;

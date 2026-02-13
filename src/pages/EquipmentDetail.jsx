import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { format, differenceInDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  AlertTriangle,
  CheckCircle,
  Lock,
  MapPin,
  Camera,
  XCircle,
} from 'lucide-react';

const EquipmentDetail = () => {
  const { qrId } = useParams();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusOverride, setStatusOverride] = useState(null); // Hesaplanan durum

  useEffect(() => {
    fetchEquipment();
  }, [qrId]);

  const fetchEquipment = async () => {
    try {
      // Supabase'den veriyi çek (Tablo isimleri SQL dosyanla aynı olmalı)
      const { data, error } = await supabase
        .from('equipment')
        .select(
          `
          *,
          equipment_types ( name, maintenance_period_days )
        `
        )
        .eq('qr_code', qrId)
        .single();

      if (error) throw error;

      // Bakım Mantığı Kontrolü
      const today = new Date();
      const nextMaintenance = new Date(data.next_maintenance_date);
      const daysLeft = differenceInDays(nextMaintenance, today);

      let computedStatus = 'active';
      if (daysLeft < 0) computedStatus = 'locked'; // Süresi geçmiş
      else if (daysLeft <= 7) computedStatus = 'warning'; // Az kalmış

      setStatusOverride(computedStatus);
      setEquipment(data);
    } catch (error) {
      console.error('Hata:', error);
      alert('Ekipman bulunamadı!');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Yükleniyor...</div>;
  if (!equipment) return null;

  // Tasarım renkleri duruma göre değişir
  const theme = {
    active: {
      bg: 'bg-green-600',
      icon: <CheckCircle size={48} />,
      text: 'KULLANIMA UYGUN',
    },
    warning: {
      bg: 'bg-yellow-500',
      icon: <AlertTriangle size={48} />,
      text: 'BAKIM YAKLAŞTI',
    },
    locked: {
      bg: 'bg-red-600',
      icon: <Lock size={48} />,
      text: 'KULLANIM DIŞI - BAKIM GEREKİYOR',
    },
  }[statusOverride];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Üst Bilgi Kartı (Dinamik Renk) */}
      <div
        className={`${theme.bg} text-white p-8 rounded-b-[40px] shadow-xl relative overflow-hidden`}
      >
        <div className="absolute top-0 right-0 opacity-20 transform translate-x-10 -translate-y-10">
          <MapPin size={150} />
        </div>

        <button
          // Mevcut butonun onClick kısmı:
          onClick={() => navigate(`/inspection/${qrId}`)}
          className="absolute top-4 left-4 text-white/80"
        >
          ← Geri
        </button>

        <div className="flex flex-col items-center mt-4">
          <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm mb-4">
            {theme.icon}
          </div>
          <h2 className="text-2xl font-bold text-center">{theme.text}</h2>
          <p className="text-white/80 mt-1">
            {equipment.equipment_types?.name}
          </p>
        </div>
      </div>

      {/* Detay Bilgileri */}
      <div className="px-6 -mt-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400 text-xs uppercase">Seri No</p>
              <p className="font-semibold">{equipment.serial_number}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase">Konum</p>
              <p className="font-semibold flex items-center gap-1">
                <MapPin size={14} className="text-blue-500" />
                {equipment.location_description || 'Belirsiz'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase">Son Bakım</p>
              <p className="font-medium text-gray-700">
                {format(
                  new Date(equipment.last_maintenance_date),
                  'dd MMMM yyyy',
                  { locale: tr }
                )}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase">Sonraki Bakım</p>
              <p
                className={`font-bold ${
                  statusOverride === 'locked'
                    ? 'text-red-600'
                    : 'text-green-600'
                }`}
              >
                {format(
                  new Date(equipment.next_maintenance_date),
                  'dd MMMM yyyy',
                  { locale: tr }
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Aksiyon Butonları */}
      <div className="p-6 mt-auto">
        {statusOverride === 'locked' ? (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-start gap-3">
            <XCircle className="text-red-600 shrink-0" />
            <p className="text-red-700 text-sm">
              Bu ekipmanın periyodik bakım süresi dolmuştur. Sistem kilitlendi.
              Lütfen İSG veya Bakım birimine teslim ediniz.
            </p>
          </div>
        ) : (
          <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
            onClick={() => console.log('Form sayfasına git...')} // Buraya Form Rotası Gelecek
          >
            <Camera size={20} />
            GÜNLÜK KONTROLE BAŞLA
          </button>
        )}
      </div>
    </div>
  );
};

export default EquipmentDetail;

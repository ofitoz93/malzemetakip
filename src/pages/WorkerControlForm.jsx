import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import {
  Send,
  User,
  Building,
  CheckCircle,
  XCircle,
  AlertTriangle,
  HardHat,
  ArrowLeft,
} from 'lucide-react';

const WorkerControlForm = () => {
  const { qrId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  // QR taraması ile mi gelindi kontrolü
  const isScanned = location.state?.scanned || false;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [equipment, setEquipment] = useState(null);

  // Form State'leri
  const [workerInfo, setWorkerInfo] = useState({ fullName: '', company: '' });
  const [checklistState, setChecklistState] = useState([]); // [{label: 'Yağ Kontrolü', status: true/false/null}]

  useEffect(() => {
    fetchEquipmentAndSchema();
  }, [qrId]);

  // Ekipman bilgisini ve ona ait kontrol listesi şablonunu çek
  const fetchEquipmentAndSchema = async () => {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select('id, name, qr_code, equipment_types(name, checklist_schema)')
        .eq('qr_code', qrId)
        .single();

      if (error) throw error;

      setEquipment(data);
      // Şablonu al ve durumu 'null' (işaretlenmemiş) olarak başlat
      const initialChecklist = data.equipment_types.checklist_schema.map(
        (item) => ({
          label: item.label,
          status: null,
        })
      );
      setChecklistState(initialChecklist);
    } catch (err) {
      alert('Ekipman bilgisi alınamadı. Lütfen tekrar deneyin.');
      navigate('/home');
    } finally {
      setLoading(false);
    }
  };

  // Form Gönderme İşlemi
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validasyon: Tüm checklist maddeleri işaretlendi mi?
    const isAllChecked = checklistState.every((item) => item.status !== null);
    if (!isAllChecked) {
      alert(
        "Lütfen tüm kontrol maddelerini 'SAĞLAM' veya 'SORUNLU' olarak işaretleyiniz."
      );
      return;
    }

    setSubmitting(true);

    // 2. Konum Alma (Eğer tarama yapıldıysa)
    let currentGps = { lat: null, lng: null };
    if (isScanned && 'geolocation' in navigator) {
      try {
        const pos = await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
          })
        );
        currentGps = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        // Ana ekipman tablosunu da güncelle ki son konumu bilinsin
        await supabase
          .from('equipment')
          .update({
            last_known_gps_lat: pos.coords.latitude,
            last_known_gps_lng: pos.coords.longitude,
            last_seen_at: new Date().toISOString(),
          })
          .eq('id', equipment.id);
      } catch (gpsError) {
        console.warn('GPS alınamadı, işlem devam ediyor.');
      }
    }

    // 3. Sonucu Belirle (Herhangi biri 'false' ise sonuç 'fail'dir)
    const finalResult = checklistState.some((item) => item.status === false)
      ? 'fail'
      : 'pass';

    // 4. Veritabanına Kayıt
    const { error } = await supabase.from('inspections').insert({
      equipment_id: equipment.id,
      worker_name: workerInfo.fullName,
      worker_company: workerInfo.company,
      checklist_data: checklistState,
      result: finalResult,
      location_lat: currentGps.lat,
      location_lng: currentGps.lng,
    });

    if (!error) {
      // Eğer sorun varsa ekipman durumunu da güncelle
      if (finalResult === 'fail') {
        await supabase
          .from('equipment')
          .update({ status: 'maintenance_required' })
          .eq('id', equipment.id);
        alert(
          'Dikkat! Sorunlu ekipman bildirimi yapıldı. Lütfen kullanmayınız ve İSG birimine haber veriniz.'
        );
      } else {
        alert('Kontrol başarılı. Güvenli çalışmalar dileriz.');
      }
      navigate('/home');
    } else {
      alert('Kayıt hatası: ' + error.message);
      setSubmitting(false);
    }
  };

  // Checklist durumunu güncelleme yardımcısı
  const updateChecklistStatus = (index, status) => {
    const newState = [...checklistState];
    newState[index].status = status;
    setChecklistState(newState);
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 text-indigo-600 font-bold">
        Yükleniyor...
      </div>
    );

  return (
    <div className="min-h-screen bg-white font-sans antialiased text-left pb-10">
      {/* Header */}
      <header className="px-6 py-5 flex items-center border-b border-slate-100 sticky top-0 bg-white/90 backdrop-blur-md z-10">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 hover:bg-slate-50 rounded-xl transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <span className="ml-3 text-xs font-black text-slate-900 uppercase tracking-widest">
          İşe Başlama Kontrolü
        </span>
      </header>

      <main className="p-6 max-w-md mx-auto space-y-8">
        {/* Ekipman Başlığı */}
        <section>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 mb-3">
            <HardHat size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Zorunlu Form
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
            {equipment.name}
          </h1>
          <p className="text-slate-500 font-bold text-sm mt-1">
            {equipment.qr_code} • {equipment.equipment_types.name}
          </p>
        </section>

        {/* Form Başlangıcı */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 1. BÖLÜM: Personel Bilgileri */}
          <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4">
              <User size={16} className="text-indigo-500" /> Personel Kimliği
            </h3>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Ad Soyad <span className="text-red-500">*</span>
              </label>
              <input
                required
                className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                placeholder="Örn: Ahmet Yılmaz"
                value={workerInfo.fullName}
                onChange={(e) =>
                  setWorkerInfo({ ...workerInfo, fullName: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Firma / Taşeron <span className="text-red-500">*</span>
              </label>
              <input
                required
                className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                placeholder="Örn: Çelik Montaj Ltd."
                value={workerInfo.company}
                onChange={(e) =>
                  setWorkerInfo({ ...workerInfo, company: e.target.value })
                }
              />
            </div>
          </div>

          {/* 2. BÖLÜM: Kontrol Listesi (Checklist) */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 ml-2">
              <AlertTriangle size={16} className="text-amber-500" /> Güvenlik
              Kontrolleri
            </h3>
            <p className="text-xs text-slate-500 italic ml-2 mb-4">
              Lütfen aşağıdaki maddeleri fiziksel olarak kontrol edip durumunu
              işaretleyiniz.
            </p>

            {checklistState.map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-5 rounded-[2rem] border-2 border-slate-100 shadow-sm transition-all hover:border-indigo-100"
              >
                <p className="text-sm font-bold text-slate-900 mb-4 flex gap-3 leading-tight">
                  <span className="text-indigo-500 font-black">{idx + 1}.</span>{' '}
                  {item.label}
                </p>
                <div className="flex gap-3">
                  {/* SAĞLAM BUTONU */}
                  <button
                    type="button"
                    onClick={() => updateChecklistStatus(idx, true)}
                    className={`flex-1 py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95
                                ${
                                  item.status === true
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 scale-[1.02]'
                                    : 'bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'
                                }`}
                  >
                    <CheckCircle size={18} /> SAĞLAM
                  </button>
                  {/* SORUNLU BUTONU */}
                  <button
                    type="button"
                    onClick={() => updateChecklistStatus(idx, false)}
                    className={`flex-1 py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95
                                ${
                                  item.status === false
                                    ? 'bg-red-500 text-white shadow-lg shadow-red-200 scale-[1.02]'
                                    : 'bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600'
                                }`}
                  >
                    <XCircle size={18} /> SORUNLU
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Gönder Butonu */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={
                submitting || checklistState.some((i) => i.status === null)
              }
              className="w-full bg-indigo-600 text-white font-black py-5 rounded-[2.5rem] shadow-xl shadow-indigo-200 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:bg-slate-300 disabled:shadow-none"
            >
              {submitting ? (
                'Kaydediliyor...'
              ) : (
                <>
                  <Send size={20} /> KONTROLÜ ONAYLA & BAŞLA
                </>
              )}
            </button>
            {checklistState.some((i) => i.status === null) && (
              <p className="text-center text-xs text-red-500 font-bold mt-3">
                * Devam etmek için tüm maddeleri işaretlemelisiniz.
              </p>
            )}
          </div>
        </form>
      </main>
    </div>
  );
};

export default WorkerControlForm;

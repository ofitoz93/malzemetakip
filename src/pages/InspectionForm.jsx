import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Camera, MapPin, Send, AlertTriangle, CheckSquare } from 'lucide-react';

const InspectionForm = () => {
  const { qrId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [equipment, setEquipment] = useState(null);
  const [checklist, setChecklist] = useState([]); // Sorular ve Cevaplar
  const [photo, setPhoto] = useState(null);
  const [location, setLocation] = useState(null);

  // 1. Ekipman Bilgisini ve Soruları Çek
  useEffect(() => {
    const fetchData = async () => {
      // Önce ekipmanı bul
      const { data: eqData, error } = await supabase
        .from('equipment')
        .select(`*, equipment_types ( checklist_schema )`)
        .eq('qr_code', qrId)
        .single();

      if (error || !eqData) {
        alert('Ekipman bulunamadı!');
        navigate('/');
        return;
      }

      setEquipment(eqData);

      // JSON formatındaki soruları state'e aktar (Varsayılan cevap: true/sağlam)
      // Örn JSON: [{ id: "kablo", label: "Kablo sağlam mı?" }, { id: "muhafaza", label: "Koruyucu takılı mı?" }]
      const schema = eqData.equipment_types?.checklist_schema || [];
      const initialChecklist = schema.map((item) => ({
        ...item,
        status: true, // true: Sağlam, false: Sorunlu
        note: '',
      }));
      setChecklist(initialChecklist);
      setLoading(false);

      // 2. Konumu Al (Component açılınca)
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLocation({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            });
          },
          (err) => console.error('Konum alınamadı:', err)
        );
      }
    };

    fetchData();
  }, [qrId]);

  // Checklist Cevaplarını Güncelleme
  const handleCheckChange = (index, value) => {
    const newChecklist = [...checklist];
    newChecklist[index].status = value;
    setChecklist(newChecklist);
  };

  // Formu Gönder
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let photoUrl = null;

      // 1. Fotoğraf varsa yükle
      if (photo) {
        const fileName = `${qrId}/${Date.now()}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('inspection-photos')
          .upload(fileName, photo);

        if (uploadError) throw uploadError;

        // Public URL al
        const { data: publicUrlData } = supabase.storage
          .from('inspection-photos')
          .getPublicUrl(fileName);

        photoUrl = publicUrlData.publicUrl;
      }

      // 2. Denetim Sonucunu Belirle (Herhangi biri 'false' ise FAIL)
      const isFail = checklist.some((item) => item.status === false);
      const result = isFail ? 'fail' : 'pass';

      // 3. Veritabanına Kaydet
      const { error: insertError } = await supabase.from('inspections').insert({
        equipment_id: equipment.id,
        inspector_id: 'c878e1df-9d51-4604-9721-3642750e3346', // GEÇİCİ: Supabase Auth ID'si buraya gelecek
        result: result,
        checklist_data: checklist,
        gps_lat: location?.lat,
        gps_lng: location?.lng,
        photo_url: photoUrl,
        inspection_type: 'daily',
      });

      if (insertError) throw insertError;

      alert(
        isFail
          ? 'DİKKAT: Sorun bildirildi! Ekipman kilitlenecek.'
          : 'Kontrol başarılı. İyi çalışmalar.'
      );
      navigate('/');
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      alert('Hata oluştu: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-20">
      <h1 className="text-xl font-bold mb-4 text-slate-800 border-b pb-2">
        Günlük Kontrol: <span className="text-blue-600">{equipment.name}</span>
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Checklist Kartları */}
        {checklist.map((item, index) => (
          <div
            key={index}
            className={`p-4 rounded-xl border-2 transition-colors ${
              item.status
                ? 'bg-white border-gray-200'
                : 'bg-red-50 border-red-300'
            }`}
          >
            <p className="font-semibold text-lg mb-3 text-slate-700">
              {item.label}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleCheckChange(index, true)}
                className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 ${
                  item.status
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                <CheckSquare size={20} /> SAĞLAM
              </button>

              <button
                type="button"
                onClick={() => handleCheckChange(index, false)}
                className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 ${
                  !item.status
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                <AlertTriangle size={20} /> SORUNLU
              </button>
            </div>
          </div>
        ))}

        {/* Konum Bilgisi */}
        <div className="text-xs text-gray-400 flex items-center gap-1 justify-center">
          <MapPin size={12} />
          {location
            ? `Konum Alındı: ${location.lat.toFixed(4)}, ${location.lng.toFixed(
                4
              )}`
            : 'Konum aranıyor...'}
        </div>

        {/* Fotoğraf Yükleme (Sadece sorun varsa zorunlu olabilir ama şimdilik opsiyonel) */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Camera className="w-8 h-8 mb-2 text-gray-500" />
              <p className="text-sm text-gray-500">
                {photo ? `Seçildi: ${photo.name}` : 'Fotoğraf Ekle (Opsiyonel)'}
              </p>
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setPhoto(e.target.files[0])}
              capture="environment" // Mobilde direkt kamerayı açar
            />
          </label>
        </div>

        {/* Gönder Butonu */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-700 text-white font-bold py-4 rounded-xl shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          {submitting ? (
            'Gönderiliyor...'
          ) : (
            <>
              {' '}
              <Send size={20} /> KONTROLÜ TAMAMLA{' '}
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default InspectionForm;

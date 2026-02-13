import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import {
  Camera,
  MapPin,
  Send,
  ArrowLeft,
  Check,
  ChevronRight,
  Info,
} from 'lucide-react';

const InspectionForm = () => {
  const { qrId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [equipment, setEquipment] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [location, setLocation] = useState(null);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select(`*, equipment_types ( checklist_schema )`)
        .eq('qr_code', qrId)
        .single();

      if (error || !data) {
        navigate('/');
        return;
      }

      setEquipment(data);
      const schema = data.equipment_types?.checklist_schema || [];
      setChecklist(schema.map((item) => ({ ...item, status: null })));
      setLoading(false);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) =>
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        );
      }
    };
    fetchData();
  }, [qrId]);

  const handleStatusChange = (index, value) => {
    const newChecklist = [...checklist];
    newChecklist[index].status = value;
    setChecklist(newChecklist);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const unanswered = checklist.filter((item) => item.status === null).length;
    if (unanswered > 0) {
      setShowErrors(true);
      return;
    }
    setSubmitting(true);
    try {
      let photoUrl = null;
      if (photo) {
        const fileName = `${qrId}/${Date.now()}.jpg`;
        await supabase.storage
          .from('inspection-photos')
          .upload(fileName, photo);
        const { data } = supabase.storage
          .from('inspection-photos')
          .getPublicUrl(fileName);
        photoUrl = data.publicUrl;
      }
      const isFail = checklist.some((item) => item.status === false);
      const { error } = await supabase.from('inspections').insert({
        equipment_id: equipment.id,
        inspector_id: 'c878e1df-9d51-4604-9721-3642750e3346',
        result: isFail ? 'fail' : 'pass',
        checklist_data: checklist,
        gps_lat: location?.lat,
        gps_lng: location?.lng,
        photo_url: photoUrl,
      });
      if (error) throw error;
      if (isFail)
        await supabase
          .from('equipment')
          .update({ status: 'maintenance_required' })
          .eq('id', equipment.id);
      navigate('/');
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-indigo-600 font-medium">
        Sistem Yükleniyor...
      </div>
    );

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased">
      {/* Header: Tailscale style (Clean white with thin border) */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div className="text-center">
          <h1 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
            {equipment.name}
          </h1>
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-0.5">
            Güvenlik Denetimi
          </p>
        </div>
        <div className="w-9"></div> {/* Balancer */}
      </header>

      <main className="max-w-xl mx-auto p-6 space-y-8">
        {/* Info Banner */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-3">
          <Info className="text-indigo-600 shrink-0" size={20} />
          <p className="text-sm text-indigo-900 leading-relaxed">
            Lütfen ekipman üzerindeki kontrolleri tamamlayın. Tüm maddeler
            zorunludur.
          </p>
        </div>

        {/* Checklist */}
        <div className="space-y-6">
          {checklist.map((item, index) => (
            <section key={index} className="group">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 w-6 h-6 flex items-center justify-center rounded-md">
                  {index + 1}
                </span>
                <h3 className="text-sm font-semibold text-slate-800">
                  {item.label}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* SAĞLAM SEÇENEĞİ */}
                <button
                  type="button"
                  onClick={() => handleStatusChange(index, true)}
                  className={`relative flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all duration-200 text-sm font-semibold
                    ${
                      item.status === true
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-sm'
                        : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200 hover:bg-slate-50'
                    } ${
                    showErrors && item.status === null
                      ? 'border-red-200 bg-red-50/30'
                      : ''
                  }`}
                >
                  Sağlam
                  {item.status === true && (
                    <Check
                      size={16}
                      strokeWidth={3}
                      className="text-indigo-600"
                    />
                  )}
                </button>

                {/* SORUNLU SEÇENEĞİ */}
                <button
                  type="button"
                  onClick={() => handleStatusChange(index, false)}
                  className={`relative flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all duration-200 text-sm font-semibold
                    ${
                      item.status === false
                        ? 'border-red-600 bg-red-50 text-red-700 shadow-sm'
                        : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200 hover:bg-slate-50'
                    } ${
                    showErrors && item.status === null
                      ? 'border-red-200 bg-red-50/30'
                      : ''
                  }`}
                >
                  Sorunlu
                  {item.status === false && (
                    <Check size={16} strokeWidth={3} className="text-red-600" />
                  )}
                </button>
              </div>
            </section>
          ))}
        </div>

        {/* Media Upload Section */}
        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
            Görsel Kanıt
          </h4>
          <label className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-white transition-colors">
              <Camera size={20} className="text-slate-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-700">
                {photo ? photo.name : 'Fotoğraf Çek veya Yükle'}
              </p>
              <p className="text-xs text-slate-400">
                Arıza durumunda fotoğraf zorunludur.
              </p>
            </div>
            <ChevronRight size={16} className="text-slate-300" />
            <input
              type="file"
              className="hidden"
              onChange={(e) => setPhoto(e.target.files[0])}
              capture="environment"
            />
          </label>
        </div>

        {/* Submit Button */}
        <div className="pt-6">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
          >
            {submitting ? (
              'Kaydediliyor...'
            ) : (
              <>
                {' '}
                <Send size={18} /> Denetimi Tamamla{' '}
              </>
            )}
          </button>

          {location && (
            <div className="mt-6 flex items-center justify-center gap-1.5 text-slate-400">
              <MapPin size={12} />
              <span className="text-[10px] font-medium tracking-widest uppercase">
                Konum: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default InspectionForm;

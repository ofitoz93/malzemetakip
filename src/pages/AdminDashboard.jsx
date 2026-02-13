import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { QRCodeCanvas } from 'qrcode.react';
import {
  LayoutDashboard,
  AlertTriangle,
  CheckCircle,
  Search,
  Plus,
  Box,
  Wrench,
  Clock,
  ChevronRight,
  Printer,
  X,
  Tag,
  Hash,
  MapPin,
  Loader2,
  Info,
} from 'lucide-react';
import { format, isPast, differenceInDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useAuth } from '../hooks/useAuth';

const AdminDashboard = () => {
  const { user, role, loading: authLoading } = useAuth();
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modallar için State'ler
  const [isModalOpen, setIsModalOpen] = useState(false); // Yeni Kayıt Modalı
  const [selectedEq, setSelectedEq] = useState(null); // Eylem (Detay) Modalı

  const [types, setTypes] = useState([]);
  const [newEq, setNewEq] = useState({
    name: '',
    serial_number: '',
    type_id: '',
    qr_code: '',
    location_description: 'Merkez Atölye',
  });

  useEffect(() => {
    if (user) {
      fetchInventory();
      fetchTypes();
    }
  }, [user]);

  const fetchInventory = async () => {
    const { data } = await supabase
      .from('equipment')
      .select(`*, equipment_types(name, maintenance_period_days)`);
    setEquipmentList(data || []);
    setLoading(false);
  };

  const fetchTypes = async () => {
    const { data } = await supabase.from('equipment_types').select('*');
    setTypes(data || []);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const finalQr =
      newEq.qr_code ||
      `EQ-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const selectedType = types.find((t) => t.id === newEq.type_id);
    const nextDate = new Date();
    nextDate.setDate(
      nextDate.getDate() + (selectedType?.maintenance_period_days || 365)
    );

    const { error } = await supabase.from('equipment').insert({
      ...newEq,
      qr_code: finalQr,
      next_maintenance_date: nextDate.toISOString(),
      status: 'active',
      last_maintenance_date: new Date().toISOString(),
    });

    if (!error) {
      setIsModalOpen(false);
      fetchInventory();
      setNewEq({
        name: '',
        serial_number: '',
        type_id: '',
        qr_code: '',
        location_description: 'Merkez Atölye',
      });
    } else {
      alert('Hata: ' + error.message);
    }
  };

  const faultyItems = equipmentList.filter(
    (item) => item.status === 'maintenance_required'
  );
  const overdueItems = equipmentList.filter(
    (item) =>
      isPast(new Date(item.next_maintenance_date)) &&
      item.status !== 'maintenance_required'
  );

  if (authLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased text-left">
      {/* 1. Navigasyon */}
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-lg">
            <LayoutDashboard size={20} />
          </div>
          <div className="text-left">
            <h1 className="text-lg font-bold text-slate-900 leading-none">
              Yönetim Dashboard
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Cemre Tersanesi Ekipman Kontrolü
            </p>
          </div>
        </div>
        {role === 'admin' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95 shadow-md"
          >
            <Plus size={18} /> Yeni Ekipman Ekle
          </button>
        )}
      </nav>

      <main className="p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* 2. Kritik Uyarı Kartları */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AlertBox
            title="ARIZALI EKİPMANLAR"
            count={faultyItems.length}
            items={faultyItems}
            color="red"
            icon={<AlertTriangle size={20} />}
          />
          <AlertBox
            title="BAKIMI GEÇMİŞ / KRİTİK"
            count={overdueItems.length}
            items={overdueItems}
            color="amber"
            icon={<Clock size={20} />}
          />
        </section>

        {/* 3. Envanter Tablosu */}
        <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest">
              Tüm Envanter Durumu
            </h2>
            <div className="relative">
              <Search
                className="absolute left-3 top-2.5 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="İsim veya QR ara..."
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none w-64 focus:bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Ekipman</th>
                  <th className="px-6 py-4">Durum</th>
                  <th className="px-6 py-4">Sıradaki Bakım</th>
                  <th className="px-6 py-4 text-right">Eylem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {equipmentList
                  .filter((i) =>
                    i.name.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-700">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                          {item.qr_code}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge
                          status={item.status}
                          date={item.next_maintenance_date}
                        />
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                        {format(
                          new Date(item.next_maintenance_date),
                          'dd MMM yyyy',
                          { locale: tr }
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {/* EYLEM BUTONU: Artık bir fonksiyona bağlı */}
                        <button
                          onClick={() => setSelectedEq(item)}
                          className="text-indigo-600 hover:bg-indigo-50 p-2.5 rounded-xl transition-all active:scale-90"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* 4. EYLEM / DETAY VE QR MODALI */}
      {selectedEq && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedEq(null)}
        >
          <div
            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="text-left">
                <h3 className="font-black text-slate-800 tracking-tight">
                  Ekipman Detayı
                </h3>
                <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">
                  Envanter No: {selectedEq.qr_code}
                </p>
              </div>
              <button
                onClick={() => setSelectedEq(null)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-8 text-center">
              {/* QR KOD ALANI */}
              <div className="bg-white border-2 border-slate-50 p-6 rounded-[2rem] inline-block shadow-inner">
                <QRCodeCanvas
                  value={`${window.location.origin}/equipment/${selectedEq.qr_code}`}
                  size={180}
                  level="H"
                  includeMargin={true}
                />
                <div className="mt-4 font-mono text-[11px] font-black text-slate-400 tracking-[0.3em] uppercase">
                  {selectedEq.qr_code}
                </div>
              </div>

              {/* EKİPMAN BİLGİLERİ */}
              <div className="text-left space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Cihaz Adı
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                      {selectedEq.name}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Tür
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                      {selectedEq.equipment_types?.name}
                    </p>
                  </div>
                </div>
                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex items-center gap-3">
                  <MapPin size={18} className="text-indigo-500" />
                  <div>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                      Son Görülen Konum
                    </p>
                    <p className="text-sm font-bold text-indigo-900">
                      {selectedEq.location_description || 'Tersane Sahası'}
                    </p>
                  </div>
                </div>
              </div>

              {/* BUTONLAR */}
              <div className="flex gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                >
                  <Printer size={18} /> Yazdır
                </button>
                <button
                  onClick={() => setSelectedEq(null)}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. YENİ EKİPMAN EKLEME MODALI */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-extrabold text-slate-800 tracking-tight">
                Yeni Ekipman Tanımla
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    <Tag size={12} className="inline mr-1" /> Ekipman Adı
                  </label>
                  <input
                    required
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none"
                    placeholder="Örn: Bosch GWS 750"
                    value={newEq.name}
                    onChange={(e) =>
                      setNewEq({ ...newEq, name: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                      Tür
                    </label>
                    <select
                      required
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none"
                      value={newEq.type_id}
                      onChange={(e) =>
                        setNewEq({ ...newEq, type_id: e.target.value })
                      }
                    >
                      <option value="">Seçiniz</option>
                      {types.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                      <Hash size={12} className="inline mr-1" /> Seri No
                    </label>
                    <input
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none"
                      placeholder="SN-..."
                      value={newEq.serial_number}
                      onChange={(e) =>
                        setNewEq({ ...newEq, serial_number: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100"
                >
                  KAYDET
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Yardımcı Bileşenler
const AlertBox = ({ title, count, items, color, icon }) => (
  <div
    className={`bg-white border-l-4 rounded-2xl shadow-sm p-6 flex flex-col gap-4 text-left ${
      color === 'red' ? 'border-red-500' : 'border-amber-500'
    }`}
  >
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        <div
          className={`${
            color === 'red'
              ? 'text-red-500 bg-red-50'
              : 'text-amber-500 bg-amber-50'
          } p-2 rounded-lg`}
        >
          {icon}
        </div>
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">
          {title}
        </h3>
      </div>
      <span
        className={`text-2xl font-black ${
          color === 'red' ? 'text-red-600' : 'text-amber-600'
        }`}
      >
        {count}
      </span>
    </div>
    <div className="space-y-2">
      {items.slice(0, 3).map((i) => (
        <div
          key={i.id}
          className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100"
        >
          <span className="text-xs font-bold text-slate-600 truncate max-w-[140px]">
            {i.name}
          </span>
          <span className="text-[10px] font-mono text-slate-400 font-bold">
            {i.qr_code}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const StatusBadge = ({ status, date }) => {
  const isOverdue = isPast(new Date(date));
  if (status === 'maintenance_required')
    return (
      <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-1 rounded-md border border-red-100">
        ARIZALI
      </span>
    );
  if (isOverdue)
    return (
      <span className="bg-amber-50 text-amber-600 text-[10px] font-bold px-2 py-1 rounded-md border border-amber-100 uppercase">
        Bakım Geçmiş
      </span>
    );
  return (
    <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-md border border-emerald-100">
      SAĞLAM
    </span>
  );
};

export default AdminDashboard;

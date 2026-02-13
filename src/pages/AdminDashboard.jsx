import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { QRCodeCanvas } from 'qrcode.react';
import {
  LayoutDashboard,
  AlertTriangle,
  CheckCircle,
  Search,
  Printer,
  Plus,
} from 'lucide-react';
import { format, isPast, addDays } from 'date-fns';
import { tr } from 'date-fns/locale';

const AdminDashboard = () => {
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQr, setSelectedQr] = useState(null); // QR'ı büyütmek için

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    const { data, error } = await supabase
      .from('equipment')
      .select(`*, equipment_types(name)`)
      .order('next_maintenance_date', { ascending: true }); // En acil olan en üstte

    if (error) console.error('Hata:', error);
    else setEquipmentList(data);
    setLoading(false);
  };

  // İstatistikleri Hesapla
  const stats = {
    total: equipmentList.length,
    critical: equipmentList.filter((e) =>
      isPast(new Date(e.next_maintenance_date))
    ).length,
    active: equipmentList.filter(
      (e) => !isPast(new Date(e.next_maintenance_date))
    ).length,
  };

  // Arama Filtresi
  const filteredList = equipmentList.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.qr_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      {/* Üst Başlık */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <LayoutDashboard /> Komuta Merkezi
          </h1>
          <p className="text-slate-500">Tersane Ekipman Takip Sistemi v1.0</p>
        </div>
        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-lg transition-all">
          <Plus size={20} /> Yeni Ekipman Ekle
        </button>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-slate-500 mb-1">Toplam Envanter</p>
          <p className="text-4xl font-bold text-slate-800">{stats.total}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-slate-500 mb-1">Aktif & Güvenli</p>
          <p className="text-4xl font-bold text-green-600 flex items-center gap-2">
            {stats.active} <CheckCircle size={24} />
          </p>
        </div>
        <div className="bg-red-50 p-6 rounded-xl shadow-sm border border-red-200">
          <p className="text-red-600 mb-1 font-semibold">
            Bakımı Geçen / Kilitli
          </p>
          <p className="text-4xl font-bold text-red-700 flex items-center gap-2">
            {stats.critical} <AlertTriangle size={24} />
          </p>
        </div>
      </div>

      {/* Arama ve Tablo */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-3 text-slate-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Ekipman adı, seri no veya QR ara..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase text-sm font-semibold">
              <tr>
                <th className="p-4">Durum</th>
                <th className="p-4">Ekipman Adı</th>
                <th className="p-4">Tür</th>
                <th className="p-4">QR ID</th>
                <th className="p-4">Sonraki Bakım</th>
                <th className="p-4 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center">
                    Yükleniyor...
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const isCritical = isPast(
                    new Date(item.next_maintenance_date)
                  );
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-4">
                        {isCritical ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            KİLİTLİ
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            AKTİF
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-medium text-slate-900">
                        {item.name}
                      </td>
                      <td className="p-4 text-slate-500">
                        {item.equipment_types?.name}
                      </td>
                      <td className="p-4 font-mono text-xs bg-slate-100 rounded w-fit">
                        {item.qr_code}
                      </td>
                      <td
                        className={`p-4 font-semibold ${
                          isCritical ? 'text-red-600' : 'text-slate-600'
                        }`}
                      >
                        {format(
                          new Date(item.next_maintenance_date),
                          'dd MMM yyyy',
                          { locale: tr }
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => setSelectedQr(item)}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-full transition-colors"
                          title="QR Yazdır"
                        >
                          <Printer size={20} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Yazdırma Modalı */}
      {selectedQr && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={() => setSelectedQr(null)}
        >
          <div
            className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-2">{selectedQr.name}</h3>
            <p className="text-slate-500 text-sm mb-6">
              {selectedQr.serial_number}
            </p>

            <div className="bg-white border-4 border-slate-900 p-4 rounded-xl inline-block mb-6">
              <QRCodeCanvas value={selectedQr.qr_code} size={200} level="H" />
            </div>

            <div className="flex gap-2">
              <button
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 py-3 rounded-xl font-medium"
                onClick={() => setSelectedQr(null)}
              >
                Kapat
              </button>
              <button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                onClick={() => window.print()}
              >
                <Printer size={18} /> Yazdır
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

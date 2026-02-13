import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { QRCodeCanvas } from 'qrcode.react';
import {
  LayoutDashboard,
  AlertTriangle,
  Search,
  Plus,
  Box,
  Clock,
  ChevronRight,
  Printer,
  X,
  Tag,
  Hash,
  MapPin,
  Loader2,
  ClipboardList,
  Bell,
  Ship,
  Layers,
  Building2,
  Briefcase,
} from 'lucide-react';
import { format, isPast } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useAuth } from '../hooks/useAuth';

const AdminDashboard = () => {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [equipmentList, setEquipmentList] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [projects, setProjects] = useState([]);
  const [types, setTypes] = useState([]);
  const [companies, setCompanies] = useState([]); // Firmalar state'i
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State'leri
  const [activeModal, setActiveModal] = useState(null); // 'equipment', 'project', 'type', 'company', 'detail'
  const [selectedEq, setSelectedEq] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  // Yeni Kayıt State'leri
  const [newEq, setNewEq] = useState({
    name: '',
    serial_number: '',
    type_id: '',
    project_id: '',
    company_id: '',
    qr_code: '',
    location_description: 'Merkez Atölye',
  });
  const [newProject, setNewProject] = useState({
    project_code: '',
    project_name: '',
  });
  const [newType, setNewType] = useState({
    name: '',
    maintenance_period_days: 180,
  });
  const [newCompany, setNewCompany] = useState({
    name: '',
    category: 'taşeron',
  });

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchInventory(),
      fetchTypes(),
      fetchProjects(),
      fetchCompanies(), // Firmaları çek
      fetchInspections(),
      fetchNotifications(),
    ]);
    setLoading(false);
  };

  const fetchInventory = async () => {
    const { data } = await supabase
      .from('equipment')
      .select(
        `*, equipment_types(name), projects(project_code), companies(name)`
      );
    setEquipmentList(data || []);
  };

  const fetchTypes = async () => {
    const { data } = await supabase
      .from('equipment_types')
      .select('*')
      .order('name');
    setTypes(data || []);
  };

  const fetchProjects = async () => {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    setProjects(data || []);
  };

  const fetchCompanies = async () => {
    const { data } = await supabase.from('companies').select('*').order('name');
    setCompanies(data || []);
  };

  const fetchInspections = async () => {
    const { data } = await supabase
      .from('inspections')
      .select(`*, equipment(name, qr_code)`)
      .order('created_at', { ascending: false })
      .limit(10);
    setInspections(data || []);
  };

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('is_read', false);
    setNotifications(data || []);
  };

  // --- KAYIT FONKSİYONLARI ---

  const handleSaveEquipment = async (e) => {
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
      setActiveModal(null);
      fetchInventory();
    }
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('projects').insert([newProject]);
    if (!error) {
      setActiveModal(null);
      fetchProjects();
    }
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('companies').insert([newCompany]);
    if (!error) {
      setActiveModal(null);
      fetchCompanies();
    }
  };

  const filteredItems = equipmentList.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.qr_code.includes(searchTerm)
  );

  if (authLoading || loading)
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased text-left pb-12">
      {/* 1. Üst Navigasyon */}
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-lg">
            <LayoutDashboard size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-none">
              Cemre Yönetim Merkezi
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Ekipman & Taşeron Takibi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex gap-3 mr-4 border-r pr-4 border-slate-100">
            <button
              onClick={() => setActiveModal('project')}
              className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 hover:text-indigo-600 uppercase transition-all"
            >
              <Ship size={14} /> Proje
            </button>
            <button
              onClick={() => setActiveModal('company')}
              className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 hover:text-indigo-600 uppercase transition-all"
            >
              <Building2 size={14} /> Firma
            </button>
          </div>

          <button
            onClick={() => navigate('/notifications')}
            className="relative p-2.5 bg-slate-50 text-slate-600 rounded-xl border border-slate-100 hover:bg-white transition-all"
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
            )}
          </button>

          <button
            onClick={() => setActiveModal('equipment')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md shadow-indigo-100 transition-all active:scale-95"
          >
            <Plus size={18} /> Yeni Kayıt
          </button>
        </div>
      </nav>

      <main className="p-8 max-w-7xl mx-auto w-full space-y-10">
        {/* Envanter Tablosu */}
        <section className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest text-left">
              Tersane Envanteri
            </h2>
            <div className="relative">
              <Search
                className="absolute left-3 top-2.5 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Ara..."
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none w-64 focus:bg-white transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto text-left">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase border-b border-slate-100 text-left">
                  <th className="px-6 py-4">Ekipman & Detay</th>
                  <th className="px-6 py-4">Zimmetli Firma</th>
                  <th className="px-6 py-4 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/50 border-b border-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800">
                          {item.name}
                        </span>
                        <span className="bg-indigo-50 text-indigo-600 text-[9px] font-black px-1.5 py-0.5 rounded border border-indigo-100 uppercase">
                          {item.projects?.project_code || 'GENEL'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                        {item.qr_code} • {item.equipment_types?.name}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Briefcase size={12} className="text-slate-300" />
                        <span className="text-xs font-bold text-slate-600">
                          {item.companies?.name || 'Firma Atanmamış'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedEq(item);
                          setActiveModal('detail');
                        }}
                        className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-all"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* --- MODALLAR --- */}

      {/* 1. Yeni Firma Modalı */}
      {activeModal === 'company' && (
        <ModalLayout
          title="Yeni Firma / Taşeron Tanımla"
          onClose={() => setActiveModal(null)}
        >
          <form onSubmit={handleSaveCompany} className="space-y-4">
            <Input
              label="Firma Adı"
              placeholder="Örn: Özdemir Boru Ltd."
              value={newCompany.name}
              onChange={(e) =>
                setNewCompany({ ...newCompany, name: e.target.value })
              }
            />
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                Kategori
              </label>
              <select
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                value={newCompany.category}
                onChange={(e) =>
                  setNewCompany({ ...newCompany, category: e.target.value })
                }
              >
                <option value="taşeron">Taşeron</option>
                <option value="ana_firma">Ana Firma</option>
                <option value="servis">Dış Servis / Bakım</option>
              </select>
            </div>
            <SubmitBtn label="Firmayı Kaydet" />
          </form>
        </ModalLayout>
      )}

      {/* 2. Yeni Ekipman Modalı (Firma Seçimli) */}
      {activeModal === 'equipment' && (
        <ModalLayout
          title="Yeni Ekipman Kaydı"
          onClose={() => setActiveModal(null)}
        >
          <form onSubmit={handleSaveEquipment} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                  Proje
                </label>
                <select
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  value={newEq.project_id}
                  onChange={(e) =>
                    setNewEq({ ...newEq, project_id: e.target.value })
                  }
                >
                  <option value="">Seçiniz</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.project_code}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                  Firma
                </label>
                <select
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  value={newEq.company_id}
                  onChange={(e) =>
                    setNewEq({ ...newEq, company_id: e.target.value })
                  }
                >
                  <option value="">Zimmet Seç</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Input
              label="Ekipman Adı"
              placeholder="Örn: Miller Kaynak Makinesi"
              value={newEq.name}
              onChange={(e) => setNewEq({ ...newEq, name: e.target.value })}
            />
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                Ekipman Türü
              </label>
              <select
                required
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                value={newEq.type_id}
                onChange={(e) =>
                  setNewEq({ ...newEq, type_id: e.target.value })
                }
              >
                <option value="">Tür Seçiniz</option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <SubmitBtn label="Envantere Ekle" />
          </form>
        </ModalLayout>
      )}

      {/* Detay Modalı (Proje ve Firma bilgisi dahil) */}
      {activeModal === 'detail' && selectedEq && (
        <ModalLayout title="Cihaz Kimliği" onClose={() => setActiveModal(null)}>
          <div className="text-center space-y-6">
            <div className="bg-white border-2 border-slate-50 p-6 rounded-[2rem] inline-block shadow-inner">
              <QRCodeCanvas
                value={`${window.location.origin}/equipment/${selectedEq.qr_code}`}
                size={160}
                level="H"
              />
              <p className="mt-4 font-mono text-[10px] font-black text-slate-300 tracking-widest">
                {selectedEq.qr_code}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">
                  Proje
                </p>
                <p className="text-xs font-black text-slate-700">
                  {selectedEq.projects?.project_code || 'Genel'}
                </p>
              </div>
              <div className="bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100">
                <p className="text-[9px] font-bold text-indigo-400 uppercase mb-1">
                  Zimmetli Firma
                </p>
                <p className="text-xs font-black text-indigo-900 truncate">
                  {selectedEq.companies?.name || 'Atanmamış'}
                </p>
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-200 transition-all"
            >
              <Printer size={18} /> Etiketi Yazdır
            </button>
          </div>
        </ModalLayout>
      )}
    </div>
  );
};

// --- YARDIMCI BİLEŞENLER ---
const ModalLayout = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 text-left">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 text-left">
        <h3 className="font-black text-slate-800 tracking-tight uppercase text-xs text-left">
          {title}
        </h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-200 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
      </div>
      <div className="p-6 text-left">{children}</div>
    </div>
  </div>
);

const Input = ({ label, ...props }) => (
  <div className="space-y-1 text-left">
    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 text-left">
      {label}
    </label>
    <input
      {...props}
      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white transition-all text-left"
    />
  </div>
);

const SubmitBtn = ({ label }) => (
  <button
    type="submit"
    className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 mt-4 active:scale-95 transition-all uppercase text-xs tracking-widest"
  >
    {label}
  </button>
);

export default AdminDashboard;

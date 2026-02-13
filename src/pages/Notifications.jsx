import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  AlertCircle,
  CheckCircle,
  Trash2,
  ArrowLeft,
  Clock,
  Loader2,
  Settings,
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useAuth } from '../hooks/useAuth';

const Notifications = () => {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*, equipment(name, qr_code)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error('Bildirimler yüklenemedi:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    fetchNotifications();
  };

  const deleteNotification = async (id) => {
    await supabase.from('notifications').delete().eq('id', id);
    fetchNotifications();
  };

  // Yükleme Durumu Kontrolü
  if (authLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased text-left pb-10">
      {/* Üst Bar */}
      <nav className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-50 rounded-xl transition-all"
          >
            <ArrowLeft size={22} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none text-left">
              Bildirim Merkezi
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 text-left">
              Saha Arıza & Uyarı Takibi
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100">
            {notifications.filter((n) => !n.is_read).length} Aktif Uyarı
          </span>
        </div>
      </nav>

      <main className="p-8 max-w-3xl mx-auto w-full space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
            <div className="bg-emerald-50 p-6 rounded-full inline-block mb-4">
              <CheckCircle size={48} className="text-emerald-500" />
            </div>
            <h3 className="text-slate-800 font-bold">Tersane Güvende!</h3>
            <p className="text-slate-400 text-sm mt-1">
              Şu an müdahale gerektiren bir bildirim bulunmuyor.
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`bg-white border p-6 rounded-[2rem] shadow-sm transition-all flex gap-5 ${
                !notif.is_read
                  ? 'ring-2 ring-indigo-600/5 border-indigo-100'
                  : 'border-slate-100 opacity-60 grayscale-[0.5]'
              }`}
            >
              <div
                className={`p-4 rounded-2xl h-fit ${
                  notif.type === 'danger'
                    ? 'bg-red-50 text-red-500'
                    : 'bg-amber-50 text-amber-500'
                }`}
              >
                <AlertCircle size={28} />
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight text-left">
                      {notif.title}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase mt-1 text-left">
                      <Clock size={12} />{' '}
                      {format(
                        new Date(notif.created_at),
                        'dd MMMM yyyy, HH:mm',
                        { locale: tr }
                      )}
                    </p>
                  </div>
                  {!notif.is_read && (
                    <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-pulse shadow-lg shadow-indigo-200" />
                  )}
                </div>

                <p className="text-sm text-slate-600 leading-relaxed font-medium text-left">
                  {notif.message}
                </p>

                {notif.equipment && (
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <Settings size={14} className="text-slate-400" />
                      <span className="text-[11px] font-bold text-slate-700">
                        {notif.equipment.name}
                      </span>
                      <code className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-slate-500">
                        {notif.equipment.qr_code}
                      </code>
                    </div>
                    <button
                      onClick={() =>
                        navigate(`/equipment/${notif.equipment.qr_code}`)
                      }
                      className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                    >
                      İncele
                    </button>
                  </div>
                )}

                <div className="flex gap-6 pt-4 border-t border-slate-50 items-center justify-start">
                  {!notif.is_read ? (
                    <button
                      onClick={() => markAsRead(notif.id)}
                      className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.1em] hover:bg-emerald-50 px-2 py-1 rounded-lg transition-all"
                    >
                      Okundu Olarak İşaretle
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Okundu
                    </span>
                  )}
                  <button
                    onClick={() => deleteNotification(notif.id)}
                    className="text-[10px] font-black text-slate-300 hover:text-red-500 uppercase tracking-[0.1em] flex items-center gap-1 transition-all"
                  >
                    <Trash2 size={12} /> Sil
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
};

export default Notifications;

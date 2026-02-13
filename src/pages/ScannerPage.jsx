import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scanner } from '@yudiel/react-qr-scanner'; // Yeni kütüphane
import { Keyboard, Camera } from 'lucide-react';

const ScannerPage = () => {
  const navigate = useNavigate();
  const [manualId, setManualId] = useState('');
  const [error, setError] = useState(null);

  const handleScan = (result) => {
    if (result) {
      // Bu kütüphane sonucu dizi olarak döner [{ rawValue: '...' }]
      const rawValue = result[0]?.rawValue;
      if (rawValue) {
        navigate(`/equipment/${rawValue}`);
      }
    }
  };

  const handleError = (err) => {
    console.error(err);
    setError('Kamera hatası! Lütfen izinleri kontrol edin.');
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualId) navigate(`/equipment/${manualId}`);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black relative">
      <h1 className="absolute top-10 text-white z-10 text-xl font-bold tracking-wider drop-shadow-md">
        EKİPMAN TARAMA
      </h1>

      {/* Kamera Alanı */}
      <div className="w-full h-full relative flex items-center justify-center bg-gray-900">
        <div className="w-full h-full md:max-w-md md:aspect-square relative overflow-hidden">
          {/* Yeni Tarayıcı Bileşeni */}
          <Scanner
            onScan={handleScan}
            onError={handleError}
            components={{
              audio: false,
              onOff: true,
              finder: false, // Kendi çerçevemizi kullanacağız
            }}
            styles={{
              container: { width: '100%', height: '100%' },
              video: { objectFit: 'cover' },
            }}
          />
        </div>

        {/* Görsel Çerçeve Efekti (Overlay) */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-64 h-64 border-2 border-green-500 rounded-lg relative animate-pulse shadow-[0_0_50px_rgba(0,255,0,0.3)]">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-green-500"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-green-500"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-green-500"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-green-500"></div>
          </div>
          <p className="absolute bottom-40 text-white/80 text-sm font-light bg-black/50 px-3 py-1 rounded-full">
            QR Kodu çerçeveye ortala
          </p>
        </div>
      </div>

      {/* Manuel Giriş Alanı (Alt Panel) */}
      <div className="absolute bottom-0 w-full bg-white rounded-t-3xl p-6 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20">
        <p className="text-gray-500 text-sm mb-2 text-center flex items-center justify-center gap-2">
          <Camera size={16} /> Kamera çalışmıyor mu?
        </p>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="QR ID Gir (Örn: TM-001)"
            className="flex-1 border border-gray-300 p-3 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition-colors shadow-lg shadow-blue-200"
          >
            <Keyboard />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ScannerPage;

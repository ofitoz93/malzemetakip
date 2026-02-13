import React from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// İkon düzeltmesi
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const EquipmentMap = ({ items = [], history = [] }) => {
  // Varsayılan merkez: Yalova Tersaneler Bölgesi
  const center =
    items.length > 0 && items[0].last_known_gps_lat
      ? [items[0].last_known_gps_lat, items[0].last_known_gps_lng]
      : [40.718, 29.475];

  // Geçmiş rotası için koordinat dizisi oluştur
  const polylineCoords = history.map((log) => [log.lat, log.lng]);

  return (
    <MapContainer
      center={center}
      zoom={15}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* 1. Güncel Konumlar (Markerlar) */}
      {items.map(
        (item) =>
          item.last_known_gps_lat && (
            <Marker
              key={item.id}
              position={[item.last_known_gps_lat, item.last_known_gps_lng]}
            >
              <Popup>
                <div className="text-xs font-bold">
                  <p className="text-indigo-600">{item.name}</p>
                  <p className="text-slate-400 uppercase">{item.qr_code}</p>
                </div>
              </Popup>
            </Marker>
          )
      )}

      {/* 2. Geçmiş İzi (Çizgi) */}
      {history.length > 1 && (
        <Polyline
          positions={polylineCoords}
          color="#4f46e5"
          weight={4}
          opacity={0.6}
          dashArray="10, 10"
        />
      )}

      {/* 3. Geçmiş Noktaları (Küçük Yuvarlaklar) */}
      {history.map((log, idx) => (
        <Marker
          key={log.id}
          position={[log.lat, log.lng]}
          icon={
            idx === 0
              ? L.divIcon({
                  className:
                    'bg-emerald-500 w-3 h-3 rounded-full border-2 border-white shadow-sm',
                })
              : L.divIcon({
                  className:
                    'bg-indigo-400 w-2 h-2 rounded-full border border-white',
                })
          }
        >
          <Popup>
            <div className="text-[10px] font-bold">
              {new Date(log.created_at).toLocaleString('tr-TR')}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default EquipmentMap;

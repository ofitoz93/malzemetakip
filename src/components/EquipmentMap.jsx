import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leaflet ikon hatasını düzeltmek için (Varsayılan ikonlar bazen yüklenmez)
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const EquipmentMap = ({ items }) => {
  // Tersane merkezi (Varsayılan olarak Yalova Tersaneler Bölgesi civarı)
  const shipyardCenter = [40.723, 29.493];

  return (
    
    <div className="h-[400px] w-full bg-slate-100 rounded-xl overflow-hidden grayscale-[0.2] hover:grayscale-0 transition-all duration-500">
      <MapContainer
        center={shipyardCenter}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {items
          .filter((item) => item.last_known_gps_lat)
          .map((item) => (
            <Marker
              key={item.id}
              position={[item.last_known_gps_lat, item.last_known_gps_lng]}
            >
              <Popup>
                <div className="p-1">
                  <h4 className="font-bold text-indigo-700 text-sm">
                    {item.name}
                  </h4>
                  <p className="text-[10px] text-slate-500 uppercase mt-1">
                    {item.qr_code}
                  </p>
                  <p className="text-xs font-medium text-slate-600 mt-2">
                    Durum:{' '}
                    {item.status === 'active' ? '✅ Aktif' : '❌ Kilitli'}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
};

export default EquipmentMap;

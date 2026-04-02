import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { PesticideApplication } from '../types';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, MapPin, Sprout, Droplets, Info, ExternalLink } from 'lucide-react';

// Fix for default marker icon in Leaflet with React
let DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  applications: PesticideApplication[];
  userLocation: [number, number] | null;
  radius: number; // in meters
}

function ChangeView({ center, zoom }: { center: [number, number], zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (zoom) {
      map.setView(center, zoom, { animate: true });
    } else {
      map.setView(center, map.getZoom());
    }
  }, [center, zoom, map]);
  return null;
}

export const Map: React.FC<MapProps> = ({ applications, userLocation, radius }) => {
  const [selectedApp, setSelectedApp] = useState<PesticideApplication | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [mapZoom, setMapZoom] = useState<number | undefined>(undefined);

  const defaultCenter: [number, number] = [38.5816, -121.4944]; // Sacramento area
  const initialCenter = userLocation || defaultCenter;

  const handleMarkerClick = (app: PesticideApplication) => {
    setSelectedApp(app);
    setMapCenter([app.latitude, app.longitude]);
    setMapZoom(14);
  };

  return (
    <div className="relative h-[600px] w-full rounded-xl overflow-hidden shadow-lg border border-slate-200 bg-slate-100">
      <MapContainer 
        center={initialCenter} 
        zoom={11} 
        scrollWheelZoom={true} 
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {mapCenter && <ChangeView center={mapCenter} zoom={mapZoom} />}
        
        {userLocation && (
          <>
            {!mapCenter && <ChangeView center={userLocation} />}
            <Marker position={userLocation}>
              <Popup>Your Location</Popup>
            </Marker>
            <Circle 
              center={userLocation} 
              radius={radius} 
              pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }} 
            />
          </>
        )}

        {applications.map((app) => (
          <Marker 
            key={app.id} 
            position={[app.latitude, app.longitude]}
            eventHandlers={{
              click: () => handleMarkerClick(app),
            }}
          >
            <Popup>
              <div className="p-1">
                <h3 className="font-bold text-slate-900">{app.pesticideName}</h3>
                <p className="text-xs text-slate-500">Click for details</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Detail Panel */}
      <AnimatePresence>
        {selectedApp && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 h-full w-full sm:w-80 bg-white shadow-2xl z-[1001] border-l border-slate-200 flex flex-col"
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-600" />
                Application Details
              </h3>
              <button 
                onClick={() => setSelectedApp(null)}
                className="p-1 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Pesticide</span>
                <h2 className="text-xl font-bold text-slate-900 leading-tight">{selectedApp.pesticideName}</h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase">Date Applied</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {format(selectedApp.applicationDate.toDate(), 'PPP')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <Sprout className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase">Crop Target</p>
                    <p className="text-sm font-semibold text-slate-900">{selectedApp.cropName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <Droplets className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase">Amount</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {selectedApp.amountApplied} {selectedApp.unit}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase">Location</p>
                    <p className="text-sm font-semibold text-slate-900">{selectedApp.county} County</p>
                    <p className="text-[10px] text-slate-400">Site: {selectedApp.siteCode}</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <button className="w-full py-3 px-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200">
                  <ExternalLink className="w-4 h-4" />
                  View Full Report
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Map } from '../components/Map';
import { pesticideService } from '../services/pesticideService';
import { PesticideApplication } from '../types';
import { MapPin, Navigation, Info, Database, LogIn } from 'lucide-react';
import { motion } from 'motion/react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

export const Home: React.FC = () => {
  const [applications, setApplications] = useState<PesticideApplication[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [radius, setRadius] = useState(5000); // 5km default
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    const unsubscribeApps = pesticideService.subscribeToApplications((apps) => {
      setApplications(apps);
      setLoading(false);
    });

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }

    return () => {
      unsubscribeAuth();
      unsubscribeApps();
    };
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleAddMockData = async () => {
    if (!user) {
      alert("Please sign in to add mock data.");
      return;
    }
    try {
      await pesticideService.addMockData();
      alert("Mock data added successfully!");
    } catch (error) {
      console.error("Error adding mock data:", error);
      if (error instanceof Error) {
        try {
          const errInfo = JSON.parse(error.message);
          alert(`Permission Error: ${errInfo.error}\n\nMake sure you are signed in as the admin (AArasawa@gmail.com).`);
        } catch {
          alert(`Error adding mock data: ${error.message}`);
        }
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Pesticide Use Map</h1>
          <p className="text-slate-600 mt-1">Visualize historical pesticide applications in your area.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
            <Navigation className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium text-slate-700">Radius: {radius / 1000}km</span>
          </div>
          <input 
            type="range" 
            min="1000" 
            max="50000" 
            step="1000" 
            value={radius} 
            onChange={(e) => setRadius(parseInt(e.target.value))}
            className="w-32 accent-indigo-600"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Map 
              applications={applications} 
              userLocation={userLocation} 
              radius={radius} 
            />
          </motion.div>
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
            <h3 className="text-indigo-900 font-semibold flex items-center gap-2 mb-3">
              <Info className="w-5 h-5" />
              How it works
            </h3>
            <p className="text-sm text-indigo-800 leading-relaxed">
              This map displays Pesticide Use Report (PUR) data. Markers represent specific application sites. 
              The blue circle shows your current search radius.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-slate-900 font-semibold flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-slate-400" />
              Data Controls
            </h3>
            {user ? (
              <button 
                onClick={handleAddMockData}
                className="w-full py-2.5 px-4 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
              >
                Populate Mock Data
              </button>
            ) : (
              <button 
                onClick={handleLogin}
                className="w-full py-2.5 px-4 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Sign In to Manage Data
              </button>
            )}
            <p className="text-[10px] text-slate-400 mt-3 text-center">
              {user ? 'Click to add sample records to your Firestore database.' : 'Authentication is required to modify the database.'}
            </p>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <h3 className="text-slate-900 font-semibold mb-4">Location Status</h3>
            {userLocation ? (
              <div className="flex items-center gap-3 text-green-600">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium">Location Active</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-amber-600">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-sm font-medium">Waiting for location...</span>
              </div>
            )}
            <p className="text-xs text-slate-500 mt-3">
              Lat: {userLocation?.[0].toFixed(4) || '---'} <br />
              Lng: {userLocation?.[1].toFixed(4) || '---'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

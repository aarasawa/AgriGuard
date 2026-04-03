import React, { useEffect, useState } from 'react';
import { Map } from '../components/Map';
import { pesticideService } from '../services/pesticideService';
import { PesticideApplication } from '../types';
import { MapPin, Navigation, Info, Database, LogIn, Search as SearchIcon, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

export const Home: React.FC = () => {
  const [applications, setApplications] = useState<PesticideApplication[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [radius, setRadius] = useState(5000); // 5km default
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [address, setAddress] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);

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

  const handleAddressSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;

    setIsGeocoding(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setUserLocation([parseFloat(lat), parseFloat(lon)]);
      } else {
        alert("Address not found. Please try a more specific address.");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      alert("Error searching for address. Please try again.");
    } finally {
      setIsGeocoding(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight">AgriGuard Map</h1>
          <p className="opacity-70">Visualize historical pesticide applications in your area.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <form onSubmit={handleAddressSearch} className="relative w-full sm:w-80">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Search by address..."
              className="w-full pl-10 pr-12 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            />
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
            <button
              type="submit"
              disabled={isGeocoding}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              {isGeocoding ? <Loader2 className="w-4 h-4 animate-spin" /> : <SearchIcon className="w-4 h-4" />}
            </button>
          </form>

          <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-lg border border-primary/10">
              <Navigation className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium whitespace-nowrap">Radius: {radius / 1000}km</span>
            </div>
            <input 
              type="range" 
              min="1000" 
              max="50000" 
              step="1000" 
              value={radius} 
              onChange={(e) => setRadius(parseInt(e.target.value))}
              className="w-24 sm:w-32 accent-primary"
            />
          </div>
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
          <div className="bg-primary/5 dark:bg-primary/10 p-6 rounded-2xl border border-primary/10 dark:border-primary/20">
            <h3 className="text-primary font-semibold flex items-center gap-2 mb-3">
              <Info className="w-5 h-5" />
              How it works
            </h3>
            <p className="text-sm text-primary-dark dark:text-primary-light leading-relaxed">
              This map displays Pesticide Use Report (PUR) data. Markers represent specific application sites. 
              The green circle shows your current search radius.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 opacity-40" />
              Data Controls
            </h3>
            {user ? (
              <button 
                onClick={handleAddMockData}
                className="w-full py-2.5 px-4 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors flex items-center justify-center gap-2"
              >
                Populate Mock Data
              </button>
            ) : (
              <button 
                onClick={handleLogin}
                className="w-full py-2.5 px-4 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Sign In to Manage Data
              </button>
            )}
            <p className="text-[10px] opacity-50 mt-3 text-center">
              {user ? 'Click to add sample records to your Firestore database.' : 'Authentication is required to modify the database.'}
            </p>
          </div>

          <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
            <h3 className="font-semibold mb-4">Location Status</h3>
            {userLocation ? (
              <div className="flex items-center gap-3 text-primary">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-medium">Location Active</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-amber-600">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-sm font-medium">Waiting for location...</span>
              </div>
            )}
            <p className="text-xs opacity-60 mt-3 font-mono">
              Lat: {userLocation?.[0].toFixed(4) || '---'} <br />
              Lng: {userLocation?.[1].toFixed(4) || '---'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

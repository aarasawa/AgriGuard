import React, { useEffect, useState, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home } from './pages/Home';
import { Search } from './pages/Search';
import { Todos } from './pages/Todos';
import { Map as MapIcon, Database, Leaf, Menu, X, LogIn, LogOut, User, Sun, Moon, ListTodo } from 'lucide-react';
import { cn } from './lib/utils';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';
import Cookies from 'js-cookie';

const ThemeContext = createContext<{ darkMode: boolean; toggleDarkMode: () => void }>({
  darkMode: false,
  toggleDarkMode: () => {},
});

const Navigation = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navItems = [
    { path: '/', label: 'Map View', icon: MapIcon },
    { path: '/search', label: 'Database Search', icon: Database },
    { path: '/todos', label: 'Supabase Todos', icon: ListTodo },
  ];

  return (
    <nav className="bg-white dark:bg-dark-grey border-b border-slate-200 dark:border-slate-800 sticky top-0 z-[1000]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">AgriGuard</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                  location.pathname === item.path
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-foreground/70 hover:bg-primary/5 hover:text-foreground"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
            
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-2" />
            
            <button
              onClick={toggleDarkMode}
              className="p-2 text-foreground/70 hover:bg-primary/5 rounded-lg transition-all"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-2" />

            {user ? (
              <div className="flex items-center gap-3 pl-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-lg border border-primary/10">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || ''} className="w-5 h-5 rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    <User className="w-4 h-4 text-slate-400" />
                  )}
                  <span className="text-xs font-medium max-w-[100px] truncate">
                    {user.displayName || user.email}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="ml-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-all flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-dark-grey border-t border-slate-100 dark:border-slate-800 px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={cn(
                "block px-4 py-3 rounded-xl text-base font-medium flex items-center gap-3",
                location.pathname === item.path
                  ? "bg-primary/10 text-primary"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            {user ? (
              <button
                onClick={() => { handleLogout(); setIsOpen(false); }}
                className="w-full px-4 py-3 rounded-xl text-base font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            ) : (
              <button
                onClick={() => { handleLogin(); setIsOpen(false); }}
                className="w-full px-4 py-3 rounded-xl text-base font-medium text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3"
              >
                <LogIn className="w-5 h-5" />
                Sign In with Google
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = Cookies.get('theme');
    return saved === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      Cookies.set('theme', 'dark', { expires: 365 });
    } else {
      document.documentElement.classList.remove('dark');
      Cookies.set('theme', 'light', { expires: 365 });
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <Router>
        <div className="min-h-screen bg-cream dark:bg-dark-grey font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
          <Navigation />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/todos" element={<Todos />} />
            </Routes>
          </main>
          
          <footer className="bg-white dark:bg-dark-grey border-t border-slate-200 dark:border-slate-800 py-12 mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-primary" />
                  <span className="text-lg font-bold">AgriGuard</span>
                </div>
                <p className="text-sm opacity-60">
                  &copy; 2024 AgriGuard PUR Data Explorer. All rights reserved.
                </p>
                <div className="flex items-center gap-6 text-sm font-medium opacity-70">
                  <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                  <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
                  <a href="#" className="hover:text-primary transition-colors">Contact Support</a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </ThemeContext.Provider>
  );
}

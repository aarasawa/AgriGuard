import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home } from './pages/Home';
import { Search } from './pages/Search';
import { Map as MapIcon, Database, Leaf, Menu, X, Sun, Moon } from 'lucide-react';
import { cn } from './lib/utils';
import { ThemeProvider, useTheme } from './context/ThemeContext';

const Navigation = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { darkMode, toggleDarkMode } = useTheme();

  const navItems = [
    { path: '/', label: 'Map View', icon: MapIcon },
    { path: '/search', label: 'Database Search', icon: Database },
  ];

  return (
    <nav className="bg-surface border-b border-app sticky top-0 z-[1000]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Leaf className="w-6 h-6" style={{ color: 'var(--bg)' }} />
            </div>
            <span className="text-xl font-bold tracking-tight text-fg">AgriGuard</span>
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
                    ? "bg-primary text-fg font-semibold"
                    : "text-muted hover:text-fg hover:bg-surface"
                )}
                style={location.pathname === item.path
                  ? { backgroundColor: 'var(--accent-primary)', color: 'var(--bg)' }
                  : {}
                }
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}

            <div className="h-6 w-px border-app mx-2" style={{ backgroundColor: 'var(--border)' }} />

            <button
              onClick={toggleDarkMode}
              className="p-2 text-muted hover:text-fg hover:bg-surface rounded-lg transition-all"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 text-muted hover:bg-surface rounded-lg transition-all"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-muted hover:bg-surface"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden bg-surface border-t border-app px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={cn(
                "block px-4 py-3 rounded-xl text-base font-medium flex items-center gap-3",
                location.pathname === item.path
                  ? "text-fg font-semibold"
                  : "text-muted hover:text-fg hover:bg-app"
              )}
              style={location.pathname === item.path
                ? { backgroundColor: 'var(--accent-primary)', color: 'var(--bg)' }
                : {}
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-app text-fg font-sans transition-colors duration-300">
          <Navigation />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
            </Routes>
          </main>

          <footer className="bg-surface border-t border-app py-12 mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-primary" />
                  <span className="text-lg font-bold text-fg">AgriGuard</span>
                </div>
                <p className="text-sm text-muted">
                  &copy; 2026 AgriGuard. All rights reserved.
                </p>
                <div className="flex items-center gap-6 text-sm font-medium text-muted">
                  <a href="#" className="hover:text-fg transition-colors">Privacy Policy</a>
                  <a href="#" className="hover:text-fg transition-colors">Terms of Service</a>
                  <a href="#" className="hover:text-fg transition-colors">Contact Support</a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </ThemeProvider>
  );
}
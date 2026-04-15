import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { X, Calendar, MapPin, Droplets, Info, ExternalLink, FlaskConical } from 'lucide-react';
import type { PesticideFeature } from '../services/pesticideService';
import { COUNTY_NAMES } from '../constants';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ChemInfo {
  cid: number;
  pubchem_url: string;
  signal_word: string | null;
  pictograms: string[];
  hazard_statements: string[];
  symptoms: string | null;
  exposure_routes: string | null;
  target_organs: string | null;
  short_term_effects: string | null;
  long_term_effects: string | null;
  first_aid: Record<string, string>;
}

interface PesticideDetailsPanelProps {
  selectedFeature: PesticideFeature | null;
  onClose: () => void;
}

export const PesticideDetailsPanel: React.FC<PesticideDetailsPanelProps> = ({
  selectedFeature,
  onClose,
}) => {
  const [chemInfo, setChemInfo] = useState<ChemInfo | null>(null);
  const [chemLoading, setChemLoading] = useState(false);

  useEffect(() => {
    const cas = selectedFeature?.properties.cas_number;
    if (!cas) {
      setChemInfo(null);
      return;
    }

    setChemLoading(true);
    setChemInfo(null);

    fetch(`${API_BASE_URL}/chemical-info?cas_number=${encodeURIComponent(cas)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setChemInfo(data);
        setChemLoading(false);
      })
      .catch(() => setChemLoading(false));
  }, [selectedFeature?.properties.cas_number]);

  if (!selectedFeature) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.2 }}
      className="h-[600px] flex flex-col rounded-2xl border shadow-sm overflow-hidden"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      <div
        className="p-4 flex items-center justify-between shrink-0"
        style={{
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'color-mix(in srgb, var(--accent-primary) 6%, var(--surface))',
        }}
      >
        <h3 className="font-bold flex items-center gap-2" style={{ color: 'var(--fg)' }}>
          <Info className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          Application Details
        </h3>

        <button
          onClick={onClose}
          className="p-1 rounded-full transition-colors"
          style={{ color: 'var(--muted)' }}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 space-y-5">
        <div className="space-y-1">
          <span
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: 'var(--accent-primary)' }}
          >
            Product
          </span>

          <h2 className="text-lg font-bold leading-tight" style={{ color: 'var(--fg)' }}>
            {selectedFeature.properties.product_name || `Product ${selectedFeature.properties.prodno}`}
          </h2>

          {selectedFeature.properties.chemname && (
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Active ingredient: {selectedFeature.properties.chemname}
            </p>
          )}

          <p className="text-[10px] font-mono" style={{ color: 'var(--muted)' }}>
            Section {selectedFeature.properties.comtrs}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-start gap-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'var(--bg)' }}
            >
              <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase" style={{ color: 'var(--muted)' }}>
                Date Applied
              </p>
              <p className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>
                {selectedFeature.properties.applic_dt}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'var(--bg)' }}
            >
              <Droplets className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase" style={{ color: 'var(--muted)' }}>
                Amount Applied
              </p>
              <p className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>
                {selectedFeature.properties.lbs_prd_used} lbs
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'var(--bg)' }}
            >
              <MapPin className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase" style={{ color: 'var(--muted)' }}>
                Location
              </p>
              <p className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>
                {COUNTY_NAMES[selectedFeature.properties.county_cd] ||
                  `County ${selectedFeature.properties.county_cd}`}
              </p>
              <p className="text-[10px]" style={{ color: 'var(--muted)' }}>
                {selectedFeature.properties.distance_km}km away
              </p>
            </div>
          </div>
        </div>

        {chemLoading && (
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
            <div
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            />
            Loading health data...
          </div>
        )}

        {chemInfo && (
          <div
            className="rounded-xl p-4 space-y-4"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-cta) 6%, var(--surface))',
              border: '1px solid color-mix(in srgb, var(--accent-cta) 15%, transparent)',
            }}
          >
            <div className="flex items-center justify-between">
              <p
                className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5"
                style={{ color: 'var(--accent-primary)' }}
              >
                <FlaskConical className="w-3.5 h-3.5" />
                Health & Safety
              </p>

              {chemInfo.signal_word && (
                <span
                  className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
                  style={{
                    backgroundColor:
                      chemInfo.signal_word === 'Danger'
                        ? 'rgba(220,38,38,0.12)'
                        : 'rgba(234,179,8,0.12)',
                    color: chemInfo.signal_word === 'Danger' ? '#dc2626' : '#ca8a04',
                  }}
                >
                    {chemInfo.signal_word}
                </span>
              )}
            </div>

            {chemInfo.symptoms && (
              <div>
                <p className="text-[10px] font-bold uppercase mb-1" style={{ color: 'var(--muted)' }}>
                  Symptoms
                </p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--fg)' }}>
                  {chemInfo.symptoms}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          {chemInfo && (
            <a
              href={chemInfo.pubchem_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-cta w-full py-2.5 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Safety Info: PubChem
            </a>
          )}

          <a
            href={`https://search.epa.gov/epasearch/?querytext=${encodeURIComponent(
              selectedFeature.properties.product_name || ''
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-cta w-full py-2.5 flex items-center justify-center gap-2 rounded-xl shadow-sm text-sm font-semibold"
          >
            <ExternalLink className="w-4 h-4" />
            Search EPA Site
          </a>
        </div>
      </div>
    </motion.div>
  );
};
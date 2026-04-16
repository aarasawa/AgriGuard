import React from 'react';
import { Info } from 'lucide-react';

export const HowItWorksCard: React.FC = () => (
  <div
    className="p-6 rounded-2xl border"
    style={{
      backgroundColor: 'color-mix(in srgb, var(--accent-primary) 8%, var(--surface))',
      borderColor: 'color-mix(in srgb, var(--accent-primary) 20%, transparent)'
    }}
  >
    <h3 className="text-primary font-semibold flex items-center gap-2 mb-3">
      <Info className="w-5 h-5" />
      How it works
    </h3>
    <p className="text-sm text-muted leading-relaxed">
      This map displays Pesticide Use Report (PUR) data from the California
      Department of Pesticide Regulation. Markers represent pesticide
      application sites at the centroid of the reported area. Click on a marker to see details about the application. 
    </p>
  </div>
);
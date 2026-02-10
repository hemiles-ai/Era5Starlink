
import React from 'react';
import { AppStatus } from '../types';

interface HUDOverlayProps {
  status: AppStatus;
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  isAnalyzing: boolean;
}

const HUDOverlay: React.FC<HUDOverlayProps> = ({ status, onClick, isAnalyzing }) => {
  return (
    <div 
      className="absolute inset-0 z-10 cursor-crosshair overflow-hidden pointer-events-auto"
      onClick={onClick}
    >
      {/* Corner Brackets */}
      <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-white/30"></div>
      <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-white/30"></div>
      <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-white/30"></div>
      <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-white/30"></div>

      {/* Scanning Line */}
      {status === AppStatus.SCANNING && (
        <div className="w-full h-[1px] bg-white/40 absolute top-0 left-0 z-20 animation-scan opacity-50" 
             style={{ animation: 'scan 4s linear infinite' }} />
      )}

      {/* Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="w-10 h-10 border border-white/10 rounded-full flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="absolute top-10 left-10 flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isAnalyzing ? 'bg-white animate-pulse' : 'bg-white/40'}`}></div>
          <span className="text-[10px] font-bold tracking-widest text-white uppercase mono">
            {isAnalyzing ? 'IDENTIFYING...' : 'SYSTEM READY'}
          </span>
        </div>
      </div>

      {/* Interaction Prompt */}
      {status === AppStatus.SCANNING && !isAnalyzing && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-center pointer-events-none">
          <div className="bg-black/80 backdrop-blur-sm px-6 py-3 border border-white/10 rounded-full">
            <p className="text-xs font-bold text-white tracking-widest uppercase mono">Click pin to analyze</p>
          </div>
        </div>
      )}

      {/* Analyzing Spinner */}
      {isAnalyzing && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none">
          <div className="w-16 h-16 relative">
            <div className="absolute inset-0 border-2 border-white/10 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-t-white rounded-full animate-spin"></div>
          </div>
          <p className="mt-6 text-white font-bold tracking-[0.3em] uppercase mono text-[10px]">Processing Vision</p>
        </div>
      )}
    </div>
  );
};

export default HUDOverlay;

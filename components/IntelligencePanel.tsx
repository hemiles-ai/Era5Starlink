
import React, { useState } from 'react';
import { RecognitionResult } from '../types';

interface IntelligencePanelProps {
  result: RecognitionResult;
  aiImage: string | null;
  onClose: () => void;
  isGeneratingImage: boolean;
}

const IntelligencePanel: React.FC<IntelligencePanelProps> = ({ result, aiImage, onClose, isGeneratingImage }) => {
  const [showWeather, setShowWeather] = useState(false);
  
  // Priority: Reference Image > AI Generated Image
  const displayImage = result.referenceImage || aiImage;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 md:p-8">
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-5xl bg-[#080808] border border-white/10 rounded-lg shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        {/* Visual Display */}
        <div className="w-full md:w-1/2 bg-black flex items-center justify-center relative min-h-[350px]">
          {isGeneratingImage ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border border-white/20 border-t-white rounded-full animate-spin"></div>
              <p className="text-[10px] text-white/40 mono uppercase tracking-widest">Processing Visual Feed...</p>
            </div>
          ) : displayImage ? (
            <img 
              src={displayImage} 
              alt={result.name} 
              className="w-full h-full object-cover grayscale brightness-90 contrast-125 transition-all duration-1000"
              onError={(e) => {
                // Handle rare case where URL might fail
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border border-white/5 flex items-center justify-center">
                <div className="w-1 h-1 bg-white/20 rounded-full animate-ping"></div>
              </div>
              <p className="text-white/10 mono text-[10px] uppercase tracking-widest">Sensor Calibration Pending</p>
            </div>
          )}
          
          <div className="absolute top-4 left-4 border border-white/20 px-2 py-1 rounded text-[8px] font-bold uppercase tracking-widest mono text-white/60 bg-black/50 backdrop-blur-md">
            VISUAL_STREAM_{result.name.substring(0, 3).toUpperCase()}
          </div>
        </div>

        {/* Data Panel */}
        <div className="w-full md:w-1/2 p-10 flex flex-col gap-8 overflow-y-auto border-l border-white/5 bg-[#080808]">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-white/30 text-[10px] font-bold uppercase tracking-[0.3em] mono block">
                {result.category}
              </span>
              <h2 className="text-4xl font-bold tracking-tighter text-white uppercase">{result.name}</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white/30 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-8">
            <section>
              <h3 className="text-white/20 text-[10px] font-bold uppercase tracking-[0.3em] mono mb-4 border-b border-white/5 pb-2">Location</h3>
              <p className="text-white text-xl font-medium">
                {result.description}
              </p>
            </section>

            <section className="bg-white/[0.02] border border-white/5 p-6 rounded-sm">
              <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em] mono mb-4">Facility Intelligence</h3>
              <p className="text-white/70 leading-relaxed text-sm whitespace-pre-line mono italic">
                {result.funFact}
              </p>
            </section>

            {result.weatherFacts && (
              <section className="space-y-4">
                <button 
                  onClick={() => setShowWeather(!showWeather)}
                  className="w-full py-3 border border-white/10 text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mono hover:bg-white hover:text-black transition-all flex justify-between px-4 items-center"
                >
                  <span>{showWeather ? 'Hide Historical Data' : 'Historical Weather Events'}</span>
                  <span>{showWeather ? '-' : '+'}</span>
                </button>
                
                {showWeather && (
                  <div className="bg-white/[0.01] border border-white/5 p-6 rounded-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-white/60 leading-relaxed text-xs whitespace-pre-line mono">
                      {result.weatherFacts}
                    </p>
                  </div>
                )}
              </section>
            )}
          </div>

          <button 
            onClick={onClose}
            className="mt-auto w-full py-4 bg-white text-black font-bold rounded-sm hover:bg-neutral-200 transition-all uppercase tracking-widest text-xs mono"
          >
            Clear Terminal
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntelligencePanel;

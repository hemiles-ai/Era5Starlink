
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AppStatus, RecognitionResult } from './types';
import { recognizeObject, generateAIVisual, speakMessage } from './services/geminiService';
import HUDOverlay from './components/HUDOverlay';
import IntelligencePanel from './components/IntelligencePanel';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.INITIAL);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [selectedObject, setSelectedObject] = useState<RecognitionResult | null>(null);
  const [aiImage, setAiImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      // Basic browser check for GitHub Pages / non-secure origins
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMessage("Camera API not found. This usually happens if you are not using HTTPS.");
        setStatus(AppStatus.ERROR);
        return;
      }

      setStatus(AppStatus.CAMERA_REQUEST);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStatus(AppStatus.SCANNING);
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      setErrorMessage(`System access denied: ${err.message || 'Unknown Error'}. Enable camera sensors.`);
      setStatus(AppStatus.ERROR);
    }
  };

  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
  }, []);

  const handleScanClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (isAnalyzing || status !== AppStatus.SCANNING) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const base64Image = captureFrame();
    if (!base64Image) return;

    setIsAnalyzing(true);
    setAiImage(null);

    const result = await recognizeObject(base64Image, x, y);
    
    if (result) {
      setSelectedObject(result);
      setStatus(AppStatus.VIEWING_RESULT);
      setIsAnalyzing(false);
      
      // Handle speech triggers
      if (result.name === 'White House') {
        const speechContent = `White House. Washington D.C. ${result.funFact}`;
        speakMessage(speechContent);
      } else if (result.name === 'IAD13 Data Center') {
        const speechContent = `IAD13 Data Center. Ashburn Virginia. Identified as a Microsoft Azure facility.`;
        speakMessage(speechContent);
      }

      // If there is no static reference image, or as a high-quality fallback, generate one
      if (!result.referenceImage || result.name === 'IAD13 Data Center') {
        setIsGeneratingImage(true);
        const imageUrl = await generateAIVisual(result.visualPrompt);
        setAiImage(imageUrl);
        setIsGeneratingImage(false);
      }
    } else {
      setIsAnalyzing(false);
    }
  };

  const closePanel = () => {
    setSelectedObject(null);
    setAiImage(null);
    setStatus(AppStatus.SCANNING);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex flex-col grayscale-custom">
      <canvas ref={canvasRef} className="hidden" />

      <div className="relative flex-1 bg-neutral-900 overflow-hidden">
        {status === AppStatus.INITIAL ? (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-8 text-center bg-[#050505]">
            <div className="mb-12 w-20 h-20 border border-white/20 rounded-full flex items-center justify-center animate-pulse">
              <div className="w-1 h-1 bg-white rounded-full"></div>
            </div>
            <h1 className="text-3xl font-bold tracking-[0.5em] mb-4 text-white uppercase mono">Vision_AR</h1>
            <p className="text-white/30 max-w-sm text-xs leading-loose mb-12 uppercase tracking-widest mono">
              Monochrome Intelligence Interface // Object Recognition v.1.4
            </p>
            <button 
              onClick={startCamera}
              className="px-12 py-4 border border-white/20 text-white text-xs font-bold rounded-sm hover:bg-white hover:text-black transition-all uppercase tracking-[0.3em] mono"
            >
              Boot System
            </button>
          </div>
        ) : (
          <video 
            ref={videoRef}
            autoPlay 
            playsInline 
            muted
            className="absolute inset-0 w-full h-full object-cover grayscale brightness-75"
          />
        )}

        {(status === AppStatus.SCANNING || status === AppStatus.VIEWING_RESULT) && (
          <HUDOverlay 
            status={status} 
            onClick={handleScanClick} 
            isAnalyzing={isAnalyzing} 
          />
        )}

        {status === AppStatus.VIEWING_RESULT && selectedObject && (
          <IntelligencePanel 
            result={selectedObject}
            aiImage={aiImage}
            onClose={closePanel}
            isGeneratingImage={isGeneratingImage}
          />
        )}

        {status === AppStatus.ERROR && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-8 bg-black text-center">
            <h2 className="text-xl font-bold text-white mb-4 mono tracking-widest uppercase">Hardware Error</h2>
            <p className="text-white/30 mb-12 mono text-xs uppercase tracking-widest">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 border border-white/20 text-white font-bold mono uppercase text-xs tracking-widest"
            >
              Reset Terminal
            </button>
          </div>
        )}
      </div>

      <footer className="h-12 bg-black border-t border-white/5 flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-3">
          <div className="w-1 h-1 bg-white/40"></div>
          <span className="text-[8px] font-bold uppercase tracking-[0.4em] text-white/30 mono">Sensors Active // Monitoring Network Nodes</span>
        </div>
      </footer>
    </div>
  );
};

export default App;

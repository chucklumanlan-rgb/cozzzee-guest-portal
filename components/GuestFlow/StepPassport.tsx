import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { UploadCloud, ScanFace, Wand2, RotateCcw, X, AlertTriangle, Camera } from 'lucide-react';
import { GuestDetails } from '../../types';
import { functions } from '../../lib/firebase';
import { httpsCallable } from 'firebase/functions';

interface Props {
  onComplete: (extractedData?: Partial<GuestDetails>, passportUrl?: string) => Promise<void>;
}

export const StepPassport: React.FC<Props> = ({ onComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<Partial<GuestDetails> | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setIsCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 100);
    } catch (err) {
      setCameraError("Could not access camera. Please allow permissions or use file upload.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const capturedFile = new File([blob], "passport_capture.jpg", { type: "image/jpeg" });
          setFile(capturedFile);
          setPreview(URL.createObjectURL(capturedFile));
          setScannedData(null);
          setScanError(null);
          stopCamera();
        }
      }, 'image/jpeg', 0.95);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setScannedData(null);
      setScanError(null);
    }
  };

  const resetSelection = () => {
      setFile(null);
      setPreview(null);
      setScannedData(null);
      setScanError(null);
      stopCamera();
  };

  const handleScanPassport = async () => {
    if (!file) return;
    setIsScanning(true);
    setScanError(null);

    try {
      // 1. Convert file to Base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
           const result = reader.result as string;
           const base64 = result.split(',')[1]; 
           resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // 2. Call Secure Cloud Function
      const analyzeFn = httpsCallable(functions, 'analyzePassport');
      const result = await analyzeFn({ imageBase64: base64Data });
      
      const data = result.data as Partial<GuestDetails>;
      setScannedData(data);

    } catch (error) {
      console.error("OCR Failed", error);
      setScanError("Could not extract details automatically. Please enter manually.");
      setScannedData({ firstName: '', lastName: '', passportNumber: '', nationality: '', dateOfBirth: '' });
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      const mockPassportUrl = URL.createObjectURL(file);
      await onComplete(scannedData || undefined, mockPassportUrl);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
       <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Upload ID / Passport</h2>
        <p className="text-slate-600 text-sm mb-6">
          We use secure AI to automatically scan your passport details for quick verification.
        </p>

        {isCameraOpen ? (
          <div className="space-y-4">
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"/>
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="flex gap-3">
              <Button onClick={stopCamera} variant="subtle" className="flex-1">Cancel</Button>
              <Button onClick={capturePhoto} className="flex-1 bg-white text-blue-600 border border-blue-200">Capture</Button>
            </div>
          </div>
        ) : !preview ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 relative cursor-pointer group">
                <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"/>
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-6 h-6" />
                </div>
                <h3 className="font-medium text-slate-900">Upload File</h3>
                <p className="text-xs text-slate-500 mt-1">JPG or PNG, max 5MB</p>
              </div>
              <Button onClick={startCamera} variant="outline" className="w-full"><Camera className="w-4 h-4 mr-2" /> Take Photo</Button>
              {cameraError && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{cameraError}</div>}
            </div>
        ) : (
            <div className="space-y-4">
                <div className="relative w-full aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                    <img src={preview} alt="Passport" className="w-full h-full object-cover" />
                    <button onClick={resetSelection} className="absolute top-2 right-2 bg-white/90 p-2 rounded-full shadow-sm hover:text-red-600"><X className="w-4 h-4" /></button>
                </div>
                {!scannedData && (
                     <Button onClick={handleScanPassport} variant="subtle" className="w-full" isLoading={isScanning}>
                        <Wand2 className="w-4 h-4 mr-2" /> {isScanning ? 'Extracting...' : 'Scan with AI'}
                     </Button>
                )}
                {scanError && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{scanError}</div>}
            </div>
        )}
        
        {scannedData && (
            <div className="mt-6 pt-6 border-t border-slate-100 animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                    <div className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg ${scanError ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-600'}`}>
                        <ScanFace className="w-4 h-4" />
                        <span>{scanError ? 'Manual Entry' : 'Details extracted'}</span>
                    </div>
                </div>
                <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-medium text-slate-500 uppercase">First Name</label><input type="text" value={scannedData.firstName||''} onChange={e=>setScannedData({...scannedData,firstName:e.target.value})} className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"/></div>
                        <div><label className="text-xs font-medium text-slate-500 uppercase">Last Name</label><input type="text" value={scannedData.lastName||''} onChange={e=>setScannedData({...scannedData,lastName:e.target.value})} className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"/></div>
                    </div>
                    <div><label className="text-xs font-medium text-slate-500 uppercase">Passport Number</label><input type="text" value={scannedData.passportNumber||''} onChange={e=>setScannedData({...scannedData,passportNumber:e.target.value})} className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono"/></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-medium text-slate-500 uppercase">Nationality</label><input type="text" value={scannedData.nationality||''} onChange={e=>setScannedData({...scannedData,nationality:e.target.value})} className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"/></div>
                        <div><label className="text-xs font-medium text-slate-500 uppercase">Date of Birth</label><input type="date" value={scannedData.dateOfBirth||''} onChange={e=>setScannedData({...scannedData,dateOfBirth:e.target.value})} className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"/></div>
                    </div>
                </div>
            </div>
        )}
      </div>
      <Button onClick={handleSubmit} className="w-full" disabled={!file} isLoading={isLoading}>
        {scannedData ? 'Confirm & Upload' : 'Upload without Scanning'}
      </Button>
    </div>
  );
};
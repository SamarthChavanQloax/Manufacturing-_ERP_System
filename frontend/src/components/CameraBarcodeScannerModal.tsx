import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  X,
  Volume2,
  VolumeX,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Layers,
  Zap,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';

interface BarcodeScanItem {
  id: string;
  barcode: string;
  type: string;
  status: 'VALID' | 'ALREADY_PROCESSED' | 'NOT_FOUND' | 'DUPLICATE' | 'UNAUTHORIZED' | 'INVALID_FORMAT';
  message: string;
  timestamp: string;
}

interface CameraBarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBarcodeDetected?: (barcode: string) => void;
  onBulkBarcodesConfirmed?: (barcodes: string[]) => void;
  preferredType?: 'auto' | 'invoice' | 'box' | 'packing';
  title?: string;
  initialMode?: 'single' | 'bulk';
}

export const CameraBarcodeScannerModal: React.FC<CameraBarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onBarcodeDetected,
  onBulkBarcodesConfirmed,
  preferredType = 'auto',
  title = 'Computer Vision Barcode Scanner',
  initialMode = 'single',
}) => {
  const [scanMode, setScanMode] = useState<'single' | 'bulk'>(initialMode);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<BarcodeScanItem[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [manualInput, setManualInput] = useState('');

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const recentDetectionsRef = useRef<Map<string, number>>(new Map());
  const scannerContainerId = 'interactive-camera-viewport';

  // Web Audio Synth Beeper
  const playBeep = (type: 'success' | 'warn' | 'error') => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // High A
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } else if (type === 'warn') {
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      } else {
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      }
    } catch {
      // Fallback if audio context is blocked
    }
  };

  // Validate scanned barcode against ERP backend
  const processBarcodeValue = async (rawCode: string) => {
    const code = String(rawCode || '').trim();
    if (!code) return;

    // Check duplicate buffer (2.5 second cooldown per unique barcode)
    const now = Date.now();
    const lastSeen = recentDetectionsRef.current.get(code) || 0;
    if (now - lastSeen < 2500) {
      return; // Ignore repeated frame detection while pointing at the same barcode
    }
    recentDetectionsRef.current.set(code, now);

    // Check if already in scan history (for bulk mode duplicate detection)
    const isSessionDuplicate = scanHistory.some((item) => item.barcode === code);
    if (isSessionDuplicate && scanMode === 'bulk') {
      playBeep('warn');
      const dupItem: BarcodeScanItem = {
        id: `dup-${now}`,
        barcode: code,
        type: 'DUPLICATE',
        status: 'DUPLICATE',
        message: `Duplicate: "${code}" has already been scanned in this session.`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setScanHistory((prev) => [dupItem, ...prev]);
      setLastScanned(code);
      return;
    }

    setIsValidating(true);
    setLastScanned(code);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        '/api/barcode/validate',
        { barcode: code, scan_type: preferredType },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = response.data;
      const status: BarcodeScanItem['status'] = data.validation_status || (data.is_valid ? 'VALID' : 'NOT_FOUND');

      if (status === 'VALID') {
        playBeep('success');
      } else if (status === 'ALREADY_PROCESSED') {
        playBeep('warn');
      } else {
        playBeep('error');
      }

      const item: BarcodeScanItem = {
        id: `${code}-${now}`,
        barcode: code,
        type: data.type || 'UNKNOWN',
        status: status,
        message: data.message,
        timestamp: new Date().toLocaleTimeString(),
      };

      setScanHistory((prev) => [item, ...prev]);

      if (scanMode === 'single' && (status === 'VALID' || status === 'ALREADY_PROCESSED')) {
        if (onBarcodeDetected) {
          onBarcodeDetected(code);
          stopCamera();
          onClose();
        }
      }
    } catch (err: any) {
      playBeep('error');
      const item: BarcodeScanItem = {
        id: `err-${now}`,
        barcode: code,
        type: 'UNKNOWN',
        status: 'NOT_FOUND',
        message: err.response?.data?.message || 'Barcode validation request failed.',
        timestamp: new Date().toLocaleTimeString(),
      };
      setScanHistory((prev) => [item, ...prev]);
    } finally {
      setIsValidating(false);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId);
      }

      const config = {
        fps: 12,
        qrbox: { width: 300, height: 160 },
        aspectRatio: 1.6,
      };

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          processBarcodeValue(decodedText);
        },
        () => {
          // Frame decode pass (silent)
        }
      );

      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera initialization error:', err);
      setCameraActive(false);
      const msg =
        err?.message ||
        'Camera permission was not granted or no video capture device was detected on your station.';
      setCameraError(msg);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && cameraActive) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (isOpen) {
      // Start camera automatically on open
      const timer = setTimeout(() => {
        startCamera();
      }, 200);
      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
      setScanHistory([]);
      setLastScanned(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Stats calculation
  const totalScanned = scanHistory.length;
  const validCount = scanHistory.filter((i) => i.status === 'VALID').length;
  const duplicateCount = scanHistory.filter((i) => i.status === 'DUPLICATE').length;
  const invalidCount = scanHistory.filter((i) => i.status === 'NOT_FOUND' || i.status === 'INVALID_FORMAT').length;

  const handleConfirmBulk = () => {
    const validBarcodes = scanHistory
      .filter((i) => i.status === 'VALID' || i.status === 'ALREADY_PROCESSED')
      .map((i) => i.barcode);

    if (onBulkBarcodesConfirmed) {
      onBulkBarcodesConfirmed(validBarcodes);
    } else if (onBarcodeDetected && validBarcodes.length > 0) {
      onBarcodeDetected(validBarcodes[0]);
    }
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {title}
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 font-semibold uppercase">
                  {preferredType}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Point camera at barcode or 1D/2D label to decode and validate with ERP
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute Scan Sound' : 'Enable Scan Sound'}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-red-500" />}
            </button>
            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/30 px-6 py-2.5 items-center justify-between">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 dark:bg-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setScanMode('single')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                scanMode === 'single'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Single Scan Mode
            </button>
            <button
              type="button"
              onClick={() => setScanMode('bulk')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
                scanMode === 'bulk'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Bulk Scanning Session
            </button>
          </div>

          {scanMode === 'bulk' && (
            <div className="flex items-center gap-3 text-xs font-medium">
              <span className="text-slate-500">Total: <strong className="text-slate-800 dark:text-slate-200">{totalScanned}</strong></span>
              <span className="text-emerald-600 font-semibold">Valid: {validCount}</span>
              <span className="text-amber-500 font-semibold">Dup: {duplicateCount}</span>
              {invalidCount > 0 && <span className="text-red-500 font-semibold">Inv: {invalidCount}</span>}
            </div>
          )}
        </div>

        {/* Viewport Area */}
        <div className="relative bg-slate-950 flex flex-col items-center justify-center min-h-[260px] max-h-[340px] overflow-hidden">
          {/* HTML5 QR/Barcode Video Container */}
          <div
            id={scannerContainerId}
            className="w-full h-full flex items-center justify-center [&_video]:max-h-[320px] [&_video]:w-full [&_video]:object-cover"
          />

          {/* Animated Laser Reticle Overlay */}
          {cameraActive && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-72 h-36 border-2 border-dashed border-blue-400/80 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.3)] flex items-center justify-center">
                {/* Scanning Laser Beam */}
                <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_#ef4444] animate-pulse" />
                <span className="absolute -bottom-6 text-[11px] font-mono tracking-wider text-blue-300/90 uppercase bg-slate-900/80 px-2 py-0.5 rounded">
                  Align Barcode Inside Frame
                </span>
              </div>
            </div>
          )}

          {/* Camera Permission / Device Fallback State */}
          {cameraError && (
            <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center bg-slate-900/95 text-white">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-white mb-1">Camera Device Not Available</h4>
              <p className="text-xs text-slate-400 max-w-sm mb-4">{cameraError}</p>
              <div className="flex gap-2">
                <button
                  onClick={startCamera}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry Camera
                </button>
              </div>
            </div>
          )}

          {/* Validating Spinner Overlay */}
          {isValidating && (
            <div className="absolute top-3 right-3 bg-slate-900/90 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-slate-700 shadow-md">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
              Verifying with ERP...
            </div>
          )}
        </div>

        {/* Manual Barcode Fallback Bar */}
        <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && manualInput.trim()) {
                processBarcodeValue(manualInput.trim());
                setManualInput('');
              }
            }}
            placeholder="Or type/paste barcode manually and press Enter..."
            className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            disabled={!manualInput.trim() || isValidating}
            onClick={() => {
              if (manualInput.trim()) {
                processBarcodeValue(manualInput.trim());
                setManualInput('');
              }
            }}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg transition disabled:opacity-50"
          >
            Check
          </button>
        </div>

        {/* Scan Log & Session Results */}
        <div className="flex-1 overflow-y-auto p-4 max-h-[220px] divide-y divide-slate-100 dark:divide-slate-800/60">
          {scanHistory.length === 0 ? (
            <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
              No barcodes scanned yet in this session. Present a barcode to the camera to begin.
            </div>
          ) : (
            scanHistory.map((item) => {
              const isOk = item.status === 'VALID' || item.status === 'ALREADY_PROCESSED';
              const isDup = item.status === 'DUPLICATE';

              return (
                <div key={item.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    {isOk ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    ) : isDup ? (
                      <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                          {item.barcode}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                            item.status === 'VALID'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : item.status === 'ALREADY_PROCESSED'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400'
                              : item.status === 'DUPLICATE'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400'
                          }`}
                        >
                          {item.status.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400">{item.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                        {item.message}
                      </p>
                    </div>
                  </div>

                  {scanMode === 'bulk' && onBarcodeDetected && isOk && (
                    <button
                      onClick={() => {
                        onBarcodeDetected(item.barcode);
                        stopCamera();
                        onClose();
                      }}
                      className="px-2 py-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 hover:underline"
                    >
                      Use <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setScanHistory([]);
              recentDetectionsRef.current.clear();
            }}
            className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Clear History
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            {scanMode === 'bulk' ? (
              <button
                type="button"
                onClick={handleConfirmBulk}
                disabled={validCount === 0}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md hover:shadow-lg transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Confirm {validCount} Barcode(s)
              </button>
            ) : (
              lastScanned &&
              onBarcodeDetected && (
                <button
                  type="button"
                  onClick={() => {
                    onBarcodeDetected(lastScanned);
                    stopCamera();
                    onClose();
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md hover:shadow-lg transition flex items-center gap-1.5"
                >
                  Use Barcode ({lastScanned})
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

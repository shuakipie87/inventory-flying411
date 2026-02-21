import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, X, RotateCcw, Upload } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
}

type CameraState = 'initializing' | 'streaming' | 'captured' | 'error';

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<CameraState>('initializing');
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraState('initializing');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState('streaming');
    } catch (err) {
      const msg =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Camera access was denied. Please allow camera permissions.'
          : 'Camera not available on this device.';
      setErrorMessage(msg);
      setCameraState('error');
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      stopStream();
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
    // Only run on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setCapturedBlob(blob);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setCameraState('captured');
        stopStream();
      },
      'image/jpeg',
      0.9
    );
  }, [stopStream]);

  const handleRetake = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setCapturedBlob(null);
    startCamera();
  }, [previewUrl, startCamera]);

  const handleUsePhoto = useCallback(() => {
    if (!capturedBlob) return;
    const file = new File([capturedBlob], `scan-${Date.now()}.jpg`, {
      type: 'image/jpeg',
    });
    onCapture(file);
  }, [capturedBlob, onCapture]);

  const handleFileFallback = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onCapture(file);
      }
    },
    [onCapture]
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black" role="dialog" aria-modal="true" aria-label="Camera capture">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80">
        <span className="text-white text-sm font-medium">Scan Document</span>
        <button
          onClick={onCancel}
          className="min-h-[48px] min-w-[48px] flex items-center justify-center text-white/80 hover:text-white transition-colors"
          aria-label="Close camera"
          data-testid="camera-close-btn"
        >
          <X size={24} />
        </button>
      </div>

      {/* Viewfinder area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {cameraState === 'initializing' && (
          <div className="text-white/60 text-sm">Starting camera...</div>
        )}

        {cameraState === 'error' && (
          <div className="text-center px-6 space-y-4">
            <Camera size={48} className="mx-auto text-white/30" strokeWidth={1.5} />
            <p className="text-white/70 text-sm">{errorMessage}</p>
            <p className="text-white/40 text-xs">You can use the file picker instead.</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.csv,.xlsx,.xls,.pages"
              capture="environment"
              onChange={handleFileFallback}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[48px] px-6 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-xl flex items-center gap-2 mx-auto transition-colors"
              data-testid="camera-fallback-btn"
            >
              <Upload size={18} />
              Choose File
            </button>
          </div>
        )}

        {(cameraState === 'streaming' || cameraState === 'initializing') && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            aria-label="Camera viewfinder"
          />
        )}

        {cameraState === 'captured' && previewUrl && (
          <img
            src={previewUrl}
            alt="Captured photo preview"
            className="w-full h-full object-contain"
          />
        )}

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
      </div>

      {/* Bottom controls */}
      <div className="px-4 py-6 bg-black/80">
        {cameraState === 'streaming' && (
          <div className="flex items-center justify-center">
            <button
              onClick={handleCapture}
              className="min-h-[64px] min-w-[64px] w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
              aria-label="Take photo"
              data-testid="camera-capture-btn"
            >
              <Camera size={28} className="text-slate-800" />
            </button>
          </div>
        )}

        {cameraState === 'captured' && (
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={handleRetake}
              className="min-h-[48px] px-5 py-3 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl flex items-center gap-2 transition-colors"
              data-testid="camera-retake-btn"
            >
              <RotateCcw size={18} />
              Retake
            </button>
            <button
              onClick={handleUsePhoto}
              className="min-h-[48px] px-5 py-3 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-xl flex items-center gap-2 transition-colors"
              data-testid="camera-use-btn"
            >
              <Camera size={18} />
              Use Photo
            </button>
          </div>
        )}

        {cameraState === 'error' && (
          <div className="flex items-center justify-center">
            <button
              onClick={onCancel}
              className="min-h-[48px] px-5 py-3 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Go Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

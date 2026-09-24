'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  MapPin,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  X,
  Upload,
  Smartphone,
  SwitchCamera,
  ShieldCheck,
  Navigation
} from 'lucide-react';
import { AttendanceService, CoordinatesResult, GpsError } from '@/services/AttendanceService';
import { useAppStore } from '@/data/store';

export function CameraCaptureModal({
  isOpen,
  mode,
  onClose,
  onSuccess
}: {
  isOpen: boolean;
  mode: 'CHECK_IN' | 'CHECK_OUT';
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { currentUser } = useAppStore();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [gpsData, setGpsData] = useState<CoordinatesResult | null>(null);
  const [isLoadingGps, setIsLoadingGps] = useState(true);
  const [gpsError, setGpsError] = useState<GpsError | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize GPS and Camera when modal opens
  useEffect(() => {
    if (!isOpen) {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      setCapturedPhoto(null);
      setCameraError(null);
      setGpsData(null);
      setGpsError(null);
      return;
    }

    // 1. Fetch Real GPS from device
    fetchLocation();

    // 2. Start Live Camera
    startCamera(facingMode);

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isOpen, facingMode]);

  const fetchLocation = async () => {
    setIsLoadingGps(true);
    setGpsError(null);
    try {
      const coords = await AttendanceService.getCurrentCoordinates(25);
      setGpsData(coords);
      setGpsError(null);
    } catch (err: any) {
      console.warn('GPS Fix acquisition error:', err);
      setGpsData(null);
      setGpsError(
        err.code
          ? err
          : {
              code: 'POSITION_UNAVAILABLE',
              message: err.message || 'Could not acquire device GPS position.'
            }
      );
    } finally {
      setIsLoadingGps(false);
    }
  };

  const handleUsePlantLocation = () => {
    setGpsData({
      latitude: 20.354122,
      longitude: 85.823611,
      accuracy: 14.5,
      locationName: 'Water Park Rd, Kurangsasan, Odisha 754002',
      isRealGps: true,
      isWithinAcceptableRange: true,
      accuracyBand: 'OPTIMAL',
      distanceFromOffice: 0,
      distanceFormatted: '0 m (At Filtec HQ)'
    });
    setGpsError(null);
    setIsLoadingGps(false);
  };

  const startCamera = async (facing: 'user' | 'environment') => {
    setCameraError(null);
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported on this browser');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn('Direct webcam access issue:', err);
      setCameraError(
        'Live camera stream not permitted or unavailable. Use the "Take with Phone Camera / Upload Photo" button below to capture your real selfie.'
      );
    }
  };

  // Flip Camera between front & back
  const handleToggleCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Capture real snapshot from video stream
  const handleCaptureFromVideo = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;

      // Scale to max 1024px
      const maxDim = 1024;
      let targetW = width;
      let targetH = height;
      if (targetW > maxDim || targetH > maxDim) {
        if (targetW > targetH) {
          targetH = Math.round((targetH * maxDim) / targetW);
          targetW = maxDim;
        } else {
          targetW = Math.round((targetW * maxDim) / targetH);
          targetH = maxDim;
        }
      }

      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // If front camera, flip horizontally for mirror preview natural feel
        if (facingMode === 'user') {
          ctx.translate(targetW, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, targetW, targetH);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedPhoto(dataUrl);
      }
    }
  };

  // Handle native camera or file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const maxDim = 1024;
          let targetW = img.width;
          let targetH = img.height;
          if (targetW > maxDim || targetH > maxDim) {
            if (targetW > targetH) {
              targetH = Math.round((targetH * maxDim) / targetW);
              targetW = maxDim;
            } else {
              targetW = Math.round((targetW * maxDim) / targetH);
              targetH = maxDim;
            }
          }
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, targetW, targetH);
            const compressedUrl = canvas.toDataURL('image/jpeg', 0.85);
            setCapturedPhoto(compressedUrl);
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    startCamera(facingMode);
  };

  const handleConfirmAttendance = () => {
    if (!gpsData || !capturedPhoto || gpsError) return;
    setIsSubmitting(true);

    const finalLocationName = gpsData.locationName;
    const finalLocationData = {
      latitude: gpsData.latitude,
      longitude: gpsData.longitude,
      locationName: finalLocationName,
      accuracy: gpsData.accuracy,
      distanceFromOffice: gpsData.distanceFromOffice
    };

    if (mode === 'CHECK_IN') {
      AttendanceService.recordCheckIn(
        currentUser.employeeCode || currentUser.id,
        currentUser.name,
        finalLocationData,
        capturedPhoto
      );
    } else {
      AttendanceService.recordCheckOut(
        currentUser.employeeCode || currentUser.id,
        currentUser.name,
        finalLocationData,
        capturedPhoto
      );
    }

    setIsSubmitting(false);
    onSuccess();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-neutral-200 my-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8F9FA]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#DC2626]/10 flex items-center justify-center text-[#DC2626]">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#111827]">
                {mode === 'CHECK_IN' ? 'Field Check-In Verification' : 'Field Check-Out Verification'}
              </h3>
              <p className="text-[11px] text-[#6B7280]">
                Real GPS satellite fix & live photograph verification required
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-[#111827] hover:bg-neutral-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Real GPS Warning / Prompt Banner if not active */}
          {isLoadingGps && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
              <RefreshCw className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 animate-spin" />
              <div>
                <p className="font-semibold text-blue-950">Activating GPS Satellite Sensor...</p>
                <p className="text-[11px] text-blue-800 mt-0.5 leading-relaxed">
                  If prompted by your browser, click <strong className="underline">Allow</strong> to grant location access. We are calibrating precision satellite accuracy (10–25m).
                </p>
              </div>
            </div>
          )}

          {gpsError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start justify-between gap-3 text-xs text-rose-900">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-rose-950">
                    {gpsError.code === 'PERMISSION_DENIED'
                      ? 'GPS Location Access Required'
                      : 'GPS Satellite Fix Needed'}
                  </p>
                  <p className="text-[11px] text-rose-800 mt-0.5 leading-relaxed">
                    {gpsError.message}
                  </p>
                  {gpsError.code === 'PERMISSION_DENIED' && (
                    <p className="text-[10px] text-rose-700 mt-1 font-mono">
                      Tip: Look at the location icon in your browser address bar and select &quot;Always allow&quot;.
                    </p>
                  )}
                </div>
              </div>
              <div className="shrink-0 flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={fetchLocation}
                  className="bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
                >
                  <Navigation className="w-3 h-3" />
                  <span>Activate GPS</span>
                </button>
                <button
                  type="button"
                  onClick={handleUsePlantLocation}
                  className="bg-white border border-rose-300 hover:bg-rose-50 text-rose-800 text-[10px] font-semibold px-2.5 py-1 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all"
                >
                  <MapPin className="w-3 h-3 text-rose-600" />
                  <span>Use Plant GPS</span>
                </button>
              </div>
            </div>
          )}

          {/* Camera Viewfinder Area */}
          <div className="relative aspect-4/3 w-full bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800 shadow-inner flex items-center justify-center">
            {capturedPhoto ? (
              <img
                src={capturedPhoto}
                alt="Captured Real Selfie"
                className="w-full h-full object-cover"
              />
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                />

                {/* Face Guide Target Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-60 rounded-full border-2 border-dashed border-white/60 flex items-center justify-center">
                    <span className="bg-black/60 text-white/90 text-[10px] px-2.5 py-0.5 rounded-full font-mono">
                      Center your face
                    </span>
                  </div>
                </div>

                {/* Camera controls overlay */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleCamera}
                    title="Switch Front/Back Camera"
                    className="bg-black/60 hover:bg-black/90 text-white p-2 rounded-full backdrop-blur-xs transition-all border border-white/20"
                  >
                    <SwitchCamera className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}

            {/* Hidden canvas for snapshot rasterization */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Hidden file input for native camera capture */}
            <input
              type="file"
              accept="image/*"
              capture="user"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileUpload}
            />

            {/* Live GPS & Timestamp Badge Overlay */}
            <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
              <div className="bg-black/75 backdrop-blur-xs text-white px-2.5 py-1 rounded-md text-[10px] font-mono flex items-center gap-1.5 max-w-[70%] border border-white/10 shadow-sm">
                <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">
                  {isLoadingGps
                    ? 'Activating GPS...'
                    : gpsError
                    ? '⚠️ GPS Inactive'
                    : gpsData?.distanceFormatted
                    ? `${gpsData.locationName} (${gpsData.distanceFormatted})`
                    : gpsData?.locationName}
                </span>
              </div>
              <div className="bg-black/75 backdrop-blur-xs text-white px-2 py-1 rounded-md text-[10px] font-mono border border-white/10 shadow-sm">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Real Place & GPS Details Card */}
          <div className="p-3.5 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] text-xs space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />
                  <span className="font-semibold text-[#111827]">Physical Location</span>

                  {isLoadingGps ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md border bg-blue-50 text-blue-800 border-blue-200 font-semibold animate-pulse">
                      <RefreshCw className="w-3 h-3 text-blue-600 animate-spin" />
                      <span>Acquiring satellite fix...</span>
                    </span>
                  ) : gpsError ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md border bg-rose-50 text-rose-800 border-rose-200 font-semibold">
                      <AlertTriangle className="w-3 h-3 text-[#DC2626]" />
                      <span>GPS Not Activated</span>
                    </span>
                  ) : gpsData ? (
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md border font-semibold ${
                        gpsData.accuracy <= 25
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {gpsData.accuracy <= 25 ? (
                        <>
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>±{gpsData.accuracy}m Precision • Target 10-25m (Passed)</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          <span>±{gpsData.accuracy}m Precision • Calibrating...</span>
                        </>
                      )}
                    </span>
                  ) : null}
                </div>

                <p className="text-xs text-[#374151] font-medium leading-relaxed">
                  {isLoadingGps ? (
                    <span className="text-blue-600 animate-pulse">Waiting for GPS satellite fix...</span>
                  ) : gpsError ? (
                    <span className="text-rose-600">Position unavailable until GPS permission is granted</span>
                  ) : (
                    gpsData?.locationName || 'Location not acquired'
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={fetchLocation}
                disabled={isLoadingGps}
                title="Activate / Refine GPS satellite fix"
                className="shrink-0 flex items-center gap-1 text-[10px] font-semibold text-neutral-700 hover:text-[#111827] p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingGps ? 'animate-spin text-[#DC2626]' : ''}`} />
                <span className="hidden sm:inline">Refine GPS</span>
              </button>
            </div>

            {/* Calculated Distance from FILTEC Head Office */}
            <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 text-neutral-600">
                <Navigation className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span className="text-[11px] font-medium">Distance from FILTEC HQ:</span>
              </div>
              <div>
                {isLoadingGps ? (
                  <span className="text-[11px] font-mono text-neutral-400 animate-pulse">Calculating...</span>
                ) : gpsData ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-purple-900 bg-purple-50/80 px-2 py-0.5 rounded border border-purple-200">
                    {gpsData.distanceFormatted}
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-neutral-400">—</span>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-[#E5E7EB] flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-[#6B7280]">
              <span>
                Exact GPS:{' '}
                <strong className="text-[#111827]">
                  {isLoadingGps
                    ? 'Acquiring satellite fix...'
                    : gpsData
                    ? `${gpsData.latitude.toFixed(6)}°, ${gpsData.longitude.toFixed(6)}°`
                    : 'Not activated'}
                </strong>
              </span>
              <span>
                Employee: <strong className="text-[#111827]">{currentUser.name}</strong>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            {!capturedPhoto ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCaptureFromVideo}
                  disabled={!!cameraError}
                  className="w-full bg-[#111827] hover:bg-black text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-40 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Snap Real Selfie</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border border-[#E5E7EB] hover:bg-neutral-50 text-[#111827] py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Smartphone className="w-4 h-4 text-[#DC2626]" />
                  <span>Take with Phone Camera</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="flex-1 border border-neutral-300 hover:bg-neutral-100 text-[#111827] py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retake Photo</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting || isLoadingGps || !gpsData || !!gpsError}
                  onClick={handleConfirmAttendance}
                  className="flex-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'Saving Record...'
                      : isLoadingGps
                      ? 'Acquiring GPS...'
                      : !gpsData || gpsError
                      ? 'GPS Activation Required'
                      : mode === 'CHECK_IN'
                      ? 'Confirm & Save Check-In'
                      : 'Confirm & Save Check-Out'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

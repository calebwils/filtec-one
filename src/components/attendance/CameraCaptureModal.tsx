'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  MapPin,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Upload,
  Smartphone,
  SwitchCamera,
  ShieldCheck,
  Edit3
} from 'lucide-react';
import { AttendanceService } from '@/services/AttendanceService';
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
  const [gpsData, setGpsData] = useState<{
    latitude: number;
    longitude: number;
    locationName: string;
    isRealGps: boolean;
  } | null>(null);
  const [customPlaceName, setCustomPlaceName] = useState<string>('');
  const [isEditingPlace, setIsEditingPlace] = useState(false);
  const [isLoadingGps, setIsLoadingGps] = useState(true);
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
      setIsEditingPlace(false);
      return;
    }

    // 1. Fetch Real GPS and Reverse Geocoding
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
    try {
      const coords = await AttendanceService.getCurrentCoordinates();
      setGpsData(coords);
      setCustomPlaceName(coords.locationName);
    } catch (err) {
      console.warn('Failed to get location:', err);
    } finally {
      setIsLoadingGps(false);
    }
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
    if (!gpsData || !capturedPhoto) return;
    setIsSubmitting(true);

    const finalLocationName = customPlaceName.trim() || gpsData.locationName;
    const finalLocationData = {
      latitude: gpsData.latitude,
      longitude: gpsData.longitude,
      locationName: finalLocationName
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
        <div className="px-4 py-3.5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8F9FA]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#111827]">
                {mode === 'CHECK_IN' ? 'Field Check-In Verification' : 'Field Check-Out Verification'}
              </h3>
              <p className="text-[11px] text-[#6B7280]">
                Real GPS location & live photograph verification required
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Real Photo Area */}
        <div className="p-4 space-y-3">
          <div className="relative aspect-4/3 bg-neutral-950 rounded-xl overflow-hidden flex items-center justify-center border border-neutral-800 shadow-inner">
            {capturedPhoto ? (
              <div className="relative w-full h-full">
                <img
                  src={capturedPhoto}
                  alt="Captured Real Selfie"
                  className="w-full h-full object-cover"
                />
                {/* Real photo verified badge */}
                <div className="absolute top-2.5 left-2.5 bg-emerald-700/90 backdrop-blur-xs text-white px-2.5 py-1 rounded-md text-[10px] font-mono flex items-center gap-1.5 shadow-md">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="font-bold tracking-tight">Real Photograph Captured</span>
                </div>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                />

                {/* Face Guide Oval */}
                {!cameraError && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="w-40 h-52 sm:w-48 sm:h-60 rounded-[50%] border-2 border-dashed border-white/50 flex flex-col items-center justify-end pb-4">
                      <span className="text-[10px] font-mono text-white/80 bg-black/50 px-2 py-0.5 rounded backdrop-blur-xs">
                        Center your face
                      </span>
                    </div>
                  </div>
                )}

                {/* Camera Flip Button */}
                {!cameraError && (
                  <button
                    type="button"
                    onClick={handleToggleCamera}
                    title="Switch camera"
                    className="absolute top-2.5 right-2.5 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-xs transition-all border border-white/20"
                  >
                    <SwitchCamera className="w-4 h-4" />
                  </button>
                )}

                {/* Camera fallback notification if permissions blocked */}
                {cameraError && (
                  <div className="absolute inset-0 bg-neutral-900/95 p-5 flex flex-col items-center justify-center text-center text-white">
                    <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mb-2.5 text-amber-400">
                      <Camera className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-semibold text-neutral-200 mb-1">
                      Webcam Stream Not Active
                    </p>
                    <p className="text-[11px] text-neutral-400 max-w-xs mb-4">
                      Capture your real photo using your device camera or photo picker below.
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-md"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Take Real Photo with Device Camera</span>
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Hidden canvas for snapshotting */}
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
                  {isLoadingGps ? 'Resolving real place...' : customPlaceName || gpsData?.locationName}
                </span>
              </div>
              <div className="bg-black/75 backdrop-blur-xs text-white px-2 py-1 rounded-md text-[10px] font-mono border border-white/10 shadow-sm">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Real Place & GPS Details Card */}
          <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] text-xs space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />
                  <span className="font-semibold text-[#111827]">Real Physical Location</span>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    GPS Fix
                  </span>
                </div>

                {!isEditingPlace ? (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#374151] font-medium leading-relaxed">
                      {isLoadingGps ? (
                        <span className="text-neutral-400">Acquiring real location address...</span>
                      ) : (
                        customPlaceName || gpsData?.locationName
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsEditingPlace(true)}
                      title="Refine address or add dealer shop name"
                      className="text-neutral-400 hover:text-[#DC2626] p-1 ml-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="mt-1 flex items-center gap-1.5">
                    <input
                      type="text"
                      value={customPlaceName}
                      onChange={(e) => setCustomPlaceName(e.target.value)}
                      placeholder="e.g., At Shree Balaji Sanitary, Ahmedabad"
                      className="flex-1 text-xs p-1.5 bg-white border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                    />
                    <button
                      type="button"
                      onClick={() => setIsEditingPlace(false)}
                      className="text-xs font-semibold px-2 py-1.5 bg-[#111827] text-white rounded-md"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={fetchLocation}
                disabled={isLoadingGps}
                title="Refresh GPS"
                className="shrink-0 text-neutral-500 hover:text-[#111827] p-1 rounded hover:bg-neutral-200 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingGps ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between font-mono text-[11px] text-[#6B7280]">
              <span>
                Lat/Lon: {gpsData ? `${gpsData.latitude.toFixed(4)}°, ${gpsData.longitude.toFixed(4)}°` : '...'}
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
                  className="w-full bg-[#111827] hover:bg-black text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-40"
                >
                  <Camera className="w-4 h-4" />
                  <span>Snap Real Selfie</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border border-[#E5E7EB] hover:bg-neutral-50 text-[#111827] py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
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
                  className="flex-1 border border-neutral-300 hover:bg-neutral-100 text-[#111827] py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retake Photo</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting || isLoadingGps}
                  onClick={handleConfirmAttendance}
                  className="flex-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'Saving Record...'
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

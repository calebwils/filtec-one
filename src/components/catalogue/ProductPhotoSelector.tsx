'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Check,
  X,
  Sparkles,
  Link as LinkIcon,
  Layers,
  ZoomIn,
  RefreshCw
} from 'lucide-react';

export const FILTEC_PHOTO_PRESETS = [
  { label: 'CPVC Ball Valve', url: '/images/products/cpvc-ball-valve.png', category: 'valves', material: 'CPVC' },
  { label: 'uPVC Ball Valve', url: '/images/products/upvc-ball-valve.png', category: 'valves', material: 'uPVC' },
  { label: 'CPVC Pipe (SDR-11)', url: '/images/products/cpvc-pipe-sdr11.png', category: 'pipes', material: 'CPVC' },
  { label: 'uPVC Pipe (SCH-40)', url: '/images/products/upvc-pipe-sch40.png', category: 'pipes', material: 'uPVC' },
  { label: 'uPVC Pipe (SCH-80)', url: '/images/products/upvc-pipe-sch80.png', category: 'pipes', material: 'uPVC' },
  { label: 'CPVC 90° Elbow', url: '/images/products/cpvc-elbow.png', category: 'fittings', material: 'CPVC' },
  { label: 'CPVC Equal Tee', url: '/images/products/cpvc-tee.png', category: 'fittings', material: 'CPVC' },
  { label: 'CPVC Brass Elbow', url: '/images/products/cpvc-brass-elbow.png', category: 'fittings', material: 'CPVC' },
  { label: 'CPVC Brass Tee', url: '/images/products/cpvc-brass-tee.png', category: 'fittings', material: 'CPVC' },
  { label: 'CPVC Coupler', url: '/images/products/cpvc-coupler.png', category: 'fittings', material: 'CPVC' },
  { label: 'CPVC Endcap', url: '/images/products/cpvc-endcap.png', category: 'fittings', material: 'CPVC' },
  { label: 'uPVC 90° Elbow', url: '/images/products/upvc-elbow.png', category: 'fittings', material: 'uPVC' },
  { label: 'uPVC Equal Tee', url: '/images/products/upvc-tee.png', category: 'fittings', material: 'uPVC' },
  { label: 'uPVC Coupler', url: '/images/products/upvc-coupler.png', category: 'fittings', material: 'uPVC' },
  { label: 'Brass Fitting Insert', url: '/images/products/brass-fitting.png', category: 'fittings', material: 'Brass' },
  { label: 'Solvent Cement Tin (CPVC)', url: '/images/products/solvent-tin-cvpc.png', category: 'solvents', material: 'CPVC' },
  { label: 'Solvent Cement Tin (uPVC)', url: '/images/products/solvent-tin-cvpu.png', category: 'solvents', material: 'uPVC' },
  { label: 'Solvent Cement Tube', url: '/images/products/solvent-tube.png', category: 'solvents', material: 'All' },
  { label: 'PTFE Teflon Tape (10m)', url: '/images/products/teflon-tape-10m.png', category: 'tape', material: 'PTFE' },
  { label: 'PTFE Teflon Tape (5m)', url: '/images/products/teflon-tape-5m.png', category: 'tape', material: 'PTFE' },
  { label: 'Nail Clamp / Clip', url: '/images/products/nail-clamp.png', category: 'fittings', material: 'Plastic' },
  { label: 'Metal Heavy Clamp', url: '/images/products/metal-clamp.png', category: 'fittings', material: 'Metal' },
  { label: 'Clamp Bracket Support', url: '/images/products/clamp-bracket.png', category: 'fittings', material: 'Metal' }
];

interface ProductPhotoSelectorProps {
  imageUrl: string;
  onChange: (url: string) => void;
  productName?: string;
  category?: string;
  material?: string;
}

export function ProductPhotoSelector({
  imageUrl,
  onChange,
  productName,
  category,
  material
}: ProductPhotoSelectorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'preset' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress and convert image to clean data URL
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 800;
          let width = img.width;
          let height = img.height;

          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Export compressed webp with fallback to jpeg
            let dataUrl = canvas.toDataURL('image/webp', 0.85);
            if (!dataUrl.startsWith('data:image/webp')) {
              dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            }
            onChange(dataUrl);
          } else {
            onChange(event.target?.result as string);
          }
          setIsProcessing(false);
        };
        img.onerror = () => {
          setIsProcessing(false);
          alert('Could not process this image file. Please try another image.');
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Image upload failed:', err);
      setIsProcessing(false);
    }
  };

  const handleApplyCustomUrl = () => {
    if (customUrl.trim()) {
      onChange(customUrl.trim());
      setCustomUrl('');
      setShowUrlInput(false);
    }
  };

  const hasPhoto = Boolean(imageUrl && imageUrl.trim());

  return (
    <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-3.5 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-[#DC2626]" />
          <span className="text-xs font-bold text-[#111827]">Product Photo</span>
          <span className="text-[10px] text-[#6B7280]">
            {hasPhoto ? '(Photo Attached)' : '(Optional - shown in catalogue)'}
          </span>
        </div>

        {hasPhoto && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-[11px] text-rose-600 hover:text-rose-800 flex items-center gap-1 font-medium transition-colors"
          >
            <X className="w-3 h-3" /> Remove Photo
          </button>
        )}
      </div>

      {/* Main Preview & Actions Layout */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Photo Preview Card */}
        <div className="relative w-28 h-28 shrink-0 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center p-2 shadow-2xs overflow-hidden group">
          {hasPhoto ? (
            <>
              <img
                src={imageUrl}
                alt={productName || 'Product photo'}
                className="max-h-full max-w-full object-contain filter drop-shadow-xs"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white">
                <span className="text-[10px] font-semibold flex items-center gap-0.5">
                  <Check className="w-3 h-3 text-emerald-400" /> Active
                </span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-2">
              <Upload className="w-6 h-6 text-neutral-300 mb-1" />
              <span className="text-[10px] text-neutral-400 font-medium leading-tight">No Photo Selected</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex-1 w-full space-y-2">
          {/* Method Selector Tabs */}
          <div className="flex items-center gap-1 p-0.5 bg-neutral-200/70 rounded-lg text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-1 rounded-md transition-all text-center ${
                activeTab === 'upload'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Upload Device File
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preset')}
              className={`flex-1 py-1 rounded-md transition-all text-center ${
                activeTab === 'preset'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              FILTEC Presets
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex-1 py-1 rounded-md transition-all text-center ${
                activeTab === 'url'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Custom URL
            </button>
          </div>

          {/* TAB 1: File Upload */}
          {activeTab === 'upload' && (
            <div className="space-y-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/jpg,image/svg+xml"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="w-full py-2 px-3 bg-white hover:bg-neutral-50 border border-neutral-300 hover:border-neutral-400 rounded-lg text-xs font-semibold text-neutral-800 flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#DC2626]" />
                    <span>Compressing & Processing Photo...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 text-[#DC2626]" />
                    <span>{hasPhoto ? 'Replace / Upload New Photo' : 'Choose Photo from Computer / Phone'}</span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-neutral-500">
                Supports PNG, JPG, WEBP. Automatically auto-crops & optimizes for instant mobile loading.
              </p>
            </div>
          )}

          {/* TAB 2: FILTEC Official Presets */}
          {activeTab === 'preset' && (
            <div className="space-y-1.5">
              <select
                value={imageUrl}
                onChange={(e) => onChange(e.target.value)}
                className="w-full p-2 bg-white border border-[#E5E7EB] rounded-lg text-xs text-[#111827] font-medium focus:ring-1 focus:ring-[#DC2626]"
              >
                <option value="">-- Choose Official Stock Photo --</option>
                <optgroup label="Valves">
                  <option value="/images/products/cpvc-ball-valve.png">CPVC Ball Valve</option>
                  <option value="/images/products/upvc-ball-valve.png">uPVC Ball Valve</option>
                </optgroup>
                <optgroup label="Pipes">
                  <option value="/images/products/cpvc-pipe-sdr11.png">CPVC Pipe (SDR-11)</option>
                  <option value="/images/products/upvc-pipe-sch40.png">uPVC Pipe (SCH-40)</option>
                  <option value="/images/products/upvc-pipe-sch80.png">uPVC Pipe (SCH-80)</option>
                </optgroup>
                <optgroup label="Fittings">
                  <option value="/images/products/cpvc-elbow.png">CPVC 90° Elbow</option>
                  <option value="/images/products/cpvc-tee.png">CPVC Equal Tee</option>
                  <option value="/images/products/cpvc-brass-elbow.png">CPVC Brass Elbow</option>
                  <option value="/images/products/cpvc-brass-tee.png">CPVC Brass Tee</option>
                  <option value="/images/products/cpvc-coupler.png">CPVC Coupler</option>
                  <option value="/images/products/cpvc-endcap.png">CPVC Endcap</option>
                  <option value="/images/products/upvc-elbow.png">uPVC 90° Elbow</option>
                  <option value="/images/products/upvc-tee.png">uPVC Equal Tee</option>
                  <option value="/images/products/upvc-coupler.png">uPVC Coupler</option>
                  <option value="/images/products/brass-fitting.png">Brass Fitting Insert</option>
                </optgroup>
                <optgroup label="Solvents & Glues">
                  <option value="/images/products/solvent-tin-cvpc.png">Solvent Cement Tin (CPVC)</option>
                  <option value="/images/products/solvent-tin-cvpu.png">Solvent Cement Tin (uPVC)</option>
                  <option value="/images/products/solvent-tube.png">Solvent Cement Tube</option>
                </optgroup>
                <optgroup label="Tape & Accessories">
                  <option value="/images/products/teflon-tape-10m.png">PTFE Teflon Tape (10m)</option>
                  <option value="/images/products/teflon-tape-5m.png">PTFE Teflon Tape (5m)</option>
                  <option value="/images/products/nail-clamp.png">Nail Clamp</option>
                  <option value="/images/products/metal-clamp.png">Metal Heavy Clamp</option>
                  <option value="/images/products/clamp-bracket.png">Clamp Bracket Support</option>
                </optgroup>
              </select>
            </div>
          )}

          {/* TAB 3: Custom URL */}
          {activeTab === 'url' && (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={customUrl || imageUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg or /images/..."
                className="flex-1 p-2 bg-white border border-[#E5E7EB] rounded-lg text-xs font-mono"
              />
              <button
                type="button"
                onClick={handleApplyCustomUrl}
                className="px-3 py-2 bg-[#111827] text-white rounded-lg text-xs font-semibold hover:bg-black transition-colors"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

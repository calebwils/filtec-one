'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  MapPin,
  Calendar,
  Clock,
  Navigation,
  Compass,
  Footprints,
  Store,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Maximize2,
  Minimize2,
  TrendingUp,
  Battery
} from 'lucide-react';

interface RoutePoint {
  id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  batteryLevel?: number;
  eventType: 'ping_routine' | 'check_in' | 'check_out' | 'client_visit' | 'stop';
  locationName?: string;
  metadata?: any;
  timestamp: string;
  timeStr: string;
}

interface RouteSummary {
  totalPoints: number;
  totalDistanceMeters: number;
  totalDistanceKm: number;
  startTime: string | null;
  endTime: string | null;
  stopsCount: number;
  hasCheckIn: boolean;
  hasCheckOut: boolean;
}

interface RouteStop {
  latitude: number;
  longitude: number;
  locationName?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  eventType: string;
  metadata?: any;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  initialDate?: string;
}

export function EmployeeRouteModal({
  isOpen,
  onClose,
  employeeId,
  employeeName,
  initialDate
}: Props) {
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [points, setPoints] = useState<RoutePoint[]>([]);
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [summary, setSummary] = useState<RouteSummary | null>(null);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});

  // 1. Fetch route data
  const fetchRouteData = async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tracking/route?employee_id=${employeeId}&date=${date}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch employee route tracking data.');
      }
      setPoints(data.points || []);
      setStops(data.stops || []);
      setSummary(data.summary || null);
    } catch (err: any) {
      console.error('Fetch route error:', err);
      setError(err.message || 'Error loading GPS tracking coordinates.');
      setPoints([]);
      setStops([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && employeeId) {
      fetchRouteData(selectedDate);
    }
  }, [isOpen, employeeId, selectedDate]);

  // 2. Initialize and render Leaflet Map
  useEffect(() => {
    if (!isOpen || loading || typeof window === 'undefined') return;

    let isMounted = true;

    async function initMap() {
      const L = (await import('leaflet')).default;
      // Also inject leaflet CSS if not already present
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (!mapContainerRef.current) return;

      // Clean up previous instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current = {};
      }

      // Default view: Abidjan or first point coordinates
      const defaultCenter: [number, number] =
        points.length > 0
          ? [points[0].latitude, points[0].longitude]
          : [5.3600, -4.0083];

      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView(defaultCenter, points.length > 0 ? 14 : 11);

      mapInstanceRef.current = map;

      // Base tile layer (OpenStreetMap / CartoDB Voyager)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
      }).addTo(map);

      if (!points.length) return;

      const latLngs: [number, number][] = points.map((p) => [p.latitude, p.longitude]);

      // Draw polyline connecting points
      const polyline = L.polyline(latLngs, {
        color: '#2563eb', // Blue-600
        weight: 4,
        opacity: 0.85,
        smoothFactor: 1
      }).addTo(map);

      // Fit bounds to show entire trajectory with padding
      map.fitBounds(polyline.getBounds(), { padding: [50, 50] });

      // Custom marker icons
      const createIcon = (html: string, className = '') =>
        L.divIcon({
          html,
          className: `custom-map-marker ${className}`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -20]
        });

      // Point A (Start / Check-in)
      const startPoint = points[0];
      const startIcon = createIcon(`
        <div class="relative flex items-center justify-center w-9 h-9 rounded-full bg-emerald-600 text-white font-bold shadow-lg ring-4 ring-emerald-100 ring-opacity-80">
          <span>A</span>
        </div>
      `);

      const startMarker = L.marker([startPoint.latitude, startPoint.longitude], { icon: startIcon })
        .addTo(map)
        .bindPopup(`
          <div class="p-2 text-xs font-sans">
            <div class="font-bold text-emerald-700 flex items-center gap-1 text-sm">
              <span>🟢 Start / Check-in</span>
            </div>
            <div class="mt-1 text-slate-700"><strong>Time:</strong> ${startPoint.timeStr}</div>
            <div class="text-slate-600">${startPoint.locationName || 'Direct GPS coordinates'}</div>
          </div>
        `);
      markersRef.current[startPoint.id] = startMarker;

      // Intermediate Points (Visits & Significant Stops)
      points.forEach((point, idx) => {
        if (idx === 0 || idx === points.length - 1) return;

        // Special icon for client visits or orders
        if (point.eventType === 'client_visit') {
          const visitIcon = createIcon(`
            <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white shadow-md ring-2 ring-indigo-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><rect width="20" height="5" x="2" y="7"/></svg>
            </div>
          `);

          const m = L.marker([point.latitude, point.longitude], { icon: visitIcon })
            .addTo(map)
            .bindPopup(`
              <div class="p-2 text-xs font-sans">
                <div class="font-bold text-indigo-700 flex items-center gap-1 text-sm">
                  <span>🏪 Dealer Visit / Order</span>
                </div>
                <div class="mt-1 text-slate-700"><strong>Time:</strong> ${point.timeStr}</div>
                <div class="text-slate-600">${point.locationName || 'On-site visit'}</div>
                ${point.metadata?.dealerName ? `<div class="mt-1 text-xs text-indigo-900 font-semibold">Dealer: ${point.metadata.dealerName}</div>` : ''}
              </div>
            `);
          markersRef.current[point.id] = m;
        } else if (idx % Math.max(1, Math.floor(points.length / 8)) === 0) {
          // Subtle waypoint breadcrumbs to indicate direction
          const dotIcon = L.divIcon({
            html: `<div class="w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white shadow-sm opacity-80"></div>`,
            className: '',
            iconSize: [14, 14],
            iconAnchor: [7, 7]
          });
          const m = L.marker([point.latitude, point.longitude], { icon: dotIcon })
            .addTo(map)
            .bindPopup(`
              <div class="p-1.5 text-xs font-sans">
                <div class="font-semibold text-slate-800">Intermediate Waypoint</div>
                <div class="text-slate-500">Time: ${point.timeStr}</div>
                ${point.speed ? `<div class="text-slate-500">Speed: ${(point.speed * 3.6).toFixed(1)} km/h</div>` : ''}
              </div>
            `);
          markersRef.current[point.id] = m;
        }
      });

      // Point B (End / Last Location / Check-out)
      if (points.length > 1) {
        const endPoint = points[points.length - 1];
        const isToday = selectedDate === new Date().toISOString().split('T')[0];
        const hasCheckOut = summary?.hasCheckOut;

        const endIcon = createIcon(
          hasCheckOut
            ? `
            <div class="relative flex items-center justify-center w-9 h-9 rounded-full bg-rose-600 text-white font-bold shadow-lg ring-4 ring-rose-100">
              <span>B</span>
            </div>
          `
            : `
            <div class="relative flex items-center justify-center w-9 h-9 rounded-full bg-rose-500 text-white shadow-lg animate-pulse ring-4 ring-rose-200">
              <span class="w-3 h-3 rounded-full bg-white"></span>
            </div>
          `
        );

        const endMarker = L.marker([endPoint.latitude, endPoint.longitude], { icon: endIcon })
          .addTo(map)
          .bindPopup(`
            <div class="p-2 text-xs font-sans">
              <div class="font-bold text-rose-700 flex items-center gap-1 text-sm">
                <span>${hasCheckOut ? '🏁 End of Shift (Check-out)' : '📍 Live Position (Active Shift)'}</span>
              </div>
              <div class="mt-1 text-slate-700"><strong>Last Position:</strong> ${endPoint.timeStr}</div>
              <div class="text-slate-600">${endPoint.locationName || 'GPS coordinates received'}</div>
            </div>
          `);
        markersRef.current[endPoint.id] = endMarker;
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, loading, points]);

  if (!isOpen) return null;

  const handleSelectPoint = (point: RoutePoint) => {
    setSelectedPointId(point.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([point.latitude, point.longitude], 16, { animate: true });
      const marker = markersRef.current[point.id];
      if (marker) {
        marker.openPopup();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg shadow-sm">
              <Navigation className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                Daily Route Tracking: <span className="text-blue-600">{employeeName}</span>
              </h2>
              <p className="text-xs text-slate-500">Field route traceability and dealer visit locations</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Date Picker */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-300 shadow-sm text-sm">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent border-none text-slate-800 text-sm font-medium focus:outline-none"
              />
            </div>

            <button
              onClick={() => fetchRouteData(selectedDate)}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Metric Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100 border-b border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-600">
          <div className="flex items-center gap-2 px-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <div>
              <span className="block text-slate-400 font-medium">Estimated Distance</span>
              <strong className="text-sm font-bold text-slate-900">
                {summary?.totalDistanceKm ?? 0} km
              </strong>
            </div>
          </div>
          <div className="flex items-center gap-2 px-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <div>
              <span className="block text-slate-400 font-medium">Shift Hours Window</span>
              <strong className="text-sm font-bold text-slate-900">
                {summary?.startTime || '--:--'} → {summary?.endTime || '--:--'}
              </strong>
            </div>
          </div>
          <div className="flex items-center gap-2 px-2">
            <Footprints className="w-4 h-4 text-amber-600" />
            <div>
              <span className="block text-slate-400 font-medium">GPS Points Captured</span>
              <strong className="text-sm font-bold text-slate-900">
                {summary?.totalPoints || 0} points
              </strong>
            </div>
          </div>
          <div className="flex items-center gap-2 px-2">
            <Store className="w-4 h-4 text-indigo-600" />
            <div>
              <span className="block text-slate-400 font-medium">Stops & Visits</span>
              <strong className="text-sm font-bold text-slate-900">
                {summary?.stopsCount || 0} stops
              </strong>
            </div>
          </div>
        </div>

        {/* Content Body: Map + Timeline */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 relative">
          
          {/* Left/Main Map view */}
          <div className="flex-1 relative h-full bg-slate-100">
            {loading && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/70 backdrop-blur-xs">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                <span className="text-sm text-slate-600 font-medium">Generating interactive route map...</span>
              </div>
            )}

            {!loading && points.length === 0 && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-slate-50">
                <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
                  <MapPin className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-800">No route movements recorded for this date</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  No GPS tracking points recorded for this employee on {selectedDate}. Select another date or verify that check-in was recorded.
                </p>
              </div>
            )}

            <div ref={mapContainerRef} className="w-full h-full" />
          </div>

          {/* Right Sidebar: Timeline of stops and milestones */}
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-200 bg-white flex flex-col h-48 md:h-full">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Route Timeline</span>
              <span className="text-[11px] text-slate-500 font-normal">
                {points.length} waypoints
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {points.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No waypoints to display
                </div>
              ) : (
                points.map((p, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === points.length - 1;
                  const isVisit = p.eventType === 'client_visit';

                  let badgeColor = 'bg-slate-100 text-slate-600';
                  let label = `Movement Ping`;

                  if (isFirst) {
                    badgeColor = 'bg-emerald-100 text-emerald-800 border border-emerald-300';
                    label = '🟢 Start / Check-in';
                  } else if (isLast) {
                    badgeColor = 'bg-rose-100 text-rose-800 border border-rose-300';
                    label = summary?.hasCheckOut ? '🏁 End / Check-out' : '📍 Live Position';
                  } else if (isVisit) {
                    badgeColor = 'bg-indigo-100 text-indigo-800 border border-indigo-300';
                    label = `🏪 Dealer Visit`;
                  }

                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectPoint(p)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-start gap-2.5 ${
                        selectedPointId === p.id
                          ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-100'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="mt-0.5">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${badgeColor}`}>
                          {p.timeStr}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-800 truncate">{label}</div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {p.locationName || `${p.latitude.toFixed(4)}, ${p.longitude.toFixed(4)}`}
                        </div>
                        {p.batteryLevel !== undefined && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                            <Battery className="w-3 h-3 text-slate-400" />
                            <span>Battery: {p.batteryLevel}%</span>
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 self-center" />
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

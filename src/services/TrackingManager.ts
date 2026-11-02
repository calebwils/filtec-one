/**
 * TrackingManager: Smart Mobile Web Background/Foreground GPS Tracker for Filtec
 * 
 * Features:
 * 1. Automatically tracks GPS when employee is checked in.
 * 2. Intelligent battery throttling: pings when moved > 50m or every 4 minutes.
 * 3. Wake-up Ping on phone unlock / tab focus (visibilitychange).
 * 4. Offline Queue via IndexedDB with automatic flush on network recovery.
 * 5. Event-based tracking (check_in, check_out, client_visit, order_created).
 */

export interface LocationPing {
  id: string;
  employeeId: string;
  employeeName?: string;
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  batteryLevel?: number;
  eventType: 'ping_routine' | 'check_in' | 'check_out' | 'client_visit' | 'stop';
  locationName?: string;
  metadata?: any;
}

const DB_NAME = 'filtec_tracking_db';
const STORE_NAME = 'offline_pings';
const MIN_DISTANCE_METERS = 50; // Only ping if moved > 50m
const MAX_IDLE_MINUTES = 4; // Or ping every 4 mins even if stationary
const WAKEUP_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes cooldown on wake-up pings

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

class TrackingManagerService {
  private isTracking = false;
  private watchId: number | null = null;
  private employeeId: string | null = null;
  private employeeName: string | null = null;
  private lastPingLocation: { latitude: number; longitude: number; time: number } | null = null;
  private lastWakeupTime = 0;
  private isFlushingQueue = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initIndexedDB();
      this.setupLifecycleListeners();
    }
  }

  // ── IndexedDB Offline Queue ──────────────────────────────────────────────────
  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async initIndexedDB() {
    try {
      await this.openDB();
    } catch (e) {
      console.warn('[TrackingManager] IndexedDB init warning:', e);
    }
  }

  private async queuePingOffline(ping: LocationPing): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(ping);
    } catch (e) {
      console.warn('[TrackingManager] Failed to queue ping in IndexedDB:', e);
    }
  }

  private async getQueuedPings(): Promise<LocationPing[]> {
    try {
      const db = await this.openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  private async clearQueuedPings(ids: string[]): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const id of ids) {
        store.delete(id);
      }
    } catch (e) {
      console.warn('[TrackingManager] Failed to delete synced pings:', e);
    }
  }

  // ── Lifecycle & Sync ────────────────────────────────────────────────────────
  private setupLifecycleListeners() {
    // 1. Sync immediately when network reconnects
    window.addEventListener('online', () => {
      this.flushOfflineQueue();
    });

    // 2. Wake-up Ping on screen unlock / tab visible
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.isTracking) {
        const now = Date.now();
        if (now - this.lastWakeupTime > WAKEUP_COOLDOWN_MS) {
          this.lastWakeupTime = now;
          this.captureSinglePing('ping_routine');
        }
        this.flushOfflineQueue();
      }
    });
  }

  public async flushOfflineQueue(): Promise<void> {
    if (this.isFlushingQueue || typeof navigator === 'undefined' || !navigator.onLine) {
      return;
    }

    this.isFlushingQueue = true;
    try {
      const queued = await this.getQueuedPings();
      if (!queued.length) {
        this.isFlushingQueue = false;
        return;
      }

      const res = await fetch('/api/tracking/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pings: queued })
      });

      if (res.ok) {
        await this.clearQueuedPings(queued.map((p) => p.id));
      }
    } catch (e) {
      console.warn('[TrackingManager] Sync error:', e);
    } finally {
      this.isFlushingQueue = false;
    }
  }

  // ── Public Controls ─────────────────────────────────────────────────────────

  public startTracking(employeeId: string, employeeName?: string) {
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    this.employeeId = employeeId;
    this.employeeName = employeeName || null;
    this.isTracking = true;

    // Immediately capture initial position
    this.captureSinglePing('ping_routine');

    // Start watchPosition for real-time tracking while browser is active
    if (this.watchId === null) {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          this.handlePositionUpdate(position, 'ping_routine');
        },
        (err) => {
          console.warn('[TrackingManager] Geolocation watch error:', err.message);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 30000,
          timeout: 25000
        }
      );
    }
  }

  public stopTracking() {
    this.isTracking = false;
    if (this.watchId !== null && typeof navigator !== 'undefined') {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.flushOfflineQueue();
  }

  public async recordEvent(
    eventType: 'check_in' | 'check_out' | 'client_visit' | 'stop',
    metadata?: any,
    locationName?: string
  ) {
    return this.captureSinglePing(eventType, metadata, locationName);
  }

  // ── Position Handling & Battery Throttling ───────────────────────────────────

  private async captureSinglePing(
    eventType: 'ping_routine' | 'check_in' | 'check_out' | 'client_visit' | 'stop' = 'ping_routine',
    metadata?: any,
    locationName?: string
  ) {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.handlePositionUpdate(pos, eventType, metadata, locationName, true);
      },
      (err) => {
        console.warn('[TrackingManager] Single ping error:', err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 15000,
        timeout: 15000
      }
    );
  }

  private async handlePositionUpdate(
    position: GeolocationPosition,
    eventType: 'ping_routine' | 'check_in' | 'check_out' | 'client_visit' | 'stop',
    metadata?: any,
    locationName?: string,
    force = false
  ) {
    if (!this.employeeId) return;

    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const now = Date.now();

    // Check battery & throttling: only send if forced, or moved > 50m, or elapsed > 4 mins
    if (!force && this.lastPingLocation) {
      const dist = haversineMeters(
        this.lastPingLocation.latitude,
        this.lastPingLocation.longitude,
        lat,
        lng
      );
      const elapsedMinutes = (now - this.lastPingLocation.time) / (1000 * 60);

      if (dist < MIN_DISTANCE_METERS && elapsedMinutes < MAX_IDLE_MINUTES) {
        // Skip ping: stationary and within time threshold
        return;
      }
    }

    this.lastPingLocation = { latitude: lat, longitude: lng, time: now };

    // Get battery level if Battery API is supported
    let batteryLevel: number | undefined = undefined;
    try {
      if ('getBattery' in navigator) {
        const battery: any = await (navigator as any).getBattery();
        batteryLevel = Math.round(battery.level * 100);
      }
    } catch {}

    const ping: LocationPing = {
      id: crypto.randomUUID(),
      employeeId: this.employeeId,
      employeeName: this.employeeName || undefined,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      latitude: lat,
      longitude: lng,
      accuracy: position.coords.accuracy,
      speed: position.coords.speed || undefined,
      heading: position.coords.heading || undefined,
      batteryLevel,
      eventType,
      locationName,
      metadata
    };

    // If online, try sending immediately; otherwise queue
    if (navigator.onLine) {
      try {
        const res = await fetch('/api/tracking/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ping)
        });

        if (!res.ok) {
          await this.queuePingOffline(ping);
        } else {
          // Flush any previously accumulated pings
          this.flushOfflineQueue();
        }
      } catch {
        await this.queuePingOffline(ping);
      }
    } else {
      await this.queuePingOffline(ping);
    }
  }
}

export const TrackingManager = new TrackingManagerService();

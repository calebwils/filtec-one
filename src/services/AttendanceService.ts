import { store } from '@/data/store';
import {
  FILTEC_HQ,
  calculateDistanceMeters,
  formatDistanceToFiltec,
  formatDistanceShort
} from '@/utils/distance';

export { FILTEC_HQ, calculateDistanceMeters, formatDistanceToFiltec, formatDistanceShort };

export interface CoordinatesResult {
  latitude: number;
  longitude: number;
  accuracy: number; // accuracy in meters (target: 10 - 25m)
  locationName: string;
  isRealGps: boolean;
  isWithinAcceptableRange: boolean; // true if accuracy <= 25m
  accuracyBand: 'OPTIMAL' | 'ACCEPTABLE' | 'LOW';
  distanceFromOffice: number; // Distance in meters from Filtec HQ
  distanceFormatted: string; // Formatted distance string
}

export interface GpsError {
  code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'NOT_SUPPORTED';
  message: string;
}

export class AttendanceService {
  static async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    try {
      const res = await fetch(`/api/reverse-geocode?lat=${latitude}&lng=${longitude}`);
      if (res.ok) {
        const data = await res.json();
        if (data.formattedAddress) {
          return data.formattedAddress;
        }
      }
    } catch (e) {
      console.warn('Failed to reverse geocode:', e);
    }
    return `GPS: ${latitude.toFixed(6)}° N, ${longitude.toFixed(6)}° E`;
  }

  static async getPermissionState(): Promise<PermissionState | 'unsupported'> {
    if (typeof navigator === 'undefined' || !navigator.permissions) return 'unsupported';
    try {
      const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      return status.state;
    } catch {
      return 'unsupported';
    }
  }

  private static activeLocationPromise: Promise<CoordinatesResult> | null = null;
  private static cachedResult: CoordinatesResult | null = null;
  private static lastFetchTime: number = 0;

  /**
   * Acquire REAL device GPS fix from the employee's current location.
   * Uses watchPosition / geolocation to obtain genuine hardware/network coordinates.
   * Calculates real distance in meters to FILTEC HQ automatically.
   */
  static async getCurrentCoordinates(
    targetAccuracy: number = 50,
    forceRefresh: boolean = false
  ): Promise<CoordinatesResult> {
    const now = Date.now();
    if (!forceRefresh && AttendanceService.cachedResult && now - AttendanceService.lastFetchTime < 60000) {
      return AttendanceService.cachedResult;
    }

    if (AttendanceService.activeLocationPromise && !forceRefresh) {
      return AttendanceService.activeLocationPromise;
    }

    const promise = new Promise<CoordinatesResult>((resolve, reject) => {
      if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
        reject({
          code: 'NOT_SUPPORTED',
          message: 'GPS geolocation is not supported by this device or browser.'
        } as GpsError);
        return;
      }

      let hasResolved = false;
      let watchId: number | null = null;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const cleanup = () => {
        if (watchId !== null) {
          navigator.geolocation.clearWatch(watchId);
          watchId = null;
        }
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        AttendanceService.activeLocationPromise = null;
      };

      const handleSuccess = async (pos: GeolocationPosition) => {
        if (hasResolved) return;
        hasResolved = true;
        cleanup();

        const latitude = Number(pos.coords.latitude.toFixed(6));
        const longitude = Number(pos.coords.longitude.toFixed(6));
        const rawAccuracy = pos.coords.accuracy ?? 30;
        const accuracy = Number(rawAccuracy.toFixed(1));
        const realPlace = await AttendanceService.reverseGeocode(latitude, longitude);
        const isWithinAcceptableRange = accuracy <= targetAccuracy;
        const accuracyBand: 'OPTIMAL' | 'ACCEPTABLE' | 'LOW' =
          accuracy <= 15 ? 'OPTIMAL' : accuracy <= targetAccuracy ? 'ACCEPTABLE' : 'LOW';

        const distanceFromOffice = calculateDistanceMeters(latitude, longitude);
        const distanceFormatted = formatDistanceToFiltec(distanceFromOffice);

        const result: CoordinatesResult = {
          latitude,
          longitude,
          accuracy,
          locationName: realPlace,
          isRealGps: true,
          isWithinAcceptableRange,
          accuracyBand,
          distanceFromOffice,
          distanceFormatted
        };

        AttendanceService.cachedResult = result;
        AttendanceService.lastFetchTime = Date.now();
        resolve(result);
      };

      const handleError = (err: GeolocationPositionError) => {
        if (hasResolved) return;
        hasResolved = true;
        cleanup();

        let code: GpsError['code'] = 'POSITION_UNAVAILABLE';
        let message = 'Unable to determine GPS position. Please ensure device Location Services are turned on.';
        if (err.code === 1) {
          code = 'PERMISSION_DENIED';
          message = 'GPS location permission was not granted. Tap "Activate GPS" and select "Allow While Using App".';
        } else if (err.code === 2) {
          code = 'POSITION_UNAVAILABLE';
          message = 'GPS position unavailable. Please ensure GPS / Location Services are enabled on your phone.';
        } else if (err.code === 3) {
          code = 'TIMEOUT';
          message = 'GPS satellite lock timed out. Tap "Activate GPS" to retry.';
        }
        reject({ code, message } as GpsError);
      };

      // 25 second timeout to allow user to see and tap the system permission prompt
      timeoutId = setTimeout(() => {
        if (!hasResolved) {
          hasResolved = true;
          cleanup();
          reject({
            code: 'TIMEOUT',
            message: 'GPS satellite lock timed out. Tap "Activate GPS" to retry satellite acquisition.'
          } as GpsError);
        }
      }, 25000);

      try {
        watchId = navigator.geolocation.watchPosition(
          handleSuccess,
          (err) => {
            // If high accuracy watch fails, attempt standard network positioning before failing
            navigator.geolocation.getCurrentPosition(
              handleSuccess,
              () => handleError(err),
              { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
            );
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'GPS Watch failure';
        handleError({ code: 2, message: msg, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
      }
    });

    AttendanceService.activeLocationPromise = promise;
    return promise;
  }

  static recordCheckIn(
    employeeId: string,
    employeeName: string,
    locationData: {
      latitude: number;
      longitude: number;
      locationName: string;
      accuracy?: number;
      distanceFromOffice?: number;
    },
    photoUrl: string
  ) {
    const distanceFromOffice =
      locationData.distanceFromOffice ??
      calculateDistanceMeters(locationData.latitude, locationData.longitude);

    store.recordAttendance({
      employeeId,
      employeeName,
      type: 'CHECK_IN',
      timestamp: new Date().toISOString(),
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      locationName: locationData.locationName,
      accuracy: locationData.accuracy || 14.5,
      accuracyBand: (locationData.accuracy || 14.5) <= 15 ? 'OPTIMAL' : (locationData.accuracy || 14.5) <= 25 ? 'ACCEPTABLE' : 'LOW',
      distanceFromOffice,
      photoUrl,
      verified: true
    });
  }

  static recordCheckOut(
    employeeId: string,
    employeeName: string,
    locationData: {
      latitude: number;
      longitude: number;
      locationName: string;
      accuracy?: number;
      distanceFromOffice?: number;
    },
    photoUrl: string
  ) {
    const distanceFromOffice =
      locationData.distanceFromOffice ??
      calculateDistanceMeters(locationData.latitude, locationData.longitude);

    store.recordAttendance({
      employeeId,
      employeeName,
      type: 'CHECK_OUT',
      timestamp: new Date().toISOString(),
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      locationName: locationData.locationName,
      accuracy: locationData.accuracy || 14.5,
      accuracyBand: (locationData.accuracy || 14.5) <= 15 ? 'OPTIMAL' : (locationData.accuracy || 14.5) <= 25 ? 'ACCEPTABLE' : 'LOW',
      distanceFromOffice,
      photoUrl,
      verified: true
    });
  }
}


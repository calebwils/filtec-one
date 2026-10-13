import { AttendanceRecord } from '@/types';
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

  /**
   * Acquire REAL device GPS fix with high accuracy.
   * On mobile devices, provides a resilient two-tier strategy:
   * 1. Attempts high accuracy hardware satellite fix (target 10-25m)
   * 2. If satellite lock times out indoors, automatically falls back to network/cell positioning
   * Calculates distance to FILTEC HQ automatically.
   */
  static async getCurrentCoordinates(targetAccuracy: number = 25): Promise<CoordinatesResult> {
    return new Promise((resolve, reject) => {
      if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
        reject({
          code: 'NOT_SUPPORTED',
          message: 'GPS geolocation is not supported by this browser or device.'
        } as GpsError);
        return;
      }

      if (
        typeof window !== 'undefined' &&
        window.isSecureContext === false &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1'
      ) {
        reject({
          code: 'NOT_SUPPORTED',
          message:
            'Mobile browsers require a secure connection (HTTPS) for GPS location access. If testing over a local network, please use the Plant GPS fallback.'
        } as GpsError);
        return;
      }

      const processPosition = async (pos: GeolocationPosition) => {
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

        resolve({
          latitude,
          longitude,
          accuracy,
          locationName: realPlace,
          isRealGps: true,
          isWithinAcceptableRange,
          accuracyBand,
          distanceFromOffice,
          distanceFormatted
        });
      };

      // Tier 1: Try high accuracy GPS (satellite / hardware assisted)
      navigator.geolocation.getCurrentPosition(
        processPosition,
        (err) => {
          // If explicitly denied by the user, do not retry
          if (err.code === 1) {
            reject({
              code: 'PERMISSION_DENIED',
              message:
                'GPS location permission was not granted. Tap "Allow GPS Access" and choose "Allow" in your browser prompt.'
            } as GpsError);
            return;
          }

          // Tier 2: If high accuracy timed out or unavailable indoors on mobile, fallback to network/cell positioning
          navigator.geolocation.getCurrentPosition(
            processPosition,
            (fallbackErr) => {
              let code: GpsError['code'] = 'POSITION_UNAVAILABLE';
              let message = 'Unable to determine GPS position. Please ensure device Location Services are turned on.';
              if (fallbackErr.code === 1) {
                code = 'PERMISSION_DENIED';
                message =
                  'GPS location permission was not granted. Tap "Allow GPS Access" and select "Allow".';
              } else if (fallbackErr.code === 2) {
                code = 'POSITION_UNAVAILABLE';
                message =
                  'GPS position unavailable. Please ensure GPS / Location Services are enabled on your device.';
              } else if (fallbackErr.code === 3) {
                code = 'TIMEOUT';
                message =
                  'GPS satellite lock timed out. Click "Activate GPS / Retry" or use the Plant GPS option.';
              }
              reject({ code, message } as GpsError);
            },
            { timeout: 8000, enableHighAccuracy: false, maximumAge: 60000 }
          );
        },
        { timeout: 8000, enableHighAccuracy: true, maximumAge: 15000 }
      );
    });
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


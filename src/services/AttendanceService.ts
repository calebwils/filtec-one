import { AttendanceRecord } from '@/types';
import { store } from '@/data/store';

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
    return `GPS: ${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`;
  }

  static async getCurrentCoordinates(): Promise<{
    latitude: number;
    longitude: number;
    locationName: string;
    isRealGps: boolean;
  }> {
    return new Promise((resolve) => {
      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const latitude = Number(pos.coords.latitude.toFixed(6));
            const longitude = Number(pos.coords.longitude.toFixed(6));
            const realPlace = await AttendanceService.reverseGeocode(latitude, longitude);

            resolve({
              latitude,
              longitude,
              locationName: realPlace,
              isRealGps: true
            });
          },
          async (err) => {
            console.warn('Browser geolocation denied or timed out, trying IP geolocation:', err);
            // Try IP-based real location fallback
            try {
              const ipRes = await fetch('https://ipapi.co/json/');
              if (ipRes.ok) {
                const ipData = await ipRes.json();
                if (ipData.latitude && ipData.longitude) {
                  const lat = Number(Number(ipData.latitude).toFixed(6));
                  const lon = Number(Number(ipData.longitude).toFixed(6));
                  const place = [ipData.city, ipData.region, ipData.country_name].filter(Boolean).join(', ');
                  resolve({
                    latitude: lat,
                    longitude: lon,
                    locationName: place || 'Field Operations Location',
                    isRealGps: false
                  });
                  return;
                }
              }
            } catch (ipErr) {
              console.warn('IP fallback failed:', ipErr);
            }

            // Default field headquarters fallback if fully offline
            resolve({
              latitude: 23.0338,
              longitude: 72.5645,
              locationName: 'Sabarmati, Ahmedabad, Gujarat, India',
              isRealGps: false
            });
          },
          { timeout: 8000, enableHighAccuracy: true, maximumAge: 0 }
        );
      } else {
        resolve({
          latitude: 23.0338,
          longitude: 72.5645,
          locationName: 'Sabarmati, Ahmedabad, Gujarat, India',
          isRealGps: false
        });
      }
    });
  }

  static recordCheckIn(
    employeeId: string,
    employeeName: string,
    locationData: { latitude: number; longitude: number; locationName: string },
    photoUrl: string
  ) {
    store.recordAttendance({
      employeeId,
      employeeName,
      type: 'CHECK_IN',
      timestamp: new Date().toISOString(),
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      locationName: locationData.locationName,
      photoUrl,
      verified: true
    });
  }

  static recordCheckOut(
    employeeId: string,
    employeeName: string,
    locationData: { latitude: number; longitude: number; locationName: string },
    photoUrl: string
  ) {
    store.recordAttendance({
      employeeId,
      employeeName,
      type: 'CHECK_OUT',
      timestamp: new Date().toISOString(),
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      locationName: locationData.locationName,
      photoUrl,
      verified: true
    });
  }
}

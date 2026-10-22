import { NextRequest, NextResponse } from 'next/server';

// In-memory cache keyed by "lat.toFixed(4),lng.toFixed(4)" (~11m resolution)
const geocodeCache = new Map<string, {
  formattedAddress: string;
  area: string;
  city: string;
  state: string;
  country: string;
  postcode: string;
  latitude: number;
  longitude: number;
}>();

function cleanToken(t?: string | null): string {
  if (!t) return '';
  return t
    .replace(/\s*\(M\.Corp\.\)\s*P\.S\.?/i, '')
    .replace(/\s*P\.S\.?/i, '')
    .replace(/\s*district/i, '')
    .trim();
}

interface OsmAddress {
  amenity?: string;
  shop?: string;
  office?: string;
  tourism?: string;
  building?: string;
  industrial?: string;
  leisure?: string;
  road?: string;
  street?: string;
  highway?: string;
  pedestrian?: string;
  suburb?: string;
  neighbourhood?: string;
  quarter?: string;
  residential?: string;
  village?: string;
  hamlet?: string;
  subdistrict?: string;
  county?: string;
  city?: string;
  town?: string;
  municipality?: string;
  state_district?: string;
  district?: string;
  state?: string;
  province?: string;
  region?: string;
  country?: string;
  postcode?: string;
}

function formatOsmAddress(addr: OsmAddress) {
  const landmark = cleanToken(
    addr.amenity || addr.shop || addr.office || addr.tourism || addr.building || addr.industrial || addr.leisure
  );
  const road = cleanToken(addr.road || addr.street || addr.highway || addr.pedestrian);
  const localArea = cleanToken(
    addr.suburb || addr.neighbourhood || addr.quarter || addr.residential || addr.village || addr.hamlet || addr.subdistrict
  );
  const county = cleanToken(addr.county);
  const city = cleanToken(addr.city || addr.town || addr.municipality);
  const district = cleanToken(addr.state_district || addr.district);
  const state = cleanToken(addr.state || addr.province || addr.region);
  const country = cleanToken(addr.country);

  // 1. Resolve specific Area name
  let area = localArea;
  if (!area && county && county.toLowerCase() !== city.toLowerCase() && county.toLowerCase() !== district.toLowerCase()) {
    area = county;
  }
  if (!area && (landmark || road)) {
    area = landmark || road;
  }

  // 2. Assemble hierarchical parts: [Landmark] -> [Road] -> [Area] -> [City] -> [District] -> [State] -> [Country]
  const parts: string[] = [];
  if (landmark && landmark.toLowerCase() !== area.toLowerCase()) parts.push(landmark);
  if (road && road.toLowerCase() !== area.toLowerCase() && road.toLowerCase() !== landmark.toLowerCase()) parts.push(road);
  if (area) parts.push(area);

  // Add city / town if not already present
  if (city && city.toLowerCase() !== area.toLowerCase() && !parts.some((p) => p.toLowerCase() === city.toLowerCase())) {
    parts.push(city);
  }

  // Add district if distinct from city and area
  if (
    district &&
    district.toLowerCase() !== city.toLowerCase() &&
    district.toLowerCase() !== area.toLowerCase() &&
    !parts.some((p) => p.toLowerCase() === district.toLowerCase())
  ) {
    parts.push(district);
  }

  if (state && !parts.some((p) => p.toLowerCase() === state.toLowerCase())) {
    parts.push(state);
  }

  // Add country for international addresses or non-India
  if (country && country.toLowerCase() !== 'india' && !parts.some((p) => p.toLowerCase() === country.toLowerCase())) {
    parts.push(country);
  }

  return {
    area: area || city || district || 'Field Area',
    formattedAddress: parts.join(', '),
    city: city || district,
    state,
    country: country || 'India',
    postcode: addr.postcode || ''
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json(
      { error: 'Latitude and longitude parameters are required' },
      { status: 400 }
    );
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  if (isNaN(latitude) || isNaN(longitude)) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  // Check cache (approx. 11 meters resolution)
  const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  if (geocodeCache.has(cacheKey)) {
    return NextResponse.json({
      success: true,
      ...geocodeCache.get(cacheKey)!,
      latitude,
      longitude
    });
  }

  // 1. PRIMARY: OpenStreetMap Nominatim with zoom 18 for high-precision area resolution
  try {
    const osmRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'FiltecOne-Attendance/1.0 (contact@filtec.in)'
        },
        signal: AbortSignal.timeout(4000)
      }
    );

    if (osmRes.ok) {
      const data = await osmRes.json();
      if (data && data.address) {
        const formatted = formatOsmAddress(data.address);
        if (formatted.formattedAddress) {
          const result = {
            formattedAddress: formatted.formattedAddress,
            area: formatted.area,
            city: formatted.city,
            state: formatted.state,
            country: formatted.country,
            postcode: formatted.postcode,
            latitude,
            longitude
          };
          geocodeCache.set(cacheKey, result);
          return NextResponse.json({
            success: true,
            ...result
          });
        }
      }
    }
  } catch (err) {
    console.warn('Nominatim geocode timed out or failed, falling back to BigDataCloud:', err);
  }

  // 2. FALLBACK: BigDataCloud Reverse Geocode Client API with administrative area extraction
  try {
    const bdcRes = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
      {
        signal: AbortSignal.timeout(3000)
      }
    );

    if (bdcRes.ok) {
      const data = await bdcRes.json();

      // Extract granular area from administrative levels
      let area = '';
      if (Array.isArray(data.localityInfo?.administrative)) {
        const admins = [...data.localityInfo.administrative].reverse();
        for (const admin of admins) {
          const cleaned = cleanToken(admin.name);
          if (
            cleaned &&
            cleaned.toLowerCase() !== (data.countryName || '').toLowerCase() &&
            cleaned.toLowerCase() !== (data.principalSubdivision || '').toLowerCase() &&
            cleaned.toLowerCase() !== (data.city || '').toLowerCase()
          ) {
            area = cleaned;
            break;
          }
        }
      }

      const parts: string[] = [];
      if (area) parts.push(area);
      if (data.locality && !parts.some((p) => p.toLowerCase() === data.locality.toLowerCase())) {
        parts.push(data.locality);
      }
      if (data.city && data.city !== data.locality && !parts.some((p) => p.toLowerCase() === data.city.toLowerCase())) {
        parts.push(data.city);
      }
      if (data.principalSubdivision && !parts.some((p) => p.toLowerCase() === data.principalSubdivision.toLowerCase())) {
        parts.push(data.principalSubdivision);
      }
      if (data.countryName && data.countryName.toLowerCase() !== 'india') {
        parts.push(data.countryName);
      }

      const formattedAddress = parts.length > 0 ? parts.join(', ') : `Field Location (${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°)`;
      const result = {
        formattedAddress,
        area: area || data.city || data.locality || 'Field Area',
        city: data.city || data.locality || '',
        state: data.principalSubdivision || '',
        country: data.countryName || 'India',
        postcode: data.postcode || '',
        latitude,
        longitude
      };
      geocodeCache.set(cacheKey, result);
      return NextResponse.json({
        success: true,
        ...result
      });
    }
  } catch (err) {
    console.warn('BigDataCloud geocode fallback failed:', err);
  }

  // 3. Fallback coordinate formatting if external APIs are unreachable
  return NextResponse.json({
    success: true,
    formattedAddress: `Field Location (${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E)`,
    area: 'Field Area',
    city: '',
    state: '',
    country: '',
    postcode: '',
    latitude,
    longitude
  });
}

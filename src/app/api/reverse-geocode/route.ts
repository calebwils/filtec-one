import { NextRequest, NextResponse } from 'next/server';

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

  // 1. Try BigDataCloud Reverse Geocode Client API
  try {
    const bdcRes = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
      { next: { revalidate: 3600 } }
    );
    if (bdcRes.ok) {
      const data = await bdcRes.json();
      const parts: string[] = [];

      if (data.locality) parts.push(data.locality);
      if (data.city && data.city !== data.locality) parts.push(data.city);
      if (data.principalSubdivision) parts.push(data.principalSubdivision);
      if (data.postcode) parts.push(data.postcode);
      if (data.countryName) parts.push(data.countryName);

      if (parts.length > 0) {
        return NextResponse.json({
          success: true,
          formattedAddress: parts.join(', '),
          city: data.city || data.locality || '',
          state: data.principalSubdivision || '',
          country: data.countryName || 'India',
          postcode: data.postcode || '',
          latitude,
          longitude
        });
      }
    }
  } catch (err) {
    console.warn('BigDataCloud geocode failed, falling back to Nominatim:', err);
  }

  // 2. Fallback to OpenStreetMap Nominatim
  try {
    const osmRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'FiltecOne-Attendance/1.0 (contact@filtec.in)'
        },
        next: { revalidate: 3600 }
      }
    );
    if (osmRes.ok) {
      const data = await osmRes.json();
      if (data.display_name) {
        return NextResponse.json({
          success: true,
          formattedAddress: data.display_name,
          city: data.address?.city || data.address?.town || data.address?.village || '',
          state: data.address?.state || '',
          country: data.address?.country || 'India',
          postcode: data.address?.postcode || '',
          latitude,
          longitude
        });
      }
    }
  } catch (err) {
    console.warn('Nominatim geocode failed:', err);
  }

  // 3. Fallback coordinate formatting if external APIs are unreachable
  return NextResponse.json({
    success: true,
    formattedAddress: `Field Location (${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E)`,
    city: '',
    state: '',
    country: '',
    postcode: '',
    latitude,
    longitude
  });
}

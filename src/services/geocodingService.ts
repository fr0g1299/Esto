const GEOCODING_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY!;

export const geocodeAddress = async (
  address: string
): Promise<{ latitude: number; longitude: number }> => {
  const encodedAddress = encodeURIComponent(address);
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GEOCODING_API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== "OK" || !data.results.length) {
    throw new Error("Address not found");
  }

  const location = data.results[0].geometry.location;
  return {
    latitude: location.lat,
    longitude: location.lng,
  };
};

export function getBoundingBoxFromRadius(
  centerLat: number,
  centerLng: number,
  radiusInKm: number
) {
  console.log(centerLat);
  console.log(centerLng);
  const latDelta = radiusInKm / 111.32;
  const lngDelta =
    radiusInKm / (111.32 * Math.cos(centerLat * (Math.PI / 180)));

  return {
    sw: {
      lat: centerLat - latDelta,
      lng: centerLng - lngDelta,
    },
    ne: {
      lat: centerLat + latDelta,
      lng: centerLng + lngDelta,
    },
  };
}

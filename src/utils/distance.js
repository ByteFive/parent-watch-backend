/*
export function distanceInMeters(a, b){

    const earthRadius = 6371000;
    const toRad = (degress) => (degress * Math.PI) / 180;

    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);

    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) 
    * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;

    return 2 * earthRadius * Math.asin(Math.sqrt(h));
}
    */
   //Código interditado. Será utilizado futuramente para conseguir localização por distância
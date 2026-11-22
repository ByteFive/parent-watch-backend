import "dotenv/config.js";

const NOMINATIM_URL = process.env.NOMINATIM_URL;
const MIN_INTERVAL_MS = 1100;
const CACHE_LIMIT = 500;

const cache = new Map();
let queue = Promise.resolve();
let lastRequestAt = 0;

function wait(ms){
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function cacheKey(lat, lng){
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

async function requestNominatim(lat,lng){
    const elapsed = Date.now() - lastRequestAt;

    if(elapsed < MIN_INTERVAL_MS){
        await wait(MIN_INTERVAL_MS - elapsed);
    
}

lastRequestAt = Date.now();

const url = new URL(NOMINATIM_URL);
url.searchParams.set("format", "jsonv2");
url.searchParams.set("lat", lat);
url.searchParams.set("lon", lng);
url.searchParams.set("zoom", "18");
url.searchParams.set("addressdetails", "1");
url.searchParams.set("accept-language", "pt-BR");

const response = await fetch(url, {
    headers: {"User-Agent": process.env.NOMINATIM_USER_AGENT},
    signal: AbortSignal.timeout(8000)
});

if(!response.ok) {
    throw new Error(`API Error: ${response.status}`);
}

const data = await response.json();
const address = data.address ?? {};

return{
    address: data.display_name ?? null,
    city: address.city ?? address.town ?? address.village ?? address.municipality ?? null
};
}

export function reverseGeocode(lat, lng){
    const key = cacheKey(lat, lng);

    if(cache.has(key)){
        return Promise.resolve(cache.get(key));
    }

    const task = queue.then(async () => {
        try{
            const result = await requestNominatim(lat, lng);

            if(cache.size >= CACHE_LIMIT){
                cache.delete(cache.keys().next().value);
            }

            cache.set(key, result);
            return result;
        }catch (error){
            console.error("API error: ",error.message);
            return {address: null, city: null};
        };
    }
)

    queue = task;
    return task;
};

import User from "../models/user.js";
import { reverseGeocode } from "../utils/geocoder.js";

const SAVE_INTERVAL_MS = 60 * 60 * 1000;
const MAX_ACCURACY_METERS = 100;

const currentPositions = new Map();
const lastSaved = new Map();
const saving = new Set();

export function isValidCoordinate(payload){
    return(
        payload !== null &&
        typeof payload === "object" &&
        Number.isFinite(payload.lat) &&
        Number.isFinite(payload.lng) &&
        payload.lat >= -90 && payload.lat <= 90 &&
        payload.lng >= -180 && payload.lng <= 180
    );
}

export function setCurrentPosition(userId, {lat, lng, accuracy}){

    const position = {
        lat,
        lng,
        accuracy: Number.isFinite(accuracy) ? accuracy : null,
        at: new Date()
    };

    currentPositions.set(String(userId), position);
    return position;
}

export function getCurrentPosition(userId){
    return currentPositions.get(String(userId)) ?? null;
}

export function clearCurrentPosition(userId){
    const id = String(userId);
    currentPositions.delete(id);
    lastSaved.delete(id);
}

async function getLastSaved(id){

    if(lastSaved.has(id)) {
        return lastSaved.get(id);
    }

    const user = await User.findById(id).select("lastLocations").lean();
    const last = user?.lastLocations?.at(-1) ?? null;

    if(last) {
        lastSaved.set(id, last);
    }

    return last;
}

export async function saveIfNeeded(userId, position) {

    const id = String(userId);

    if(saving.has(id)){
        return;
    }

    if(position.accuracy !== null && position.accuracy > MAX_ACCURACY_METERS){
        return;
    }

    saving.add(id);

    try{

        const previous = await getLastSaved(id);

        if(previous && position.at - new Date(previous.at) < SAVE_INTERVAL_MS){
            return;
        }

        const place = await reverseGeocode(position.lat, position.lng);

        const entry = {
            lat: position.lat,
            lng: position.lng,
            address: place.address,
            city: place.city,
            at: position.at
        };

        await User.updateOne(
            { _id: id },
            { $push: { lastLocations: { $each: [entry], $slice: -3 } } }
        );

        lastSaved.set(id, entry);
    }finally{
        saving.delete(id);
    }
}

export async function getLastLocations(userId) {

    const user = await User.findById(userId).select("lastLocations").lean();

    if(!user){
        return null;
    }

    return [...(user.lastLocations ?? [])].reverse();

}
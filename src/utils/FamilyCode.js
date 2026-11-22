import crypto from "crypto";
import User from "../models/user.js";

const FAMILYCODE_FORMAT = /^[A-Z]{4}-[A-Z]{4}$/;

function familyCodeLogic(){
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    let code = '';

    for(let i = 0; i < 8; i++){
        const index = crypto.randomInt(0, characters.length);
        code += characters[index]
    }

    return `${code.slice(0, 4)}-${code.slice(4)}`;

}

export async function createUniqueFamilyCode(){
    for (let i = 0; i < 10; i++){
        const familycode = familyCodeLogic();

        const existingUser = await User.findOne({ familyCode : familycode });

        if(!existingUser){
            return familycode
        }
    }

    throw new Error("Não foi possível criar um FamilyCode único.")

}

export function validateFamilyCode(code){

    return typeof code === "string" && FAMILYCODE_FORMAT.test(code);

}
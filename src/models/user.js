import mongoose from "mongoose";

const locationSchema = new mongoose.Schema(
    {
        lat: {
            type: Number,
            required: true
        },
        lng: {
            type: Number,
            required: true
        },
        address: {
            type: String,
            default: null
        },
        city: {
            type: String,
            default: null
        },
        at: {
            type: Date,
            default: Date.now
        },
    },
    {_id: false}
);

const userSchema = new mongoose.Schema(
{
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    cpfHash: {
        type: String,
        required: true,
        unique: true,
        select: false
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    familyCode: {
        type: String,
        unique: true,
        sparse: true,
        uppercase: true
    },
    role: {
        type: String,
        enum: ["parent", "child"],
        required: true
    },
    children: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    lastLocations:{
        type: [locationSchema],
        default: []
    }

}
);

export default mongoose.model("User", userSchema);
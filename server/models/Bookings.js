import mongoose from "mongoose";

const bookingSchama = new mongoose.Schema({
    user:{
        type:String,
        required: true,
        ref: 'User'
    },
    show:{
        type:String,
        required: true,
        ref: 'Show'
    },
    amount:{
        type:Number,
        required: true
    },
    bookedSeats:{
        type:Array,
        required: true
    },
    isPaid:{
        type:Boolean,
        default: false
    },
    paymentLink:{
        type:String,
    }
},{timestamps: true})

const Booking = mongoose.model("Bookings" ,bookingSchama)

export default Booking;
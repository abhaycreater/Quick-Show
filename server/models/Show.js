import mongoose from "mongoose";

const showSchama = new mongoose.Schema({
    movie:{
        type:String,
        required: true,
        ref: 'Movie'
    },
    showDateTime: {
        type: Date,
        required: true
    },
    showPrice:{
        type: Number,
        required:true
    },
    occupiedSeats:{type: Object , default:{}}
},{minimize: false})

const showModel = mongoose.model('Show', showSchama);

export default showModel;
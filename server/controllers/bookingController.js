import Booking from "../models/Bookings.js";
import showModel from "../models/Show.js"
import Stripe from 'stripe'

const checkSeatsAvailability = async (showId , selectedSeats)=>{
    try{
        const showData =await showModel.findById(showId)
        if(!showData) return false;

        const occupiedSeats = showData.occupiedSeats;

        const isAnySeatTaken = selectedSeats.some(seat => occupiedSeats[seat]);

        return !isAnySeatTaken;
    }catch(error){
        console.log(error.message);
        return false;
        
    }
}

export const createBooking =async (req , res)=>{
    try{
        const {userId} = req.auth();
        const {showId, selectedSeats} = req.body;
        const {origin} = req.headers;

        const isAvailable = await checkSeatsAvailability(showId ,selectedSeats)

        if(!isAvailable){
            return res.json({success: false, message: "Selected seats are not available,"})
        }

        const showData = await showModel.findById(showId).populate('movie')

        const booking = await Booking.create({
            user: userId,
            show: showId,
            amount: showData.showPrice * selectedSeats.length,
            bookedSeats: selectedSeats
        })

        selectedSeats.map((seat)=>{
            showData.occupiedSeats[seat] =userId;
        })

        showData.markModified('occupiedSeats')

        await showData.save()

        //stripe getway Initialize
        const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY)

        //creating line items to for stripe
        const line_items =[{
            price_data:{
                currency: 'usd',
                product_data:{
                    name:showData.movie.title
                },
                unit_amount: Math.round(booking.amount * 100)
            },
            quantity: 1
        }]

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/loading/my-bookings`,
            cancel_url: `${origin}/movies/${showData._id}`,
            line_items: line_items,
            mode: 'payment',
            metadata:{
                bookingId:booking._id.toString()
            },
            expires_at: Math.floor(Date.now() / 1000) + 30 * 60,//expir in 30 min
        })

        booking.paymentLink = session.url
        await booking.save()

        res.json({success: true, url: session.url})
    }catch(error){
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

export const getOccupiedSeats = async (req ,res)=>{
    try{
        const {showId} = req.params;
        const showData = await showModel.findById(showId)

        const occupiedSeats = Object.keys(showData.occupiedSeats)

        res.json({success:true , occupiedSeats})
    }catch(error){
        console.log(error.message);
        
    }
}
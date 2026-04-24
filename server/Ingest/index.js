import { Inngest, step } from "inngest";
import User from "../models/user.js";
import Booking from "../models/Bookings.js";
import showModel from "../models/Show.js";
import sendEmail from "../configs/nodemailer.js";

// Create client
export const inngest = new Inngest({
  id: "movie-ticket-booking",
  eventKey: process.env.INGEST_EVENT_KEY,
});

// Add user
const syncUserCreation = inngest.createFunction(
  {
    id: "sync-user-from-clerk",
    triggers: [{ event: "clerk/user.created" }], // ✅ FIX
  },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } =
      event.data;

    const userData = {
      _id: id,
      email: email_addresses[0].email_address,
      name: first_name + " " + last_name,
      image: image_url,
    };

    await User.create(userData);
  }
);

// Delete user
const syncUserDeletion = inngest.createFunction(
  {
    id: "delete-user-with-clerk",
    triggers: [{ event: "clerk/user.deleted" }],
  },
  async ({ event }) => {
    const { id } = event.data;
    await User.findByIdAndDelete(id);
  }
);

// Update user
const syncUserUpdate = inngest.createFunction(
  {
    id: "update-user-with-clerk",
    triggers: [{ event: "clerk/user.updated" }],
  },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } =
      event.data;

    const userData = {
      _id: id,
      email: email_addresses[0].email_address,
      name: first_name + " " + last_name,
      image: image_url,
    };

    await User.findByIdAndUpdate(id, userData);
  }
);

//Inngest function to cancel booking and release seats of show after 10min of booking created if payment is not made 
const releaseSeatsAndDeleteBooking = inngest.createFunction(
  {
    id: "release-seats-delete-booking",
    triggers: [{ event: "app/checkpayment" }], // ✅ FIX HERE
  },
  async ({ event, step }) => {
    const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000);
    await step.sleepUntil("wait-for-10-minutes", tenMinutesLater);

    await step.run("check-payment-status", async () => {
      const bookingId = event.data.bookingId;
      const booking = await Booking.findById(bookingId);

      if (!booking?.isPaid) {
        const show = await showModel.findById(booking.show);

        booking.bookedSeats.forEach((seat) => {
          delete show.occupiedSeats[seat];
        });

        show.markModified("occupiedSeats");
        await show.save();

        await Booking.findByIdAndDelete(booking._id);
      }
    });
  }
);

//Inggest Function to send email when user books a show
const sendBookingConfirmationEmail = inngest.createFunction(
   {
    id: "send-booking-confirmation-email",
    triggers: [{ event: "app/show.booked" }], // ✅ FIX HERE
  },
  async ({evant ,step})=>{
    const {bookingId} = event.data;

    const booking = await Booking.findById(bookingId).populate({
      path: 'show',
      populate:{path: 'movie', model: "Movie"}
    }).populate('user')

    await sendEmail({
      to:booking.user.email,
      subject: `payment confirmation: "${booking.show.movie.title}" booked!`,
      body: `
            <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
              
              <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; padding: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                
                <h2 style="color: #333;">Hi ${booking?.user?.name}, 👋</h2>

                <p style="font-size: 16px; color: #555;">
                  Your booking for 
                  <strong style="color: #F84565;">
                    ${booking?.show?.movie?.title}
                  </strong> 
                  is <strong>confirmed</strong> 🎉
                </p>

                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />

                <p style="font-size: 15px; color: #444;">
                  <strong>📅 Date:</strong><br/>
                  ${new Date(booking.show.showDateTime).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' })}
                </p>

                <p style="font-size: 15px; color: #444;">
                  <strong>⏰ Time:</strong><br/>
                  ${new Date(booking.show.showDateTime).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })}
                </p>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://your-frontend-url.com"
                    style="background-color: #F84565; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    🎬 Book More Shows
                  </a>
                </div>

                <p style="font-size: 14px; color: #666;">
                  Enjoy the show! 🍿
                </p>

                <p style="font-size: 14px; color: #999;">
                  Thanks for booking with us!<br/>
                  — <strong>QuickShow Team</strong>
                </p>

              </div>
            </div>
          `
    })
  }
)

export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdate,
  releaseSeatsAndDeleteBooking,
  sendBookingConfirmationEmail
];
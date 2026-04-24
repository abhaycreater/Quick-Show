import { cron, Inngest, step } from "inngest";
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
  async ({event ,step})=>{
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
                  <a href="https://localhost:5173/"
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

//Inggest function to send reminder
const sendShowReminders = inngest.createFunction(
  {
    id: "send-show-reminders",
    triggers: [{ cron: "0 */8 * * *" }], // ✅ FIXED
  },//every 8 hours

  async ({step})=>{
    const now = new Date();
    const in8Hours = new Date(now.getTime() + 8 * 60 * 60 * 1000 );
    const windowStart = new Date(in8Hours.getTime() - 10 * 60 *1000);

    //prepare reminder task
    const reminderTask = await step.run("prepare-reminder-task" ,async ()=>{
      const shows = await showModel.find({
        showTime:{$gte : windowStart ,$lte:in8Hours},
      }).populate('movie');

      const tasks = [];

      for(const show of shows){
        if(!show.movie || !show.occupiedSeats) continue;

        const userIds = [...new Set(Object.values(show.occupiedSeats))];
        if(userIds.length === 0) continue;

        const users = await User.find({_id:{userIds}}).select('name email')

        for(const user of users){
          tasks.push({
            userEmail: user.email,
            userName:user.name,
            movieTitle:show.movie.title,
            showTime: show.showDateTime,
          })
        }
      }
      return tasks;
    })
    if(!reminderTask || reminderTask.length === 0){
      return {sent: 0, message:'No reminders to send,.'}
    }

    //send reminder email
    const results = await step.run('send-all-reminders', async()=>{
      return await Promise.allSettled(
        reminderTask.map(task => sendEmail({
          to: task.userEmail,
          subject: `Reminder: your movie ${task.movieTitle} Starts soon!`,
          body: `
<div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
  
  <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; padding: 25px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
    
    <h2 style="color: #333;">Hello ${task.userName}, 👋</h2>

    <p style="font-size: 16px; color: #555;">
      This is a quick reminder for your movie:
    </p>

    <h3 style="color: #F84565; margin: 10px 0;">
      🎬 ${task.movieTitle}
    </h3>

    <p style="font-size: 15px; color: #444;">
      <strong>📅 Date:</strong><br/>
      ${new Date(task.showTime).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' })}
    </p>

    <p style="font-size: 15px; color: #444;">
      <strong>⏰ Time:</strong><br/>
      ${new Date(task.showTime).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })}
    </p>

    <p style="font-size: 15px; color: #444;">
      It starts in approximately <strong>8 hours</strong> — make sure you're ready! 🍿
    </p>

    <div style="text-align: center; margin: 25px 0;">
      <a href="https://your-frontend-url.com"
         style="background-color: #F84565; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
         View Booking
      </a>
    </div>

    <p style="font-size: 14px; color: #666;">
      Enjoy the show! 🎉
    </p>

    <p style="font-size: 13px; color: #999;">
      — QuickShow Team
    </p>

  </div>
</div>
`
        }))
      )
    })

    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.length - sent;

    return{
      sent,
      failed,
      message: `Sent ${sent} reminder(s), ${failed} failed`
    }
  }
)
//inngest function new notification
const sendNewShowNotification = inngest.createFunction(
  {
    id: "send-new-show-notification",
    triggers: [{ event: "app/show-added" }], // ✅ FIX
  },
  async ({event})=>{
    const {movieTitle , movieId} = event.data;

    const users = await User.find({})
    
    for(const user of users){
      const userEmail = user.email;
      const userName = user.name;

      const subject = `New Show Added: ${movieTitle}`
      const body = `<div style="font-family: Arial, sans-serif; padding: 2px">
          <h2>Hi ${userName}</h2>
          <p>We've just added a new show to our library:</p>
          <h3 style="color: #F84565;" >"${movieTitle}"</h3>
          <p>Visit our website</p>
          <br/>
          <p>Thanks, </br>QuickShow Team</p>
      </div>`;
      await sendEmail({
      to: userEmail,
      subject,
      body,
    })
    }
    return {message: 'Notification Sent.'}
  }
)

export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdate,
  releaseSeatsAndDeleteBooking,
  sendBookingConfirmationEmail,
  sendShowReminders,
  sendNewShowNotification
];
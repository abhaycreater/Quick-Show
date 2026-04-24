import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // keep for now (remove in production if possible)
  },
});

const sendEmail = async ({ to, subject, body }) => {
  try {
    const response = await transporter.sendMail({
      from: `"QuickShow" <${process.env.SENDER_EMAIL}>`, // ✅ better format
      to:"patereabhay@gmail.com",
      subject: 'Test',
      text: "Your booking is confirmed", // ✅ add plain text
      html: `<div>hello</div>`,
    });

    console.log("Email sent:", response.messageId);
    return response;

  } catch (error) {
    console.error("Email error:", error);
    throw error;
  }
};


export default sendEmail;
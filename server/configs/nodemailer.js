import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 465,
  secure: true,
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
      to: "patereabhay@gmail.com",
      subject,
      text: "Your booking is confirmed", // ✅ add plain text
      html: body,
    });

    console.log("Email sent:", response.messageId);
    return response;

  } catch (error) {
    console.error("Email error:", error);
    throw error;
  }
};

export default sendEmail;
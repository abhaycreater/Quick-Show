import dotenv from "dotenv";
dotenv.config();

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
    rejectUnauthorized: false, // ✅ FIX
  },
});

const run = async () => {
  try {
    await transporter.verify();
    console.log("Connected!");

    const info = await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: "patereabhay4@gmail.com",
      subject: "Test",
      html: "<h1>Hello</h1>",
    });

    console.log("Sent:", info);
  } catch (err) {
    console.error("ERROR:", err);
  }
};

run();
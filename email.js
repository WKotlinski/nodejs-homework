const nodemailer = require("nodemailer");
require("dotenv").config();

const config = {
  host: "smtp.sendgrid.net",
  port: 587,
  secure: false,
  auth: {
    user: "apikey",
    pass: process.env.SENDGRID_API_KEY,
  },
};

const transporter = nodemailer.createTransport(config);

const emailOptions = (to, subject, html) => {
  return { from: process.env.EMAIL_FROM, to, subject, html };
};
const sendMail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail(emailOptions(to, subject, html));
    console.log(info);
  } catch (e) {
    console.log(e);
  }
};
module.exports = { sendMail };

const nodemailer = require('nodemailer');

exports.sendEmail = async ({ to, subject, html, text }) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  const info = await transporter.sendMail({
    from: `"CareerConnect" <${process.env.EMAIL_USER}>`,
    to, subject, html,
    text: text || html?.replace(/<[^>]+>/g, ''),
  });
  console.log(`📧 Email sent to ${to}: ${info.messageId}`);
  return info;
};

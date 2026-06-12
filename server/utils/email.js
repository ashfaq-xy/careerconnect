const nodemailer = require('nodemailer');

exports.sendEmail = async ({ to, subject, html, text }) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"CareerConnect" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    text: text || html?.replace(/<[^>]+>/g, ''),
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`📧 Email sent to ${to}: ${info.messageId}`);
  return info;
};

const mailer = require("nodemailer");
const dotenv = require("dotenv");

const dotenv_result = dotenv.config({ path: "Envs/mail.env" });

if (dotenv_result.error) {
  console.log("Can't configure environment variables properly.");
  process.exit();
}

//* Receiver_mail : link to be sent on.
//* Content : jwt token.
//* Method will edit the initialized the link with verification:
function SendEmailVerification(receiver_mail, token) {
  const email = process.env.Mail_id;
  const password = process.env.Mail_password;

  const transport = mailer.createTransport({
    service: "gmail",
    auth: {
      user: email,
      pass: password,
    },
  });
  const mailOptions = {
    from: email,
    to: receiver_mail,
    subject: "Confirm your email",
    text: `Your email verification code : ${token}`,
  };
  transport.sendMail(mailOptions, (error, info) => {
    if (error) {
      return "False";
    } else {
      console.log("Email sent.");
      return info.response;
    }
  });
}

function SendForgotPasswordLink(receiver_mail, link_content) {
  const email = process.env.Mail_id;
  const password = process.env.Mail_password;

  const transport = mailer.createTransport({
    service: "gmail",
    auth: {
      user: email,
      pass: password,
    },
  });
  const mailOptions = {
    from: email,
    to: receiver_mail,
    subject: "Reset your password",
    text: `Your reset password link is : http://localhost:3000/ForgetPw/${link_content}`,
  };
  transport.sendMail(mailOptions, (error, info) => {
    if (error) {
      return "False";
    } else {
      console.log("Email sent.");
      return info.response;
    }
  });
}

module.exports = { SendEmailVerification, SendForgotPasswordLink };

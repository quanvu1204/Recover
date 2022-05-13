const nodemailer = require("nodemailer");

class EmailError {
  constructor(body) {
    this.body = body;
  }

  async sendEmail(toEmail = "", fromEmail = "", fromPassword = "") {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: fromEmail,
        pass: fromPassword,
      },
    });

    const mailInfo = {
      from: `"Sankaku Complex" <${fromEmail}>`,
      to: toEmail,
      subject: "Upload Script > Error",
      text: this.body,
    };

    transporter.sendMail(mailInfo, function (error, info) {
      if (error) {
        return console.log(error);
      } else {
        return console.log("Email Sent: " + info.response);
      }
    });
  }
}

module.exports = EmailError;

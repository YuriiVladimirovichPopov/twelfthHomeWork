import nodemailer from "nodemailer";

export const emailAdapter = {
  async sendEmail(email: string, subject: string, code: string) {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.PASSWORD_USER,
      },
    });

    const info = await transporter.sendMail({
      from: '"Papan" <papanchik2021@gmail.com>',
      to: email,
      subject: subject,
      html: `<h1>Thank for your registration</h1>
              <p>To finish registration please follow the link below:
                  <a href='https://somesite.com/confirm-email?code=${code}'>complete registration</a>
              </p>`,
    });
    return !!info;
  },

  async sendEmailWithRecoveryCode(email: string, recoveryCode: string) {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.PASSWORD_USER,
      },
    });
    const info = await transporter.sendMail({
      from: '"Papan" <papanchik2021@gmail.com>',
      to: email,
      html: ` <h1>Password recovery</h1>
          <p>To finish password recovery please follow the link below:
             <a href='https://somesite.com/password-recovery?recoveryCode=${recoveryCode}'>recovery password</a>
         </p>`,
    });
    return info;
  },
};

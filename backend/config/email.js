const nodemailer = require('nodemailer');

// Buat transporter untuk kirim email
const transporter = nodemailer.createTransport({
  service: 'gmail', // Atau gunakan SMTP lain
  auth: {
    user: process.env.EMAIL_USER, // Email pengirim
    pass: process.env.EMAIL_PASS  // App Password (bukan password biasa)
  }
});

// Function untuk kirim email reset password
const sendResetPasswordEmail = async (email, resetToken) => {
  const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"CampusMarket" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset Password - CampusMarket',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #A4C3B2; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #A4C3B2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Reset Password</h1>
          </div>
          <div class="content">
            <p>Halo,</p>
            <p>Kami menerima permintaan untuk reset password akun CampusMarket Anda.</p>
            <p>Klik tombol di bawah untuk membuat password baru:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p>Atau copy link berikut ke browser Anda:</p>
            <p style="background: #eee; padding: 10px; word-break: break-all;">${resetUrl}</p>
            <div class="warning">
              <strong>⚠️ Penting:</strong>
              <ul>
                <li>Link ini berlaku selama <strong>1 jam</strong></li>
                <li>Jika Anda tidak meminta reset password, abaikan email ini</li>
                <li>Jangan bagikan link ini ke siapapun</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>Email ini dikirim otomatis oleh sistem CampusMarket</p>
            <p>© 2025 CampusMarket. Platform Marketplace Mahasiswa.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
};

module.exports = {
  sendResetPasswordEmail
};
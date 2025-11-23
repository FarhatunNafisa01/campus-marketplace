const nodemailer = require('nodemailer');

// Fungsi untuk membuat transporter (diperbaiki: createTransport, bukan createTransporter)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'your-default-email@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-default-pass'
    }
  });
};

// Fungsi utama untuk mengirim email reset password
const sendResetPasswordEmail = async (email, resetToken) => {
  // Validasi input (tidak berubah)
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Invalid email address provided.');
  }
  if (!resetToken || typeof resetToken !== 'string') {
    throw new Error('Invalid reset token provided.');
  }

  const encodedToken = encodeURIComponent(resetToken);
  const resetUrl = `http://localhost:3000/reset-password?token=${encodedToken}`;

  const mailOptions = {
    from: `"CampusMarket" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔐 Reset Password - CampusMarket',
    html: `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Password</title>
        <style>
          /* Reset dan base styles untuk kompatibilitas email */
          body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
          table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
          img { -ms-interpolation-mode: bicubic; border: 0; outline: none; }
          a { text-decoration: none; color: inherit; }
          
          /* Custom styles untuk desain ultra-estetis dan responsif */
          body { font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.8; color: #2d3748; margin: 0; padding: 0; background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%); }
          .container { max-width: 720px; margin: 20px auto; background: #ffffff; border-radius: 24px; box-shadow: 0 25px 50px rgba(0,0,0,0.15); overflow: hidden; border: 1px solid #d1d5db; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 60px 40px; text-align: center; position: relative; border-radius: 24px 24px 0 0; }
          .header .pattern { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.1; background-image: radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px); background-size: 20px 20px; }
          .header h1 { margin: 0; font-size: 40px; font-weight: 900; text-shadow: 0 3px 6px rgba(0,0,0,0.3); z-index: 2; position: relative; letter-spacing: -1px; }
          .header .icon { width: 90px; height: 90px; margin: 0 auto 20px; display: block; z-index: 2; position: relative; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2)); }
          .content { padding: 40px; }
          .card { background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 20px; padding: 35px; margin-bottom: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e5e7eb; position: relative; overflow: hidden; }
          .card::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 5px; background: linear-gradient(90deg, #A4C3B2, #7FB685, #4CAF50); }
          .card h2 { margin: 0 0 25px 0; font-size: 28px; font-weight: 800; color: #1f2937; background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
          .step { display: flex; align-items: flex-start; margin-bottom: 25px; padding: 20px; background: rgba(255,255,255,0.8); border-radius: 16px; border-left: 5px solid #A4C3B2; transition: transform 0.3s ease; }
          .step:hover { transform: translateX(5px); }
          .step .icon { width: 50px; height: 50px; margin-right: 20px; flex-shrink: 0; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1)); }
          .step p { margin: 0; font-size: 17px; color: #4b5563; line-height: 1.6; }
          .step strong { color: #1f2937; }
          .cta-section { text-align: center; margin: 40px 0; }
          .button { display: inline-block; background: linear-gradient(135deg, #A4C3B2 0%, #7FB685 100%); color: #ffffff; padding: 22px 70px; text-decoration: none; border-radius: 50px; font-weight: 800; font-size: 20px; margin: 20px 0; box-shadow: 0 12px 30px rgba(164, 195, 178, 0.4); transition: all 0.4s ease; position: relative; overflow: hidden; text-transform: uppercase; letter-spacing: 1px; }
          .button::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent); transition: left 0.7s; }
          .button:hover { transform: translateY(-6px); box-shadow: 0 18px 40px rgba(164, 195, 178, 0.5); }
          .button:hover::before { left: 100%; }
          .link-section { margin: 30px 0; }
          .link-box { background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); padding: 25px; border-radius: 16px; word-break: break-all; font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace; font-size: 15px; margin: 20px 0; border: 1px solid #d1d5db; box-shadow: inset 0 3px 6px rgba(0,0,0,0.1); color: #374151; }
          .progress-container { margin: 30px 0; text-align: center; }
          .progress-container p { font-size: 16px; color: #6b7280; margin-bottom: 15px; }
          .progress-bar { width: 100%; height: 14px; background: #e5e7eb; border-radius: 7px; overflow: hidden; box-shadow: inset 0 2px 4px rgba(0,0,0,0.15); position: relative; }
          .progress-bar .fill { height: 100%; background: linear-gradient(90deg, #A4C3B2 0%, #7FB685 50%, #4CAF50 100%); width: 80%; border-radius: 7px; position: relative; }
          .progress-bar .fill::after { content: '80%'; position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: #ffffff; font-size: 12px; font-weight: bold; }
          .warning { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 12px solid #f59e0b; padding: 30px; margin: 40px 0; border-radius: 16px; box-shadow: 0 8px 20px rgba(245, 158, 11, 0.15); }
          .warning strong { display: flex; align-items: center; font-size: 22px; color: #92400e; margin-bottom: 15px; }
          .warning svg { width: 32px; height: 32px; margin-right: 15px; }
          .warning ul { margin: 0; padding-left: 35px; }
          .warning li { margin-bottom: 12px; font-size: 17px; color: #78350f; line-height: 1.6; }
          .help-section { text-align: center; margin: 30px 0; padding: 20px; background: #f9fafb; border-radius: 16px; }
          .help-section p { margin: 0; font-size: 16px; color: #6b7280; }
          .footer { text-align: center; color: #9ca3af; font-size: 15px; padding: 50px 40px; background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-top: 1px solid #d1d5db; }
          .footer p { margin: 12px 0; }
          .footer .brand { font-weight: 900; color: #374151; font-size: 18px; }
          .footer .social { margin-top: 25px; }
          .footer .social a { margin: 0 20px; text-decoration: none; color: #667eea; font-size: 28px; transition: all 0.3s ease; display: inline-block; }
          .footer .social a:hover { color: #764ba2; transform: scale(1.2) rotate(5deg); }
          
          /* Responsivitas untuk mobile */
          @media (max-width: 600px) {
            .container { margin: 10px; border-radius: 16px; }
            .header { padding: 40px 20px; }
            .header h1 { font-size: 32px; }
            .header .icon { width: 70px; height: 70px; }
            .content { padding: 25px; }
            .card { padding: 25px; margin-bottom: 20px; }
            .card h2 { font-size: 24px; }
            .step { flex-direction: column; text-align: center; padding: 15px; }
            .step .icon { margin-bottom: 15px; margin-right: 0; }
            .button { padding: 18px 50px; font-size: 16px; }
            .link-box { padding: 20px; font-size: 14px; }
            .warning { padding: 20px; }
            .footer { padding: 30px 20px; }
            .footer .social a { margin: 0 15px; font-size: 24px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="pattern"></div>
            <svg class="icon" viewBox="0 0 24 24" fill="white">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm3 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
            </svg>
            <h1>Reset Password</h1>
          </div>
          <div class="content">
            <div class="card">
              <h2>Halo, Sobat CampusMarket! 👋</h2>
              <p>Kami menerima permintaan untuk reset password akun Anda. Mari kita lakukan ini dengan mudah dan aman. Ikuti langkah-langkah di bawah untuk melanjutkan.</p>
              <div class="step">
                <svg class="icon" viewBox="0 0 24 24" fill="#A4C3B2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <p><strong>Langkah 1:</strong> Klik tombol di bawah untuk membuat password baru. Proses ini cepat dan aman.</p>
              </div>
              <div class="cta-section">
                <a href="${resetUrl}" class="button">Reset Password Sekarang ✨</a>
              </div>
              <div class="step">
                <svg class="icon" viewBox="0 0 24 24" fill="#667eea">
                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                </svg>
                <p><strong>Langkah 2:</strong> Atau salin dan tempel link berikut ke browser Anda untuk akses langsung.</p>
              </div>
              <div class="link-section">
                <div class="link-box">${resetUrl}</div>
              </div>
              <div class="progress-container">
                <p>Waktu tersisa untuk link ini (1 jam):</p>
                <div class="progress-bar">
                  <div class="fill"></div>
                </div>
              </div>
            </div>
            <div class="card">
              <div class="warning">
                <strong>
                  <svg viewBox="0 0 24 24" fill="#f59e0b">
                    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                  </svg>
                  Tips Keamanan Penting
                </strong>
                <ul>
                  <li>Link ini berlaku selama <strong>1 jam</strong> – gunakan segera untuk menghindari kedaluwarsa!</li>
                  <li>Jika Anda tidak meminta reset, abaikan email ini dan segera periksa keamanan akun Anda.</li>
                  <li>Jangan bagikan link ini kepada siapa pun – keamanan akun Anda adalah prioritas kami.</li>
                  <li>Pastikan Anda menggunakan koneksi internet yang aman saat mengakses link.</li>
                </ul>
              </div>
              <div class="help-section">
                <p>Butuh bantuan lebih lanjut? Tim dukungan kami siap membantu di <a href="mailto:support@campusmarket.com" style="color: #667eea; font-weight: bold;">support@campusmarket.com</a>.</p>
              </div>
            </div>
          </div>
          <div class="footer">
            <p class="brand">CampusMarket</p>
            <p>Platform Marketplace Mahasiswa yang Inovatif, Aman, dan Terpercaya.</p>
            <p>© 2025 CampusMarket. All rights reserved.</p>
            <div class="social">
              <a href="#" title="Facebook" aria-label="Kunjungi Facebook CampusMarket">📘</a>
              <a href="#" title="Instagram" aria-label="Kunjungi Instagram CampusMarket">📷</a>
              <a href="#" title="Twitter" aria-label="Kunjungi Twitter CampusMarket">🐦</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Halo,

      Kami menerima permintaan untuk reset password akun CampusMarket Anda.

      Klik link berikut untuk reset password: ${resetUrl}

      Link ini berlaku selama 1 jam. Jika Anda tidak meminta ini, abaikan email ini.

      Terima kasih,
      Tim CampusMarket
    `
  };

  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// Export fungsi untuk digunakan di modul lain
module.exports = {
  sendResetPasswordEmail,
  createTransporter
};
require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
    },
});

// Verify the connection configuration
transporter.verify((error, success) => {
    if (error) {
        console.error('Error connecting to email server:', error);
    } else {
        console.log('Email server is ready to send messages');
    }
});

// Generic function to send email
const sendEmail = async (to, subject, text, html) => {
    try {
        const info = await transporter.sendMail({
            from: `"Backend-BankingSystem" <${process.env.EMAIL_USER}>`, // sender address
            to, // list of receivers
            subject, // Subject line
            text, // plain text body
            html, // html body
        });

        console.log('Message sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

// REGISTRATION ACKNOWLEDGEMENT
const sendRegistrationEmail = async (userEmail, name) => {
    const subject = 'Welcome to Secure Banking System - Account Registered Successfully';

    const text = `Hello ${name},\n\nThank you for registering with Secure Banking System. We are excited to have you on board!\n\nYour account registration has been successfully completed. You can now securely manage your banking account and transactions.\n\nIf you did not initiate this account registration, please contact our 24/7 Customer Support & Security team immediately.\n\nBest regards,\nThe Banking System Security & Operations Team`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%); padding: 30px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.5px; }
        .content { padding: 35px 30px; color: #333333; line-height: 1.6; }
        .content h2 { color: #203a43; font-size: 20px; margin-top: 0; }
        .badge { display: inline-block; background-color: #e8f4fd; color: #203a43; padding: 6px 14px; border-radius: 20px; font-weight: 600; font-size: 13px; margin-bottom: 15px; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #777777; border-top: 1px solid #eeeeee; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏦 Secure Banking System</h1>
        </div>
        <div class="content">
          <div class="badge">Registration Confirmed</div>
          <h2>Welcome, ${name}!</h2>
          <p>Thank you for choosing <strong>Secure Banking System</strong>. Your registration has been processed successfully.</p>
          <p>We are dedicated to offering you safe, reliable, and seamless financial services. You can now log in to your account and explore our digital banking solutions.</p>
          <p><em>Security Tip: Never share your account credentials, passwords, or OTPs with anyone. Our team will never ask for your password.</em></p>
          <p style="margin-top: 30px;">Best regards,<br><strong>The Banking System Security & Operations Team</strong></p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Secure Banking System. All rights reserved.</p>
          <p>This is an automated notification. Please do not reply directly to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

    return await sendEmail(userEmail, subject, text, html);
};

// Successful Transaction ACK
const sendTransactionSuccessEmail = async (userEmail, name, amount, transactionId, toAccountDetails) => {
    const subject = `Transaction Successful - ₹${amount} Debited`;

    const text = `Hello ${name},\n\nYour transaction of ₹${amount} was successful.\n\nTransaction Details:\n- Transaction ID: ${transactionId}\n- Amount: ₹${amount}\n- Status: COMPLETED\n- Date: ${new Date().toLocaleString()}\n${toAccountDetails ? `- Recipient: ${toAccountDetails}\n` : ''}\nIf you did not authorize this transaction, please report it to our 24/7 Security Desk immediately.\n\nBest regards,\nThe Banking System Operations Team`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 25px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 600; }
        .content { padding: 30px; color: #333333; line-height: 1.6; }
        .badge-success { display: inline-block; background-color: #d4edda; color: #155724; padding: 6px 14px; border-radius: 20px; font-weight: 600; font-size: 13px; margin-bottom: 15px; }
        .amount-card { background-color: #f8f9fa; border-left: 4px solid #28a745; padding: 15px 20px; border-radius: 4px; margin: 20px 0; }
        .amount-title { font-size: 13px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px; margin: 0; }
        .amount-val { font-size: 26px; font-weight: 700; color: #28a745; margin: 5px 0 0 0; }
        .details-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .details-table td { padding: 8px 0; font-size: 14px; border-bottom: 1px dashed #eee; }
        .details-table td.label { color: #6c757d; font-weight: 500; }
        .details-table td.val { text-align: right; font-weight: 600; color: #333; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #777777; border-top: 1px solid #eeeeee; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏦 Transaction Confirmation</h1>
        </div>
        <div class="content">
          <div class="badge-success">✓ Transaction Successful</div>
          <h2>Hello, ${name}</h2>
          <p>Your transaction has been processed successfully. Here are the summary details:</p>
          
          <div class="amount-card">
            <p class="amount-title">Debited Amount</p>
            <p class="amount-val">₹${amount}</p>
          </div>

          <table class="details-table">
            <tr>
              <td class="label">Transaction ID</td>
              <td class="val">${transactionId}</td>
            </tr>
            <tr>
              <td class="label">Status</td>
              <td class="val" style="color: #28a745;">COMPLETED</td>
            </tr>
            ${toAccountDetails ? `
            <tr>
              <td class="label">Recipient Account</td>
              <td class="val">${toAccountDetails}</td>
            </tr>` : ''}
            <tr>
              <td class="label">Date & Time</td>
              <td class="val">${new Date().toLocaleString()}</td>
            </tr>
          </table>

          <p style="margin-top: 25px; font-size: 13px; color: #6c757d;">
            If you did not authorize this transaction, please contact our 24/7 Security Operations team immediately.
          </p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Secure Banking System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

    return await sendEmail(userEmail, subject, text, html);
};

// FALIURE ACK
const sendTransactionFailureEmail = async (userEmail, name, amount, reason = 'Transaction Processing Error', transactionId = 'N/A') => {
    const subject = `Alert: Transaction Failed - ₹${amount}`;

    const text = `Hello ${name},\n\nYour transaction attempt of ₹${amount} has failed.\n\nReason: ${reason}\nTransaction ID: ${transactionId}\nDate: ${new Date().toLocaleString()}\n\nNo funds were debited from your account. If you need assistance, please contact customer support.\n\nBest regards,\nThe Banking System Operations Team`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #eb3b5a 0%, #fa8231 100%); padding: 25px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 600; }
        .content { padding: 30px; color: #333333; line-height: 1.6; }
        .badge-danger { display: inline-block; background-color: #f8d7da; color: #721c24; padding: 6px 14px; border-radius: 20px; font-weight: 600; font-size: 13px; margin-bottom: 15px; }
        .amount-card { background-color: #fff5f5; border-left: 4px solid #dc3545; padding: 15px 20px; border-radius: 4px; margin: 20px 0; }
        .amount-title { font-size: 13px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px; margin: 0; }
        .amount-val { font-size: 26px; font-weight: 700; color: #dc3545; margin: 5px 0 0 0; }
        .details-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .details-table td { padding: 8px 0; font-size: 14px; border-bottom: 1px dashed #eee; }
        .details-table td.label { color: #6c757d; font-weight: 500; }
        .details-table td.val { text-align: right; font-weight: 600; color: #333; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #777777; border-top: 1px solid #eeeeee; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏦 Transaction Alert</h1>
        </div>
        <div class="content">
          <div class="badge-danger">✕ Transaction Failed</div>
          <h2>Hello, ${name}</h2>
          <p>We were unable to process your transaction attempt. Please see details below:</p>
          
          <div class="amount-card">
            <p class="amount-title">Attempted Amount</p>
            <p class="amount-val">₹${amount}</p>
          </div>

          <table class="details-table">
            <tr>
              <td class="label">Transaction ID</td>
              <td class="val">${transactionId}</td>
            </tr>
            <tr>
              <td class="label">Failure Reason</td>
              <td class="val" style="color: #dc3545;">${reason}</td>
            </tr>
            <tr>
              <td class="label">Date & Time</td>
              <td class="val">${new Date().toLocaleString()}</td>
            </tr>
          </table>

          <p style="margin-top: 25px; font-size: 13px; color: #6c757d;">
            <strong>Note:</strong> If any amount was temporarily deducted, it will be refunded back to your account automatically.
          </p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Secure Banking System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

    return await sendEmail(userEmail, subject, text, html);
};

module.exports = {
    sendEmail,
    sendRegistrationEmail,
    sendTransactionSuccessEmail,
    sendTransactionFailureEmail,
};
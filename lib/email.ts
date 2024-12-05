import { createTransport } from 'nodemailer'

const transporter = createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email/${token}`
  
  await transporter.sendMail({
    from: `"${process.env.SMTP_FROM}" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Benvenuto in ARTEXMODA - Verifica il tuo account',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verifica Email</title>
        </head>
        <body style="
          margin: 0;
          padding: 0;
          background-color: #f6f9fc;
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        ">
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table width="560" border="0" cellspacing="0" cellpadding="0" style="
                  background-color: #ffffff;
                  border-radius: 8px;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                ">
                  <!-- Header -->
                  <tr>
                    <td align="center" style="padding: 40px 40px 0;">
                      <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo.png" alt="ARTEXMODA" style="width: 200px;">
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h1 style="
                        margin: 0 0 20px;
                        color: #1a1a1a;
                        font-size: 24px;
                        font-weight: 600;
                        text-align: center;
                      ">
                        Benvenuto in ARTEXMODA!
                      </h1>
                      
                      <p style="
                        margin: 0 0 20px;
                        color: #4a5568;
                        font-size: 16px;
                        line-height: 24px;
                        text-align: center;
                      ">
                        Ciao ${name},<br>
                        grazie per esserti registrato. Per iniziare ad utilizzare il tuo account, 
                        verifica il tuo indirizzo email cliccando sul pulsante qui sotto.
                      </p>
                      
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td align="center" style="padding: 30px 0;">
                            <a href="${verificationUrl}" style="
                              display: inline-block;
                              padding: 16px 36px;
                              background-color: #000000;
                              color: #ffffff;
                              text-decoration: none;
                              border-radius: 6px;
                              font-size: 16px;
                              font-weight: 600;
                            ">
                              Verifica Email
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="
                        margin: 0;
                        color: #718096;
                        font-size: 14px;
                        line-height: 20px;
                        text-align: center;
                      ">
                        Se non hai richiesto questa email, puoi ignorarla in tutta sicurezza.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="
                      padding: 20px 40px;
                      background-color: #f8fafc;
                      border-bottom-left-radius: 8px;
                      border-bottom-right-radius: 8px;
                    ">
                      <p style="
                        margin: 0;
                        color: #a0aec0;
                        font-size: 12px;
                        line-height: 18px;
                        text-align: center;
                      ">
                        © ${new Date().getFullYear()} ARTEXMODA. Tutti i diritti riservati.<br>
                        Questa è un'email automatica, per favore non rispondere.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `
  })
} 
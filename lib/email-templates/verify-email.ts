interface VerifyEmailData {
  name: string
  verificationUrl: string
}

export function verifyEmailTemplate(data: VerifyEmailData) {
  const { name, verificationUrl } = data

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to ARTEXMODA - Verify your account</title>
        <style>
          body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #ffffff; }
          .logo { display: block; margin: 0 auto 30px; max-width: 200px; }
          .title { font-size: 24px; color: #000; text-align: center; margin-bottom: 20px; }
          .highlight { background: #FFE500; padding: 0 5px; }
          .content { color: #666; text-align: center; line-height: 1.6; margin-bottom: 30px; }
          .button {
            display: inline-block;
            background: #000;
            color: #fff;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            color: #999;
            font-size: 12px;
            margin-top: 40px;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
          .disclaimer {
            color: #999;
            font-size: 12px;
            text-align: center;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <img src="https://artexmoda.com/logo.png" alt="ARTEXMODA" class="logo">
          
          <h1 class="title">Welcome to <span class="highlight">ARTEX</span>MODA!</h1>
          
          <p class="content">
            Hello ${name},<br>
            thank you for registering. To start using your account,<br>
            please verify your email address by clicking the button below.
          </p>

          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email</a>
          </div>

          <p class="disclaimer">
            If you didn't request this email, you can safely ignore it.
          </p>

          <div class="footer">
            © ${new Date().getFullYear()} <span class="highlight">ARTEX</span>MODA. All rights reserved.<br>
            This is an automated email, please do not reply.
          </div>
        </div>
      </body>
    </html>
  `

  const text = `
    Welcome to ARTEXMODA!

    Hello ${name},
    
    thank you for registering. To start using your account, please verify your email address by visiting this link:

    ${verificationUrl}

    If you didn't request this email, you can safely ignore it.

    © ${new Date().getFullYear()} ARTEXMODA. All rights reserved.
    This is an automated email, please do not reply.
  `

  return { html, text }
} 
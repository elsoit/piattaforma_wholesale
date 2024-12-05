interface FirstActivationTemplateData {
  nome: string;
  company_name: string;
  email: string;
}

export function firstActivationTemplate(data: FirstActivationTemplateData) {
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/login`

  return {
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Account Activated - ARTEXMODA</title>
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
            .credentials {
              background: #f5f5f5;
              padding: 20px;
              border-radius: 5px;
              margin: 20px 0;
              text-align: left;
            }
            .footer {
              text-align: center;
              color: #999;
              font-size: 12px;
              margin-top: 40px;
              border-top: 1px solid #eee;
              padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <img src="https://artexmoda.com/logo.png" alt="ARTEXMODA" class="logo">
            
            <h1 class="title">Account Activated on <span class="highlight">ARTEX</span>MODA!</h1>
            
            <p class="content">
              Dear ${data.nome},<br>
              we are pleased to inform you that your account for "${data.company_name}" has been activated.<br>
              You can now access the platform using the following credentials:
            </p>

            <div class="credentials">
              <p><strong>Email:</strong> ${data.email}</p>
              <p><strong>Password:</strong> the one you chose during registration</p>
            </div>

            <div style="text-align: center;">
              <a href="${loginUrl}" class="button">Login Now</a>
            </div>

            <div class="footer">
              © ${new Date().getFullYear()} <span class="highlight">ARTEX</span>MODA. All rights reserved.<br>
              This is an automated email, please do not reply.
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Account Activated on ARTEXMODA!

      Dear ${data.nome},

      we are pleased to inform you that your account for "${data.company_name}" has been activated.

      You can now access the platform using:
      - Email: ${data.email}
      - Password: the one you chose during registration

      To login, visit: ${loginUrl}

      © ${new Date().getFullYear()} ARTEXMODA. All rights reserved.
      This is an automated email, please do not reply.
    `
  }
} 
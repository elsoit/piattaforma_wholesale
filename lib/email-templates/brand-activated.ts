interface BrandActivatedTemplateData {
  nome: string;
  company_name: string;
  brand_names: string[];
}

export function brandActivatedTemplate(data: BrandActivatedTemplateData) {
  const brandListHtml = data.brand_names.map(name => `
    <li style="margin-bottom: 20px; background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
      <strong style="font-size: 18px; color: #000; display: block; margin-bottom: 12px;">${name}</strong>
      <div style="display: flex; justify-content: flex-start;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/vetrina/brands/${name}" 
           style="display: inline-block; padding: 8px 16px; background: #000; color: #fff; text-decoration: none; border-radius: 4px; font-size: 14px;">
          View Catalog
        </a>
      </div>
    </li>
  `).join('');

  return {
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>New Brands Activated - ARTEXMODA</title>
          <style>
            body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #ffffff; }
            .logo { display: block; margin: 0 auto 30px; max-width: 200px; }
            .title { font-size: 24px; color: #000; text-align: center; margin-bottom: 20px; }
            .highlight { background: #FFE500; padding: 0 5px; }
            .content { color: #666; line-height: 1.6; margin-bottom: 30px; }
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
            
            <h1 class="title">New Brands Activated on <span class="highlight">ARTEX</span>MODA!</h1>
            
            <div class="content">
              <p>Dear ${data.nome},</p>
              <p>We are pleased to inform you that the following new brands have been activated for your company "${data.company_name}":</p>
              
              <ul style="list-style: none; padding: 0;">
                ${brandListHtml}
              </ul>

              <p>You can immediately access the platform to view the catalogs.</p>
              
              <p>For any questions or assistance, please don't hesitate to contact us.</p>
              
              <p>Best regards,<br>The Team</p>
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
      New Brands Activated on ARTEXMODA!

      Dear ${data.nome},

      We are pleased to inform you that the following new brands have been activated for your company "${data.company_name}":

      ${data.brand_names.map(name => `- ${name}`).join('\n')}

      You can immediately access the platform to view the catalogs:

      ${data.brand_names.map(name => `
      ${name}:
      - Catalog: ${process.env.NEXT_PUBLIC_APP_URL}/vetrina/brands/${name}
      `).join('\n')}

      For any questions or assistance, please don't hesitate to contact us.

      Best regards,
      The Team

      © ${new Date().getFullYear()} ARTEXMODA. All rights reserved.
      This is an automated email, please do not reply.
    `
  }
} 
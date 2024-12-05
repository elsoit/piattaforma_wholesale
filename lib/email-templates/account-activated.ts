interface AccountActivatedTemplateData {
  name: string
  companyName: string
}

export function accountActivatedTemplate(data: AccountActivatedTemplateData) {
  return {
    html: `
      <div>
        <h1>Account Activated</h1>
        <p>Dear ${data.name},</p>
        <p>We are pleased to inform you that your account for "${data.companyName}" has been successfully activated.</p>
        <p>You can now access all platform features.</p>
        <p>Best regards,<br>The Team</p>
      </div>
    `,
    text: `
      Account Activated

      Dear ${data.name},

      We are pleased to inform you that your account for "${data.companyName}" has been successfully activated.
      
      You can now access all platform features.

      Best regards,
      The Team
    `
  }
} 
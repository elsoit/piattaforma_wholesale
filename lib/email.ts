import nodemailer from 'nodemailer'
import { accountActivatedTemplate } from './email-templates/account-activated'
import { firstActivationTemplate } from './email-templates/first-activation'
import { brandActivatedTemplate } from './email-templates/brand-activated'
import { verifyEmailTemplate } from './email-templates/verify-email'
import { catalogPublishedTemplate } from './email-templates/catalog-published'

// Configura il trasporto SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: true
  }
})

// Verifica la connessione all'avvio
transporter.verify(function(error, success) {
  if (error) {
    console.error('❌ [EMAIL] Errore nella configurazione SMTP:', error);
  } else {
    console.log('✅ [EMAIL] Server SMTP pronto per l\'invio');
  }
});

type EmailTemplate = 'account-activated' | 'first-activation' | 'brand-activated' | 'verify-email' | 'catalog-published'

interface SendEmailProps {
  to: string
  subject: string
  template: EmailTemplate
  data: any
}

export async function sendEmail({ to, subject, template, data }: SendEmailProps) {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('📧 [EMAIL] Configurazione SMTP mancante:', {
        to,
        subject,
        template
      })
      return
    }

    let htmlContent = ''
    let textContent = ''

    switch (template) {
      case 'account-activated':
        const activatedTemplate = accountActivatedTemplate(data)
        htmlContent = activatedTemplate.html
        textContent = activatedTemplate.text
        break
      case 'first-activation':
        const firstActivationTemp = firstActivationTemplate(data)
        htmlContent = firstActivationTemp.html
        textContent = firstActivationTemp.text
        break
      case 'brand-activated':
        const brandActivatedTemp = brandActivatedTemplate(data)
        htmlContent = brandActivatedTemp.html
        textContent = brandActivatedTemp.text
        break
      case 'verify-email':
        const verifyEmailTemp = verifyEmailTemplate(data)
        htmlContent = verifyEmailTemp.html
        textContent = verifyEmailTemp.text
        break
      case 'catalog-published':
        const catalogPublishedTemp = catalogPublishedTemplate(data)
        htmlContent = catalogPublishedTemp.html
        textContent = catalogPublishedTemp.text
        break
      default:
        throw new Error('Template non valido')
    }

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to,
      subject,
      html: htmlContent,
      text: textContent
    }

    console.log('📧 [EMAIL] Tentativo di invio email:', {
      to,
      subject,
      template,
      data
    })

    await transporter.sendMail(mailOptions)
    
    console.log('✅ [EMAIL] Email inviata con successo:', {
      to,
      subject,
      template
    })

  } catch (error) {
    console.error('❌ [EMAIL] Errore nell\'invio dell\'email:', error)
    console.warn('❌ [EMAIL] Dettagli email non inviata:', { 
      to, 
      subject, 
      template,
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    })
  }
}

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email/${token}`
  
  await sendEmail({
    to: email,
    subject: 'Verifica il tuo indirizzo email',
    template: 'verify-email',
    data: {
      name,
      verificationUrl
    }
  })
} 
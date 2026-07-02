import 'server-only'

const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || ''
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || ''

/**
 * Send a text message via WhatsApp Cloud API
 */
export async function sendWhatsAppMessage(to: string, text: string): Promise<void> {
  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
    console.log('[WhatsApp] (no credentials) Would send to', to, ':', text.slice(0, 100))
    return
  }

  await fetch(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { body: text.slice(0, 4096) }, // WhatsApp limit
    }),
  })
}

/**
 * Download media (image/voice) from WhatsApp Cloud API
 */
export async function downloadWhatsAppMedia(mediaId: string): Promise<Buffer> {
  // Get media URL
  const urlRes = await fetch(`https://graph.facebook.com/v18.0/${mediaId}`, {
    headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` },
  })
  const urlData = await urlRes.json()
  const mediaUrl = urlData?.url
  if (!mediaUrl) throw new Error('Could not get WhatsApp media URL')

  // Download the media
  const downloadRes = await fetch(mediaUrl, {
    headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` },
  })
  const arrayBuffer = await downloadRes.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Send a template message (required for the first message to a user on WhatsApp)
 */
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  language: string = 'en',
  components?: any[]
): Promise<void> {
  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) return

  await fetch(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: language },
        components,
      },
    }),
  })
}

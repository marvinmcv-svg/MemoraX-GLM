import 'server-only'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''

export interface TelegramMessage {
  chatId: string
  text: string
  photo?: string // file_id of the largest photo
}

export interface TelegramUpdate {
  update_id: number
  message?: {
    message_id: number
    chat: { id: number; type: string }
    text?: string
    photo?: { file_id: string; file_size: number }[]
    voice?: { file_id: string; duration: number }
    from: { id: number; first_name: string; username?: string }
  }
}

/**
 * Send a text message via Telegram Bot API
 */
export async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.log('[Telegram] (no token) Would send to', chatId, ':', text.slice(0, 100))
    return
  }

  // Telegram has a 4096 char limit per message — split if needed
  const chunks = splitMessage(text, 4000)
  for (const chunk of chunks) {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: chunk,
        parse_mode: 'Markdown',
      }),
    })
  }
}

/**
 * Send a photo via Telegram Bot API
 */
export async function sendTelegramPhoto(chatId: string, photoUrl: string, caption?: string): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN) return
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, photo: photoUrl, caption }),
  })
}

/**
 * Download a file from Telegram (for photos/voice notes)
 */
export async function downloadTelegramFile(fileId: string): Promise<Buffer> {
  // Get file path
  const fileRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_id: fileId }),
  })
  const fileData = await fileRes.json()
  const filePath = fileData?.result?.file_path
  if (!filePath) throw new Error('Could not get Telegram file path')

  // Download file
  const downloadRes = await fetch(`https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`)
  const arrayBuffer = await downloadRes.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Set the webhook URL for the Telegram bot
 */
export async function setTelegramWebhook(url: string): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN) return
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
}

/**
 * Get bot info (for displaying the bot username in the UI)
 */
export async function getTelegramBotInfo(): Promise<{ username?: string; first_name?: string } | null> {
  if (!TELEGRAM_BOT_TOKEN) return null
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`)
    const data = await res.json()
    return data?.result ?? null
  } catch {
    return null
  }
}

function splitMessage(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) return [text]
  const chunks: string[] = []
  let remaining = text
  while (remaining.length > maxLength) {
    // Try to split at a paragraph boundary
    let splitIndex = remaining.lastIndexOf('\n\n', maxLength)
    if (splitIndex < maxLength * 0.5) splitIndex = remaining.lastIndexOf('\n', maxLength)
    if (splitIndex < maxLength * 0.5) splitIndex = maxLength
    chunks.push(remaining.slice(0, splitIndex))
    remaining = remaining.slice(splitIndex).trimStart()
  }
  if (remaining) chunks.push(remaining)
  return chunks
}

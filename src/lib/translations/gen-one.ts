// Batched single-language translator — splits into chunks to avoid truncation
// Run: bun run src/lib/translations/gen-one.ts <langCode>
import ZAI from 'z-ai-web-dev-sdk'
import { en } from './en'
import { enExtra } from './en-extra'
import * as fs from 'fs'
import * as path from 'path'

// Merge base + extra for the full source dictionary
const enAll = { ...en, ...enExtra }

const LANG_MAP: Record<string, { name: string; instruction: string }> = {
  es: { name: 'Spanish', instruction: 'Translate to Spanish (es). Use informal "tú" form.' },
  fr: { name: 'French', instruction: 'Translate to French (fr). Use informal "tu" form.' },
  de: { name: 'German', instruction: 'Translate to German (de). Use informal "du" form.' },
  zh: { name: 'Mandarin Chinese', instruction: 'Translate to Simplified Mandarin Chinese (zh).' },
  ja: { name: 'Japanese', instruction: 'Translate to Japanese (ja). Use です/ます form.' },
  it: { name: 'Italian', instruction: 'Translate to Italian (it). Use informal "tu" form.' },
  hi: { name: 'Hindi', instruction: 'Translate to Hindi (hi) in Devanagari script.' },
}

const langCode = process.argv[2]
if (!langCode || !LANG_MAP[langCode]) {
  console.error('Usage: bun run gen-one.ts <es|fr|de|zh|ja|it|hi>')
  process.exit(1)
}

const lang = LANG_MAP[langCode]
const allEntries = Object.entries(enAll)
const BATCH_SIZE = 50

async function translateBatch(zai: any, entries: [string, string][]): Promise<Record<string, string>> {
  const inputJson = JSON.stringify(Object.fromEntries(entries), null, 2)
  const prompt = `Translate these English UI strings to ${lang.name}. Return STRICT JSON only — same keys, translated values.

Rules: Keep "MemoraX", "memorae", "Google Classroom", "WhatsApp" untranslated. Keep emoji, math notation, and {placeholders} as-is. ${lang.instruction}

${inputJson}`

  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'system', content: 'You are a professional UI translator. Return valid JSON only, no markdown.' },
      { role: 'user', content: prompt },
    ],
    thinking: { type: 'disabled' },
  } as any)

  const raw = completion?.choices?.[0]?.message?.content ?? ''
  // strip markdown fences if present
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```/g, '').trim()
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON in response')
  return JSON.parse(match[0])
}

async function main() {
  console.log(`Translating to ${lang.name} (${langCode}) — ${allEntries.length} keys in ${Math.ceil(allEntries.length / BATCH_SIZE)} batches...`)
  const zai = await ZAI.create()
  const result: Record<string, string> = {}

  for (let i = 0; i < allEntries.length; i += BATCH_SIZE) {
    const batch = allEntries.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(allEntries.length / BATCH_SIZE)
    console.log(`  Batch ${batchNum}/${totalBatches} (${batch.length} keys)...`)
    try {
      const translated = await translateBatch(zai, batch)
      Object.assign(result, translated)
      console.log(`    ✓ Got ${Object.keys(translated).length} keys`)
    } catch (e: any) {
      console.error(`    ✗ Batch ${batchNum} failed: ${e?.message}`)
      // fallback: use English for this batch
      for (const [k, v] of batch) result[k] = v
    }
  }

  // fill any missing with English
  for (const [k, v] of allEntries) {
    if (!(k in result)) result[k] = v
  }

  const outDir = path.join(process.cwd(), 'src/lib/translations')
  const outFile = path.join(outDir, `${langCode}.ts`)
  const fileContent = `// ${lang.name} — auto-generated\n\nexport const ${langCode} = ${JSON.stringify(result, null, 2)} as const\n`
  fs.writeFileSync(outFile, fileContent, 'utf-8')
  console.log(`✓ Written ${langCode}.ts (${Object.keys(result).length} keys)`)
}

main().catch((e) => { console.error(e); process.exit(1) })

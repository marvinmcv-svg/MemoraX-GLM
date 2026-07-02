// Fill-missing translator — only translates keys whose values are still in English
// Run: bun run src/lib/translations/fill-missing.ts <langCode>
import ZAI from 'z-ai-web-dev-sdk'
import { en } from './en'
import { enExtra } from './en-extra'
import * as fs from 'fs'
import * as path from 'path'

const enAll: Record<string, string> = { ...en, ...enExtra }

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
  console.error('Usage: bun run fill-missing.ts <es|fr|de|zh|ja|it|hi>')
  process.exit(1)
}

const lang = LANG_MAP[langCode]

async function main() {
  const langPath = path.join(process.cwd(), `src/lib/translations/${langCode}.ts`)
  const langContent = fs.readFileSync(langPath, 'utf-8')
  // extract the JSON object from the TS file
  const match = langContent.match(/export const \w+ = (\{[\s\S]*\}) as const/)
  if (!match) {
    console.error('Could not parse language file')
    process.exit(1)
  }
  const langDict: Record<string, string> = JSON.parse(match[1])

  // find keys where the value is identical to English (untranslated)
  const missing: [string, string][] = []
  for (const [key, enVal] of Object.entries(enAll)) {
    if (langDict[key] === enVal || !langDict[key]) {
      missing.push([key, enVal])
    }
  }

  console.log(`Found ${missing.length} untranslated keys for ${lang.name}`)
  if (missing.length === 0) {
    console.log('Nothing to do!')
    return
  }

  const zai = await ZAI.create()
  const BATCH = 30

  for (let i = 0; i < missing.length; i += BATCH) {
    const batch = missing.slice(i, i + BATCH)
    const batchNum = Math.floor(i / BATCH) + 1
    const totalBatches = Math.ceil(missing.length / BATCH)
    console.log(`  Batch ${batchNum}/${totalBatches} (${batch.length} keys)...`)

    const inputJson = JSON.stringify(Object.fromEntries(batch), null, 2)
    const prompt = `Translate these English UI strings to ${lang.name}. Return STRICT JSON only — same keys, translated values.

Rules: Keep "MemoraX", "memorae", "Google Classroom", "WhatsApp" untranslated. Keep emoji, math notation, and {placeholders} as-is. ${lang.instruction}

${inputJson}`

    try {
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are a professional UI translator. Return valid JSON only, no markdown.' },
          { role: 'user', content: prompt },
        ],
        thinking: { type: 'disabled' },
      } as any)

      const raw = completion?.choices?.[0]?.message?.content ?? ''
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```/g, '').trim()
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const translated = JSON.parse(jsonMatch[0])
        for (const [key] of batch) {
          if (translated[key]) langDict[key] = translated[key]
        }
        console.log(`    ✓ Got ${Object.keys(translated).length} keys`)
        // Save progress after each batch
        const fileContent = `// ${lang.name} — auto-generated\n\nexport const ${langCode} = ${JSON.stringify(langDict, null, 2)} as const\n`
        fs.writeFileSync(langPath, fileContent, 'utf-8')
      }
    } catch (e: any) {
      console.error(`    ✗ Batch ${batchNum} failed: ${e?.message}`)
      // wait longer on rate limit
      if (e?.message?.includes('429')) {
        console.log('    Rate limited, waiting 30s...')
        await new Promise((r) => setTimeout(r, 30000))
      }
      // Save progress even on failure
      const fileContent = `// ${lang.name} — auto-generated\n\nexport const ${langCode} = ${JSON.stringify(langDict, null, 2)} as const\n`
      fs.writeFileSync(langPath, fileContent, 'utf-8')
    }
    // small delay between batches
    await new Promise((r) => setTimeout(r, 2000))
  }

  // write back
  const fileContent = `// ${lang.name} — auto-generated\n\nexport const ${langCode} = ${JSON.stringify(langDict, null, 2)} as const\n`
  fs.writeFileSync(langPath, fileContent, 'utf-8')
  console.log(`✓ Updated ${langCode}.ts (${Object.keys(langDict).length} total keys)`)
}

main().catch((e) => { console.error(e); process.exit(1) })

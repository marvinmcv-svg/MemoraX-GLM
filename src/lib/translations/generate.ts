// Translation generator — uses z-ai SDK to translate the English dictionary
// Run: node --experimental-strip-types src/lib/translations/generate.ts
// (or bun run src/lib/translations/generate.ts)

import ZAI from 'z-ai-web-dev-sdk'
import { en } from './en.js'
import * as fs from 'fs'
import * as path from 'path'

const LANGS = [
  { code: 'es', name: 'Spanish', native: 'Español', instruction: 'Translate to Spanish (es). Use informal "tú" form for student-facing UI.' },
  { code: 'fr', name: 'French', native: 'Français', instruction: 'Translate to French (fr). Use informal "tu" form for student-facing UI.' },
  { code: 'de', name: 'German', native: 'Deutsch', instruction: 'Translate to German (de). Use informal "du" form for student-facing UI.' },
  { code: 'zh', name: 'Mandarin Chinese', native: '中文', instruction: 'Translate to Simplified Mandarin Chinese (zh).' },
  { code: 'ja', name: 'Japanese', native: '日本語', instruction: 'Translate to Japanese (ja). Use polite but friendly tone (です/ます form).' },
  { code: 'it', name: 'Italian', native: 'Italiano', instruction: 'Translate to Italian (it). Use informal "tu" form for student-facing UI.' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', instruction: 'Translate to Hindi (hi) in Devanagari script.' },
]

async function main() {
  const zai = await ZAI.create()
  const enEntries = Object.entries(en)
  const enJson = JSON.stringify(en, null, 2)

  for (const lang of LANGS) {
    console.log(`\n🌐 Translating to ${lang.name} (${lang.code})...`)
    const prompt = `You are a professional UI translator. ${lang.instruction}

Translate ALL the following English UI strings to ${lang.name}. Return STRICT JSON only (no markdown fences, no commentary) with the EXACT same keys, only the values translated.

Rules:
- Keep brand name "MemoraX" and "memorae" untranslated
- Keep "Google Classroom" untranslated (it's a product name)
- Keep "WhatsApp" untranslated
- Keep math notation (ax² + bx + c = 0, b² - 4ac) untranslated
- Keep emoji as-is
- Keep placeholders like {name}, {p1}, {p2}, {kids}, {n}, {correct}, {xp} EXACTLY as-is
- Keep the ≤ and → symbols as-is
- Translate naturally — don't be overly literal

English strings to translate:
${enJson}`

    try {
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are a professional UI/UX translator. Return valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        thinking: { type: 'disabled' },
      } as any)

      const raw = completion?.choices?.[0]?.message?.content ?? ''
      // extract JSON
      const match = raw.match(/\{[\s\S]*\}/)
      if (!match) {
        console.error(`  ✗ No JSON found for ${lang.code}`)
        continue
      }
      const translated = JSON.parse(match[0])

      // verify all keys present
      const missing = enEntries.filter(([k]) => !(k in translated))
      if (missing.length > 0) {
        console.warn(`  ⚠ ${missing.length} missing keys, filling with English`)
        for (const [k, v] of missing) translated[k] = v
      }

      // write the file
      const outDir = path.dirname(new URL(import.meta.url).pathname)
      const outFile = path.join(outDir, `${lang.code}.ts`)
      const fileContent = `// ${lang.name} (${lang.nativeName}) — auto-generated\n\nexport const ${lang.code} = ${JSON.stringify(translated, null, 2)} as const\n`
      fs.writeFileSync(outFile, fileContent, 'utf-8')
      console.log(`  ✓ Written ${outFile} (${Object.keys(translated).length} keys)`)
    } catch (e: any) {
      console.error(`  ✗ Error for ${lang.code}: ${e?.message ?? e}`)
    }
  }
  console.log('\n✅ All translations complete.')
}

main().catch(console.error)

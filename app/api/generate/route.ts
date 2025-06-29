import { NextRequest, NextResponse } from 'next/server'
import { getModel } from '@/lib/tts'
import fs from 'fs/promises'
import path from 'path'

export async function POST(req: NextRequest) {
  try {
    const { text, voice = 'am_adam', speed = 1 } = await req.json()
    if (!text) {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 })
    }
    const tts = await getModel()
    const parts = text
      .split(/\s*---\s*/)
      .map(t => t.trim())
      .filter(Boolean)

    const audioBuffers: string[] = []
    for (let i = 0; i < parts.length; i++) {
      const audio = await tts.generate(parts[i], { voice, speed })
      const outPath = path.join(process.cwd(), `audio_${i}.wav`)
      await audio.save(outPath)
      const buf = await fs.readFile(outPath)
      await fs.unlink(outPath)
      audioBuffers.push(buf.toString('base64'))
    }

    return NextResponse.json({ audios: audioBuffers })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to generate audio' }, { status: 500 })
  }
}

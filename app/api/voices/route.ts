import { NextResponse } from 'next/server'
import { getModel } from '@/lib/tts'

export async function GET() {
  try {
    const tts = await getModel()
    return NextResponse.json({ voices: Object.keys(tts.voices) })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to list voices' }, { status: 500 })
  }
}

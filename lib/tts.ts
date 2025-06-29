import { KokoroTTS } from 'kokoro-js'
import fs from 'fs/promises'
import path from 'path'

const MODEL_ID = 'onnx-community/Kokoro-82M-ONNX'
let ttsPromise: Promise<any> | null = null

export async function getModel() {
  if (!ttsPromise) {
    await ensureVoices()
    ttsPromise = KokoroTTS.from_pretrained(MODEL_ID, { dtype: 'q8' })
  }
  return ttsPromise
}

async function ensureVoices() {
  try {
    const distPath = path.dirname(require.resolve('kokoro-js/dist/kokoro.js'))
    const distVoices = path.join(distPath, 'voices')
    const rootVoices = path.resolve(distPath, '../voices')
    await fs.access(distVoices).catch(async () => {
      try {
        await fs.mkdir(distVoices, { recursive: true })
        const files = await fs.readdir(rootVoices)
        await Promise.all(
          files.map((f) =>
            fs.copyFile(path.join(rootVoices, f), path.join(distVoices, f))
          )
        )
      } catch (err) {
        console.warn('Failed to prepare voices directory', err)
      }
    })
  } catch (err) {
    console.warn('Unable to locate kokoro-js voices', err)
  }
}

import { KokoroTTS } from 'kokoro-js'

const MODEL_ID = 'onnx-community/Kokoro-82M-ONNX'
let ttsPromise: Promise<any> | null = null

export async function getModel() {
  if (!ttsPromise) {
    ttsPromise = KokoroTTS.from_pretrained(MODEL_ID, { dtype: 'q8' })
  }
  return ttsPromise
}

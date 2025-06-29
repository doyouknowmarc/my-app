import express from 'express';
import next from 'next';
import { KokoroTTS } from 'kokoro-js';
import path from 'path';
import fs from 'fs/promises';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

const app = express();
app.use(express.json());

const MODEL_DIR = path.resolve(process.cwd(), 'models');
let ttsPromise = null;
async function getModel() {
  if (!ttsPromise) {
    await ensureVoices();
    ttsPromise = KokoroTTS.from_pretrained(MODEL_DIR, { dtype: 'q8' });
  }
  return ttsPromise;
}

async function ensureVoices() {
  try {
    const distPath = path.dirname(require.resolve('kokoro-js'));
    const distVoices = path.join(distPath, 'voices');
    const rootVoices = path.resolve(process.cwd(), 'voices');
    await fs.access(distVoices).catch(async () => {
      try {
        await fs.mkdir(distVoices, { recursive: true });
        const files = await fs.readdir(rootVoices);
        await Promise.all(
          files.map((f) => fs.copyFile(path.join(rootVoices, f), path.join(distVoices, f)))
        );
      } catch (err) {
        console.warn('Failed to prepare voices directory', err);
      }
    });
  } catch (err) {
    console.warn('Unable to locate kokoro-js voices', err);
  }
}

app.get('/api/voices', async (req, res) => {
  try {
    const tts = await getModel();
    res.json({ voices: Object.keys(tts.voices) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list voices' });
  }
});

app.post('/api/generate', async (req, res) => {
  const { text, voice = 'am_adam', speed = 1 } = req.body || {};
  if (!text) {
    return res.status(400).json({ error: 'Missing text' });
  }
  try {
    const tts = await getModel();
    const parts = text.split(/\s*---\s*/).map((t) => t.trim()).filter(Boolean);
    const audioBuffers = [];
    for (let i = 0; i < parts.length; i++) {
      const audio = await tts.generate(parts[i], { voice, speed });
      const outPath = path.join(process.cwd(), `audio_${i}.wav`);
      await audio.save(outPath);
      const buf = await fs.readFile(outPath);
      await fs.unlink(outPath);
      audioBuffers.push(buf.toString('base64'));
    }
    res.json({ audios: audioBuffers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate audio' });
  }
});

nextApp.prepare().then(() => {
  app.all('*', (req, res) => handle(req, res));
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
});

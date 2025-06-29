"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Download } from "lucide-react"

export default function Component() {
  const [voices, setVoices] = useState<string[]>([])
  const [selectedVoice, setSelectedVoice] = useState("")
  const [speed, setSpeed] = useState([1.0])
  const [text, setText] = useState("")
  const [audioUrls, setAudioUrls] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [pause, setPause] = useState("1")
  const [combinedUrl, setCombinedUrl] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/voices")
      .then((r) => r.json())
      .then((d) => {
        setVoices(d.voices || [])
        if (d.voices && d.voices.length) {
          setSelectedVoice(d.voices[0])
        }
      })
      .catch((err) => console.error(err))
  }, [])

  const handleGenerate = async () => {
    if (!text.trim()) return
    setIsGenerating(true)
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voice: selectedVoice,
          speed: speed[0],
        }),
      })
      if (!res.ok) throw new Error("Failed to generate")
      const data = await res.json()
      const urls = await Promise.all(
        (data.audios || []).map(async (b64: string) => {
          const resp = await fetch(`data:audio/wav;base64,${b64}`)
          const blob = await resp.blob()
          return URL.createObjectURL(blob)
        })
      )
      setAudioUrls(urls)
    } catch (err) {
      console.error(err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCombine = async () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const buffers = await Promise.all(
        audioUrls.map(async (url) => {
          const res = await fetch(url)
          const arr = await res.arrayBuffer()
          return await ctx.decodeAudioData(arr)
        })
      )
      if (!buffers.length) return
      const sampleRate = buffers[0].sampleRate
      const numChannels = buffers[0].numberOfChannels
      const pauseSamples = Math.floor(parseFloat(pause) * sampleRate)
      const totalLength = buffers.reduce(
        (sum, b, i) => sum + b.length + (i < buffers.length - 1 ? pauseSamples : 0),
        0
      )
      const output = ctx.createBuffer(numChannels, totalLength, sampleRate)
      let offset = 0
      buffers.forEach((b, idx) => {
        for (let ch = 0; ch < numChannels; ch++) {
          output.getChannelData(ch).set(b.getChannelData(ch), offset)
        }
        offset += b.length
        if (idx < buffers.length - 1) {
          offset += pauseSamples
        }
      })

      const wavBlob = audioBufferToWav(output)
      const url = URL.createObjectURL(wavBlob)
      setCombinedUrl(url)
    } catch (err) {
      console.error(err)
    }
  }

  function audioBufferToWav(buffer: AudioBuffer) {
    const numChannels = buffer.numberOfChannels
    const sampleRate = buffer.sampleRate
    const bitDepth = 16
    const bytesPerSample = bitDepth / 8
    const blockAlign = numChannels * bytesPerSample
    const byteRate = sampleRate * blockAlign
    const dataLength = buffer.length * blockAlign
    const bufferLength = 44 + dataLength
    const arrayBuffer = new ArrayBuffer(bufferLength)
    const view = new DataView(arrayBuffer)

    let offset = 0
    const writeString = (s: string) => {
      for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i))
      offset += s.length
    }
    const writeUint16 = (d: number) => {
      view.setUint16(offset, d, true)
      offset += 2
    }
    const writeUint32 = (d: number) => {
      view.setUint32(offset, d, true)
      offset += 4
    }

    writeString('RIFF')
    writeUint32(bufferLength - 8)
    writeString('WAVE')
    writeString('fmt ')
    writeUint32(16)
    writeUint16(1)
    writeUint16(numChannels)
    writeUint32(sampleRate)
    writeUint32(byteRate)
    writeUint16(blockAlign)
    writeUint16(bitDepth)
    writeString('data')
    writeUint32(dataLength)

    const interleaved = new Float32Array(buffer.length * numChannels)
    for (let i = 0; i < buffer.length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        interleaved[i * numChannels + ch] = buffer.getChannelData(ch)[i]
      }
    }

    let index = 44
    for (let i = 0; i < interleaved.length; i++, index += 2) {
      const s = Math.max(-1, Math.min(1, interleaved[i]))
      view.setInt16(index, s < 0 ? s * 0x8000 : s * 0x7fff, true)
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' })
  }

  const wordCount =
    text
      .trim()
      .replace(/---/g, "") // Remove breaks before counting words
      .split(/\s+/)
      .filter((word) => word.length > 0).length || 0

  const breakCount = (text.match(/---/g) || []).length
  const hasAudio = audioUrls.length > 0

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <h1 className="text-lg font-medium text-gray-900">Text to Speech</h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="space-y-8">
          {/* Text Input - Much Larger and Central */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-medium text-gray-900">Your Text</Label>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>{wordCount} words</span>
                {breakCount > 0 && <span>{breakCount} breaks</span>}
              </div>
            </div>
            <Textarea
              placeholder="Start typing or paste your text here. This is where your content will be transformed into natural-sounding speech..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[400px] text-base leading-relaxed resize-y border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:ring-0"
            />
          </div>

          {/* Controls and Generate Button */}
          <div className="flex justify-end items-center gap-6 pt-4">
            {/* Voice Selection */}
            <div className="flex items-center gap-2">
              <Label className="text-sm text-gray-500">Voice</Label>
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger className="h-10 w-32 border-gray-200 bg-white text-gray-900 text-sm focus:border-gray-900 focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-gray-200 bg-white">
                  {voices.map((voice) => (
                    <SelectItem key={voice} value={voice} className="text-gray-900 focus:bg-gray-50 text-sm">
                      {voice}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Speed Control */}
            <div className="flex items-center gap-2">
              <Label className="text-sm text-gray-500">Speed</Label>
              <div className="flex items-center gap-2">
                <Slider value={speed} onValueChange={setSpeed} max={2} min={0.25} step={0.25} className="w-20" />
                <span className="text-sm text-gray-500 w-8">{speed[0]}x</span>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!text.trim() || isGenerating}
              className="h-12 px-8 text-base bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-500"
            >
              {isGenerating ? (
                <>
                  <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="mr-3 h-5 w-5" />
                  Generate Speech
                </>
              )}
            </Button>
          </div>

          {/* Downloads Panel */}
          {hasAudio && (
            <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Downloads</h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-gray-500 hover:text-gray-900 bg-transparent"
                  onClick={() => setAudioUrls([])}
                >
                  Clear
                </Button>
              </div>

              {/* File List */}
              <div className="space-y-2">
                {audioUrls.map((url, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200">
                    <audio controls src={url} className="mr-4 h-10" />
                    <a href={url} download={`speech_${idx + 1}.wav`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                ))}
                {combinedUrl && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200">
                    <audio controls src={combinedUrl} className="mr-4 h-10" />
                    <a href={combinedUrl} download="combined.wav">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <div></div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-gray-500">Pause</Label>
                    <Select value={pause} onValueChange={setPause}>
                      <SelectTrigger className="h-8 w-16 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0s</SelectItem>
                        <SelectItem value="0.5">0.5s</SelectItem>
                        <SelectItem value="1">1s</SelectItem>
                        <SelectItem value="2">2s</SelectItem>
                        <SelectItem value="3">3s</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" className="text-sm bg-transparent" onClick={handleCombine}>
                    Combine
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

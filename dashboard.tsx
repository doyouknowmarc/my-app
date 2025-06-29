"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Download } from "lucide-react"

const voices = [
  { id: "alloy", name: "Alloy", type: "Neutral" },
  { id: "echo", name: "Echo", type: "Male" },
  { id: "fable", name: "Fable", type: "Female" },
  { id: "onyx", name: "Onyx", type: "Deep" },
  { id: "nova", name: "Nova", type: "Warm" },
  { id: "shimmer", name: "Shimmer", type: "Soft" },
]

export default function Component() {
  const [selectedVoice, setSelectedVoice] = useState("alloy")
  const [speed, setSpeed] = useState([1.0])
  const [text, setText] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [hasAudio, setHasAudio] = useState(false)

  const handleGenerate = async () => {
    if (!text.trim()) return
    setIsGenerating(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsGenerating(false)
    setHasAudio(true)
  }

  const wordCount =
    text
      .trim()
      .replace(/---/g, "") // Remove breaks before counting words
      .split(/\s+/)
      .filter((word) => word.length > 0).length || 0

  const breakCount = (text.match(/---/g) || []).length

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100"></div>

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
                    <SelectItem key={voice.id} value={voice.id} className="text-gray-900 focus:bg-gray-50 text-sm">
                      {voice.name}
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
              className="h-12 px-8 text-base bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500"
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
                  className="text-gray-500 hover:text-gray-700 bg-transparent"
                  onClick={() => setHasAudio(false)}
                >
                  Clear
                </Button>
              </div>

              {/* File List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900">speech_output_1.mp3</span>
                    <span className="text-xs text-gray-500">2.3 MB</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <Button variant="outline" className="text-sm bg-transparent">
                  <Download className="mr-2 h-4 w-4" />
                  Download All
                </Button>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-gray-500">Pause</Label>
                    <Select defaultValue="1">
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
                  <Button variant="outline" className="text-sm bg-transparent">
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

"use client"
import { useState } from "react"
import { Sun, Moon, Volume2 } from "lucide-react"

export default function Settings({ dayMode, setDayMode, sound, setSound }) {
  const sounds = ["crying", "robot"]

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "20px auto",
        background: "rgba(255, 255, 255, 0.85)",
        borderRadius: "20px",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
        padding: 24,
        fontFamily: "sans-serif",
        color: "#333",
      }}
    >
      {/* Mode Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm font-medium flex items-center gap-2 text-gray-700">
          {dayMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-blue-500" />}
          <span>{dayMode ? "Currently in Day Mode" : "Currently in Night Mode"}</span>
        </div>
        <button
          onClick={() => setDayMode(!dayMode)}
          className="px-4 py-2 rounded-md bg-indigo-500 text-white text-sm font-semibold shadow hover:bg-indigo-600 transition"
        >
          {dayMode ? "Switch to Night" : "Switch to Day"}
        </button>
      </div>

      {/* Sound Selection */}
      <div>
        <label className="block mb-2 text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Volume2 className="w-4 h-4" /> Rabbitio Sound
        </label>
        <select
          value={sound}
          onChange={(e) => setSound(e.target.value)}
          className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          {sounds.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

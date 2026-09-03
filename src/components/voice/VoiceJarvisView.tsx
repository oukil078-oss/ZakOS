import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Sparkles, 
  Cpu, 
  Zap, 
  Radio, 
  Terminal, 
  Bot, 
  ShieldAlert, 
  Sliders,
  Play,
  Layers
} from 'lucide-react';

export const VoiceJarvisView: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [voiceVolume, setVoiceVolume] = useState<number[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('jarvis-neural-male');
  const [wakeWordEnabled, setWakeWordEnabled] = useState(true);

  // Generate dynamic audio waveform bars
  useEffect(() => {
    const bars = Array.from({ length: 28 }, () => Math.floor(Math.random() * 60) + 15);
    setVoiceVolume(bars);

    const interval = setInterval(() => {
      if (isListening) {
        setVoiceVolume(Array.from({ length: 28 }, () => Math.floor(Math.random() * 85) + 15));
      } else {
        setVoiceVolume(Array.from({ length: 28 }, () => Math.floor(Math.random() * 20) + 10));
      }
    }, 120);

    return () => clearInterval(interval);
  }, [isListening]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 animate-fadeIn">
      {/* Header Badge */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white/5 dark:bg-[#12151B]/80 border border-black/[0.06] dark:border-white/[0.08] p-6 rounded-3xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#D4FF00] text-black">
              NEURAL VOCAL CORE
            </span>
            <span className="text-xs text-[#D4FF00] font-mono font-bold animate-pulse">● COMING SOON</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <Mic className="w-6 h-6 text-[#D4FF00]" />
            Jarvis Autonomous Voice Engine (STT & TTS)
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Full duplex real-time speech-to-text, wake-word activation, and neural voice synthesis powered by local Whisper and Piper TTS.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-[#D4FF00]/20 text-[#D4FF00] border border-[#D4FF00]/40">
            Roadmap Tier: Q4 2026
          </span>
        </div>
      </div>

      {/* Holographic Voice Orb & Waveform Center Card */}
      <div className="relative bg-white dark:bg-[#181B22] border border-black/[0.08] dark:border-white/[0.08] p-10 rounded-3xl shadow-2xl flex flex-col items-center justify-center text-center overflow-hidden min-h-[420px]">
        {/* Background Ambient Glow */}
        <div className="absolute inset-0 bg-radial-vignette opacity-70 pointer-events-none" />
        <div className="absolute w-96 h-96 rounded-full bg-[#D4FF00]/10 blur-3xl pointer-events-none animate-pulse" />

        {/* Central Hologram Orb / Mic */}
        <div className="relative z-10 mb-8">
          <button
            onClick={() => setIsListening(!isListening)}
            className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500 relative group focus:outline-none ${
              isListening
                ? 'bg-[#D4FF00] text-black shadow-[0_0_60px_rgba(212,255,0,0.6)] scale-110'
                : 'bg-black/10 dark:bg-white/5 border-2 border-black/20 dark:border-white/20 text-gray-400 hover:text-white hover:border-[#D4FF00]'
            }`}
          >
            {isListening ? (
              <Mic className="w-12 h-12 animate-pulse text-black" />
            ) : (
              <MicOff className="w-10 h-10" />
            )}
            
            {/* Ping Rings */}
            {isListening && (
              <>
                <span className="absolute inset-0 rounded-full border-2 border-[#D4FF00] animate-ping opacity-75" />
                <span className="absolute -inset-4 rounded-full border border-[#D4FF00]/40 animate-pulse" />
              </>
            )}
          </button>
        </div>

        {/* Real-time Dynamic Audio Waveform Visualizer */}
        <div className="relative z-10 w-full max-w-xl flex items-center justify-center gap-1.5 h-20 mb-6 px-4">
          {voiceVolume.map((vol, i) => (
            <div
              key={i}
              className={`w-2 rounded-full transition-all duration-100 ${
                isListening 
                  ? 'bg-[#D4FF00] shadow-[0_0_10px_rgba(212,255,0,0.5)]' 
                  : 'bg-black/15 dark:bg-white/15'
              }`}
              style={{ height: `${vol}%` }}
            />
          ))}
        </div>

        {/* Status Text & Interactive Simulator */}
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-mono">
            <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-[#D4FF00] animate-ping' : 'bg-gray-400'}`} />
            <span className="text-gray-900 dark:text-white font-bold">
              {isListening ? 'Voice Channel Active — Listening to "Hey Jarvis..."' : 'Voice Assistant Idle — Click Orb to Test Visualizer'}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Try saying: <span className="text-gray-800 dark:text-gray-200 font-mono font-semibold">"Jarvis, run nmap scan on target 10.10.10.50"</span> or <span className="text-gray-800 dark:text-gray-200 font-mono font-semibold">"Summarize today's eJPT notes"</span>
          </p>
        </div>
      </div>

      {/* Feature Architecture Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-[#181B22] border border-black/[0.07] dark:border-white/[0.08] p-5 rounded-3xl shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-[#D4FF00]/20 flex items-center justify-center text-black dark:text-[#D4FF00] mb-3">
            <Radio className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-gray-900 dark:text-white">Local Whisper STT</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Zero-latency, private, on-device audio transcription utilizing lightweight Whisper.cpp with local CUDA acceleration.
          </p>
        </div>

        <div className="bg-white dark:bg-[#181B22] border border-black/[0.07] dark:border-white/[0.08] p-5 rounded-3xl shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-[#D4FF00]/20 flex items-center justify-center text-black dark:text-[#D4FF00] mb-3">
            <Volume2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-gray-900 dark:text-white">Neural Voice Synthesis (TTS)</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Natural-sounding, ultra-responsive speech generation with customizable voice profiles (British Butler, Tactical Cyber, Studio).
          </p>
        </div>

        <div className="bg-white dark:bg-[#181B22] border border-black/[0.07] dark:border-white/[0.08] p-5 rounded-3xl shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-[#D4FF00]/20 flex items-center justify-center text-black dark:text-[#D4FF00] mb-3">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-gray-900 dark:text-white">Always-On Wake Word</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Continuous background listening engine for <span className="font-mono text-[#D4FF00]">"Hey Jarvis"</span> or custom hotwords without cloud telemetry.
          </p>
        </div>
      </div>
    </div>
  );
};

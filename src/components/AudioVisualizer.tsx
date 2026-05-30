import { motion } from "motion/react";
import { Mic } from "lucide-react";

interface AudioVisualizerProps {
  isListening: boolean;
  onStart: () => void;
  disabled?: boolean;
}

export default function AudioVisualizer({ isListening, onStart, disabled }: AudioVisualizerProps) {
  if (!isListening) {
    return (
      <div className="flex flex-col items-center justify-center p-2" id="visualizer-idle">
        {/* Sleek standby indicator orb */}
        <button
          onClick={onStart}
          disabled={disabled}
          className="relative w-28 h-28 rounded-full border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 flex items-center justify-center cursor-pointer transition-all active:scale-95 group focus:outline-none"
          title="Klik untuk Mulai Bicara"
        >
          <div className="w-16 h-16 rounded-full bg-[#15171e] border border-white/8 flex items-center justify-center text-slate-400 group-hover:text-[#00f2ff] group-hover:border-[#00f2ff]/50 shadow-inner transition-colors">
            <Mic className="w-6 h-6 transition-transform group-hover:scale-110" />
          </div>
        </button>
        <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mt-3">CLIK TO COMMUNICATE</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-2 relative animate-fade-in" id="visualizer-active">
      {/* Concentric voice waveforms */}
      <div className="relative w-28 h-28 flex items-center justify-center">
        {/* Pulsating outer circle */}
        <motion.div
          className="absolute inset-0 rounded-full border border-[#00f2ff]/30"
          initial={{ scale: 0.9, opacity: 0.8 }}
          animate={{ scale: 1.4, opacity: 0 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
        />
        {/* Pulsating mid circle */}
        <motion.div
          className="absolute inset-2 rounded-full border border-[#00f2ff]/50"
          initial={{ scale: 0.9, opacity: 0.9 }}
          animate={{ scale: 1.25, opacity: 0 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
        />
        {/* Pulsating inner circle */}
        <motion.div
          className="absolute inset-4 rounded-full border border-[#00f2ff]/70"
          initial={{ scale: 0.9, opacity: 1 }}
          animate={{ scale: 1.15, opacity: 0 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut", delay: 0.8 }}
        />

        {/* Core Glowing Orb */}
        <div className="relative w-16 h-16 rounded-full bg-[#00f2ff]/10 border border-[#00f2ff] flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.3),inset_0_0_10px_rgba(0,242,255,0.2)] animate-pulse">
          <Mic className="w-6 h-6 text-[#00f2ff]" />
        </div>
      </div>
      
      <span className="text-[10px] text-[#00f2ff] font-mono tracking-widest uppercase mt-3 animate-pulse" style={{ textShadow: "0 0 8px rgba(0,242,255,0.4)" }}>
        LISTENING... SAY SOMETHING
      </span>
    </div>
  );
}

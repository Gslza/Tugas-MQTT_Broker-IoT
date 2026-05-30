import { motion } from "motion/react";
import { Thermometer, Droplets } from "lucide-react";

interface SensorGaugeProps {
  type: "suhu" | "kelembapan";
  value: number;
}

export default function SensorGauge({ type, value }: SensorGaugeProps) {
  const isSuhu = type === "suhu";
  
  // Normalize value to a percentage for the radial gauge
  const maxVal = isSuhu ? 50 : 100; // max 50°C for temperature, 100% for humidity
  const clampedValue = Math.max(0, Math.min(value, maxVal));
  const percentage = (clampedValue / maxVal) * 100;

  // Circular progress specs
  const strokeWidth = 8;
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Alerts based on metrics
  const getSubtext = () => {
    if (isSuhu) {
      if (value >= 35) return { text: "Terlalu Panas", color: "text-rose-400" };
      if (value <= 20) return { text: "Suhu Dingin", color: "text-blue-400" };
      return { text: "Suhu Normal", color: "text-emerald-400" };
    } else {
      if (value > 75) return { text: "Sangat Lembap", color: "text-blue-400" };
      if (value < 40) return { text: "Udara Kering", color: "text-amber-500" };
      return { text: "Kelembapan Nyaman", color: "text-emerald-400" };
    }
  };

  const status = getSubtext();

  return (
    <div
      id={`sensor_gauge_${type}`}
      className="p-5 rounded-2xl bg-[#15171e]/60 border border-white/8 flex flex-col items-center justify-center text-center h-56 relative group overflow-hidden"
    >
      {/* Top glow horizontal line accent */}
      <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent ${
        isSuhu ? "via-[#00f2ff]" : "via-[#a855f7]"
      } to-transparent`} />

      {/* Retro premium badge tagging */}
      <span className={`text-[9px] font-mono tracking-[1px] uppercase px-2.5 py-0.5 rounded-md mb-2.5 ${
        isSuhu 
          ? "bg-[#00f2ff]/10 text-[#00f2ff] border border-[#00f2ff]/20" 
          : "bg-[#a855f7]/10 text-[#a855f7] border border-[#a855f7]/20"
      }`}>
        {isSuhu ? "ATMOSPHERIC • DHT22" : "RH COMFORT • DHT22"}
      </span>

      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* SVG Circular Gauge */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          {/* Track Circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.03)"
            strokeWidth={strokeWidth}
          />
          {/* Animated Filled Progress Arc */}
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            stroke={isSuhu ? "url(#suhuGradient)" : "url(#kelembapanGradient)"}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            strokeLinecap="round"
          />

          {/* Define Color Gradients */}
          <defs>
            <linearGradient id="suhuGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f2ff" /> {/* Immersive Blue-cyan */}
              <stop offset="100%" stopColor="#10b981" /> 
            </linearGradient>
            <linearGradient id="kelembapanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" /> {/* Immersive Purple */}
              <stop offset="100%" stopColor="#6366f1" /> 
            </linearGradient>
          </defs>
        </svg>

        {/* Central Display stats */}
        <div className="absolute inset-0 flex flex-col items-center justify-center mt-1">
          {isSuhu ? (
            <Thermometer className="w-4.5 h-4.5 text-[#00f2ff] group-hover:scale-110 transition-transform mb-0.5" />
          ) : (
            <Droplets className="w-4.5 h-4.5 text-[#a855f7] group-hover:scale-110 transition-transform mb-0.5" />
          )}

          <div className="flex items-baseline">
            <span 
              className="text-4xl font-bold font-mono tracking-tight tabular-nums"
              style={{
                color: isSuhu ? "#00f2ff" : "#a855f7",
                textShadow: isSuhu 
                  ? "0 0 15px rgba(0,242,255,0.4)" 
                  : "0 0 15px rgba(168,85,247,0.4)"
              }}
            >
              {value !== undefined ? value.toFixed(1) : "--"}
            </span>
            <span className="text-xs font-mono text-slate-500 ml-0.5">
              {isSuhu ? "°C" : "%"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-2">
        <span className={`text-[10px] font-sans font-medium px-2 py-0.5 bg-[#050608]/50 rounded-md border border-white/5 ${status.color}`}>
          {status.text}
        </span>
      </div>
    </div>
  );
}

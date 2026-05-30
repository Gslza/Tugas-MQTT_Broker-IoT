import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Lightbulb, Fan, Snowflake, Eye, Edit2, Check, RefreshCw } from "lucide-react";

interface RelayCardProps {
  id: number;
  label: string;
  isOn: boolean;
  onToggle: (id: number, val: boolean) => void;
  onLabelChange: (id: number, newLabel: string) => void;
}

export default function RelayCard({ id, label, isOn, onToggle, onLabelChange }: RelayCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedLabel, setEditedLabel] = useState(label);

  useEffect(() => {
    setEditedLabel(label);
  }, [label]);

  const handleSave = () => {
    setIsEditing(false);
    if (editedLabel.trim()) {
      onLabelChange(id, editedLabel.trim());
    }
  };

  const selectIcon = () => {
    const labelLower = label.toLowerCase();
    if (labelLower.includes("lampu") || labelLower.includes("bohlam") || labelLower.includes("teras")) {
      return <Lightbulb className={`w-8 h-8 transition-transform duration-300 ${isOn ? "text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.5)] rotate-12 scale-110" : "text-slate-600"}`} />;
    }
    if (labelLower.includes("kipas") || labelLower.includes("fan") || labelLower.includes("angin")) {
      return <Fan className={`w-8 h-8 transition-spin ${isOn ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] animate-[spin_1.5s_linear_infinite] scale-110" : "text-slate-600"}`} />;
    }
    if (labelLower.includes("ac") || labelLower.includes("pendingin") || labelLower.includes("cooler") || labelLower.includes("salju")) {
      return <Snowflake className={`w-8 h-8 transition-transform duration-500 ${isOn ? "text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)] animate-pulse scale-110" : "text-slate-600"}`} />;
    }
    // Default fallback based on relay number
    switch (id) {
      case 1:
        return <Lightbulb className={`w-8 h-8 ${isOn ? "text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.5)]" : "text-slate-600"}`} />;
      case 2:
        return <Lightbulb className={`w-8 h-8 ${isOn ? "text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "text-slate-600"}`} />;
      case 3:
        return <Fan className={`w-8 h-8 ${isOn ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] animate-[spin_2s_linear_infinite]" : "text-slate-600"}`} />;
      default:
        return <Snowflake className={`w-8 h-8 ${isOn ? "text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "text-slate-600"}`} />;
    }
  };

  return (
    <motion.div
      id={`relay-card-${id}`}
      layout
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={`relative p-5 rounded-2xl border flex flex-col justify-between h-44 transition-all duration-300 overflow-hidden ${
        isOn
          ? "bg-[#15171e]/90 border-[#00f2ff]/60 shadow-[inset_0_0_12px_rgba(0,242,255,0.15)]"
          : "bg-[#15171e]/40 border-white/8"
      }`}
    >
      {/* Top ambient highlight line */}
      <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent ${
        isOn ? "via-[#00f2ff]" : "via-transparent"
      } to-transparent`} />

      {/* Header segment */}
      <div className="flex items-start justify-between">
        <div className="p-2.5 bg-[#050608]/80 border border-white/5 rounded-xl">
          {selectIcon()}
        </div>
        
        {/* Status indicator LED */}
        <div className="flex items-center space-x-2">
          <span 
            className={`text-[9px] font-mono tracking-widest uppercase px-2 py-0.5 rounded ${
              isOn 
                ? "bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/25" 
                : "bg-white/5 text-slate-500 border border-white/5"
            }`}
            style={isOn ? { textShadow: "0 0 5px rgba(0, 255, 136, 0.4)" } : undefined}
          >
            {isOn ? "ACTIVE" : "STANDBY"}
          </span>
          <span className={`w-2 h-2 rounded-full ${isOn ? "bg-[#00ff88] animate-pulse shadow-[0_0_10px_#00ff88]" : "bg-slate-700"}`} />
        </div>
      </div>

      {/* Title & Edit text Segment */}
      <div className="mt-2 flex-1 flex flex-col justify-end">
        {isEditing ? (
          <div className="flex items-center space-x-1 border-b border-[#00f2ff] py-0.5">
            <input
              type="text"
              value={editedLabel}
              onChange={(e) => setEditedLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              onBlur={handleSave}
              autoFocus
              className="bg-transparent text-xs font-sans font-medium text-slate-100 outline-none w-full"
              maxLength={24}
            />
            <button onClick={handleSave} className="text-[#00f2ff] hover:text-[#00f2ff]/85 p-0.5">
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center group/btn space-x-1.5 h-6">
            <h4 className="text-xs font-sans font-semibold text-slate-200 line-clamp-1">{label}</h4>
            <button
              onClick={() => setIsEditing(true)}
              className="opacity-0 group-hover/btn:opacity-100 transition-opacity p-1 text-slate-500 hover:text-slate-300 rounded cursor-pointer"
              title="Ubah Nama"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          </div>
        )}
        <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">RELAY PIN {id === 1 ? "26" : id === 2 ? "27" : id === 3 ? "32" : "33"}</span>
      </div>

      {/* Control Action segment */}
      <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2.5">
        <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wide">DIRECT SWITCH</span>
        <button
          onClick={() => onToggle(id, !isOn)}
          className={`w-11 h-5.5 rounded-full p-0.5 transition-colors duration-300 cursor-pointer ${
            isOn ? "bg-[#00f2ff]" : "bg-white/10"
          }`}
        >
          <div
            className={`w-4.5 h-4.5 rounded-full bg-slate-950 transition-all duration-300 shadow-sm ${
              isOn ? "translate-x-5.5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </motion.div>
  );
}

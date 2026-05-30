import { useState } from "react";
import { ReadingHistory } from "../types";

interface TelemetryChartProps {
  history: ReadingHistory[];
}

export default function TelemetryChart({ history }: TelemetryChartProps) {
  const [activeTab, setActiveTab] = useState<"suhu" | "kelembapan">("suhu");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (history.length < 2) {
    return (
      <div className="bg-slate-900/20 border border-slate-800 rounded-2xl p-6 h-64 flex flex-col items-center justify-center text-center">
        <span className="text-sm text-slate-500 font-sans tracking-wide">
          Menunggu data telemetry terkumpul...
        </span>
        <span className="text-[11px] text-slate-600 font-mono mt-1">
          (Butuh minimal 2 pencatatan riwayat sensor)
        </span>
      </div>
    );
  }

  // Dimension settings
  const width = 600;
  const height = 180;
  const paddingX = 30;
  const paddingY = 20;

  // Extract variables
  const isSuhu = activeTab === "suhu";
  const dataPoints = history.map((h, index) => ({
    x: paddingX + (index * (width - 2 * paddingX)) / (history.length - 1),
    yValue: isSuhu ? h.suhu : h.kelembapan,
    time: h.timestamp,
  }));

  const yValues = dataPoints.map(d => d.yValue);
  const minVal = Math.max(0, Math.min(...yValues) - 2);
  const maxVal = Math.max(...yValues, isSuhu ? 50 : 100) + 2;

  // Map to SVG Coordinates
  const points = dataPoints.map(d => {
    const yRatio = (d.yValue - minVal) / (maxVal - minVal);
    // Invert Y direction since SVG (0,0) starts at top-left
    const yCoord = height - paddingY - yRatio * (height - 2 * paddingY);
    return { ...d, y: yCoord };
  });

  // Assemble path instructions
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

  // Create area path under the line
  const areaPath = `
    ${linePath} 
    L ${(points[points.length - 1].x).toFixed(1)} ${(height - paddingY).toFixed(1)} 
    L ${(points[0].x).toFixed(1)} ${(height - paddingY).toFixed(1)} 
    Z
  `;

  return (
    <div className="bg-[#15171e]/60 border border-white/8 rounded-2xl p-5 relative overflow-hidden" id="telemetry-chart-container">
      {/* Top horizontal accent line */}
      <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent ${
        isSuhu ? "via-[#00f2ff]" : "via-[#a855f7]"
      } to-transparent`} />

      {/* Chart Headers */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-mono tracking-[1.5px] bg-[#00f2ff]/10 text-[#00f2ff] border border-[#00f2ff]/20 uppercase px-2.5 py-0.5 rounded w-fit mb-1.5">
            LOG ANALYTICS
          </span>
          <span className="text-xs font-mono font-bold tracking-wide text-slate-200">HISTORIC TELEMETRY MATRIX</span>
        </div>

        {/* Tab Buttons */}
        <div className="flex p-0.5 bg-[#050608]/80 border border-white/5 rounded-lg">
          <button
            onClick={() => { setActiveTab("suhu"); setHoverIndex(null); }}
            className={`cursor-pointer px-3 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-colors ${
              activeTab === "suhu"
                ? "bg-[#00f2ff]/15 text-[#00f2ff] font-bold border border-[#00f2ff]/20"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Suhu (°C)
          </button>
          <button
            onClick={() => { setActiveTab("kelembapan"); setHoverIndex(null); }}
            className={`cursor-pointer px-3 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-colors ${
              activeTab === "kelembapan"
                ? "bg-[#a855f7]/15 text-[#a855f7] font-bold border border-[#a855f7]/20"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Kelembapan (%)
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Definitions for Gradients */}
          <defs>
            <linearGradient id="suhuAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00f2ff" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#00f2ff" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="kelembapanAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth="1"
          />
          <line
            x1={paddingX}
            y1={paddingY}
            x2={width - paddingX}
            y2={paddingY}
            stroke="rgba(255, 255, 255, 0.02)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />

          {/* Fill Shade Area */}
          <path
            d={areaPath}
            fill={isSuhu ? "url(#suhuAreaGrad)" : "url(#kelembapanAreaGrad)"}
          />

          {/* Main Visual Path line */}
          <path
            d={linePath}
            fill="transparent"
            stroke={isSuhu ? "#00f2ff" : "#a855f7"}
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Multi-touch interactive check zones */}
          {points.map((p, index) => (
            <g
              key={index}
              className="cursor-pointer"
              onMouseEnter={() => setHoverIndex(index)}
              onTouchStart={() => setHoverIndex(index)}
            >
              {/* Highlight circle on hover */}
              {(hoverIndex === index || (hoverIndex === null && index === points.length - 1)) && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="6"
                  className={isSuhu ? "fill-[#00f2ff]" : "fill-[#a855f7]"}
                  stroke="rgba(255, 255, 255, 0.95)"
                  strokeWidth="2"
                  style={{
                    filter: `drop-shadow(0px 0px 6px ${isSuhu ? "#00f2ff" : "#a855f7"})`
                  }}
                />
              )}
              {/* Invisible touch catcher columns */}
              <rect
                x={p.x - ((width - 2 * paddingX) / (history.length - 1)) / 2}
                y={0}
                width={(width - 2 * paddingX) / (history.length - 1)}
                height={height}
                fill="transparent"
              />
            </g>
          ))}
        </svg>

        {/* Dynamic Tooltip HUD Overlay overlay */}
        {(() => {
          const activeIndex = hoverIndex !== null ? hoverIndex : points.length - 1;
          const p = points[activeIndex];
          if (!p) return null;
          return (
            <div
              className={`pointer-events-none absolute top-2 bg-[#050608] border rounded-lg px-3 py-1 shadow-lg shadow-black/80 flex items-center space-x-2 text-[10px] font-mono transition-all duration-150 ${
                isSuhu ? "border-[#00f2ff]/30 text-[#00f2ff]" : "border-[#a855f7]/30 text-[#a855f7]"
              }`}
              style={{
                left: `${(p.x / width) * 100}%`,
                transform: `translateX(-50%)`,
              }}
            >
              <span className="text-slate-400">{p.time}</span>
              <span className="text-white/20">|</span>
              <span className="font-bold">
                {p.yValue.toFixed(1)}{isSuhu ? "°C" : "%"}
              </span>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

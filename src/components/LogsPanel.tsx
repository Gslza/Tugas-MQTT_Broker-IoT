import { VoiceCommandLog } from "../types";
import { Mic, CheckCircle, AlertTriangle, HelpCircle } from "lucide-react";

interface LogsPanelProps {
  logs: VoiceCommandLog[];
  onClear: () => void;
}

export default function LogsPanel({ logs, onClear }: LogsPanelProps) {
  const sampleCommands = [
    "\"Nyalakan Lampu 1\"",
    "\"Matikan ac kamar tidur (Relay 4)\"",
    "\"Bisa tolong hidupkan kipas angin?\"",
    "\"Matikan semua relay\"",
    "\"Berapa suhu saat ini?\"",
  ];

  return (
    <div className="bg-[#15171e]/60 border border-white/8 rounded-2xl p-5 relative overflow-hidden" id="logs-panel-container">
      {/* Top horizontal linear glow-bar */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00f2ff]/40 to-transparent" />

      {/* Title block */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-[10px] font-mono tracking-[1.5px] bg-[#00f2ff]/10 text-[#00f2ff] border border-[#00f2ff]/20 uppercase px-2.5 py-0.5 rounded">
            System Console
          </span>
          <span className="text-xs font-mono font-bold tracking-wider text-slate-200">INTERACTIVE TELEMETRY LOGS</span>
        </div>
        {logs.length > 0 && (
          <button
            onClick={onClear}
            className="text-[9px] cursor-pointer font-mono tracking-widest uppercase px-2.5 py-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 border border-white/5 hover:border-rose-500/20 rounded-md transition-all"
          >
            Clear logs
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Help commands reference guide */}
        <div className="md:col-span-4 bg-[#050608]/50 rounded-xl p-4 border border-white/5 flex flex-col justify-between">
          <div>
            <h5 className="text-[10px] font-mono tracking-wider text-slate-400 uppercase flex items-center space-x-2 mb-2.5">
              <HelpCircle className="w-3.5 h-3.5 text-[#00f2ff]" />
              <span>Voice Reference Desk</span>
            </h5>
            <p className="text-[11px] text-slate-500 mb-3 font-sans leading-relaxed">
              Tekan mikrofon verbal di dashboard dan ucapkan salah satu kalimat berikut secara alami:
            </p>
            <ul className="space-y-1.5">
              {sampleCommands.map((cmd, idx) => (
                <li
                  key={idx}
                  className="text-[10px] font-mono text-slate-300 py-1.5 px-3 bg-[#15171e] rounded-lg border border-white/5 cursor-pointer hover:bg-[#00f2ff]/5 hover:border-[#00f2ff]/20 transition-all"
                >
                  {cmd}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-[9px] text-slate-600 font-mono leading-relaxed mt-4 pt-3 border-t border-white/5">
            * Gemini AI Core menafsirkan ucapan lisan Anda secara cerdas tanpa perlu format kaku.
          </p>
        </div>

        {/* Live log entries */}
        <div className="md:col-span-8 flex flex-col">
          <h5 className="text-[10px] font-mono tracking-wider text-slate-500 uppercase mb-3">
            PERCEPTUAL ACTIVITY REVIEWS ({logs.length})
          </h5>

          {logs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-white/5 rounded-xl bg-[#050608]/20">
              <Mic className="w-6 h-6 text-slate-700 animate-pulse mb-3" />
              <p className="text-xs text-slate-500 font-mono font-medium tracking-wide uppercase">CONSOLE STANDBY</p>
              <p className="text-[10px] text-slate-600 font-sans mt-1 max-w-xs leading-relaxed">
                Log masukan verbal Anda akan dikategorikan dan dijabarkan real-time di area ini.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[290px] overflow-y-auto pr-1">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-[#050608]/60 border border-white/5 p-3 rounded-xl flex items-start space-x-3 transition-colors hover:border-white/10"
                >
                  {log.success ? (
                    <CheckCircle className="w-4.5 h-4.5 text-[#00ff88] mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4.5 h-4.5 text-rose-500 mt-0.5 shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold font-sans text-slate-200 line-clamp-1">
                        &ldquo;{log.commandText}&rdquo;
                      </span>
                      <span className="text-[9px] font-mono text-slate-500 shrink-0 ml-2">
                        {log.timestamp}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 font-mono italic mt-1 bg-[#050608] px-2.5 py-1.5 rounded-lg border border-white/5 leading-relaxed">
                      Lisan: &ldquo;{log.interpretedDetails.speechResponse}&rdquo;
                    </p>

                    <div className="flex items-center space-x-3 mt-1.5 text-[9px] font-mono">
                      <span className="text-slate-500">
                        AKSI: <span className="text-[#00f2ff]">{log.action}</span>
                      </span>
                      {log.interpretedDetails.relayNumber !== null && (
                        <span className="text-slate-500">
                          TARGET: <span className="text-purple-400">Relay {log.interpretedDetails.relayNumber}</span>
                        </span>
                      )}
                      {log.interpretedDetails.value !== null && (
                        <span className="text-slate-500">
                          STATUS:{" "}
                          <span className={log.interpretedDetails.value ? "text-[#00ff88]" : "text-slate-500"}>
                            {log.interpretedDetails.value ? "ON" : "OFF"}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

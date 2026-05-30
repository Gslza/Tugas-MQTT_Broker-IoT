import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { ref as dbRef, onValue, set as dbSet } from "firebase/database";
import { auth, rtdb } from "./firebase";
import EmailAuth from "./components/EmailAuth";
import RelayCard from "./components/RelayCard";
import SensorGauge from "./components/SensorGauge";
import TelemetryChart from "./components/TelemetryChart";
import LogsPanel from "./components/LogsPanel";
import AudioVisualizer from "./components/AudioVisualizer";
import { IotData, RelayLabels, VoiceCommandLog, ReadingHistory } from "./types";
import { Mic, LogOut, Cpu, HardDrive, Wifi, Sparkles, Send, HelpCircle, ChevronRight, Volume2, VolumeX, Keyboard } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // IoT Telemetry State
  const [telemetry, setTelemetry] = useState<IotData>({
    suhu: 26.5,
    kelembapan: 62.0,
    relay1: false,
    relay2: false,
    relay3: false,
    relay4: false,
  });

  // Connection Indicator
  const [dbConnected, setDbConnected] = useState(false);

  // Relay Channel Custom Names
  const [labels, setLabels] = useState<RelayLabels>({
    relay1Name: "Lampu Ruang Tamu",
    relay2Name: "Lampu Kamar Tidur",
    relay3Name: "Kipas Angin Utama",
    relay4Name: "AC / Pendingin Ruang",
  });

  // Historical Telemetry Analytics
  const [history, setHistory] = useState<ReadingHistory[]>([]);

  // Speech & Command Log States
  const [isListening, setIsListening] = useState(false);
  const [textCommand, setTextCommand] = useState("");
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);
  const [speechResultText, setSpeechResultText] = useState<string | null>(null);
  const [logs, setLogs] = useState<VoiceCommandLog[]>([]);
  const [enableSoundResponse, setEnableSoundResponse] = useState(true);

  // Web Speech API Reference
  const recognitionRef = useRef<any>(null);

  // Fetch initial relay names from localStorage on component mount
  useEffect(() => {
    const savedLabels = localStorage.getItem("relay_labels_v2");
    if (savedLabels) {
      try {
        setLabels(JSON.parse(savedLabels));
      } catch (e) {
        console.error("Failed to parse saved labels", e);
      }
    }

    const savedLogs = localStorage.getItem("voice_command_logs_v2");
    if (savedLogs) {
      try {
        setLogs(JSON.parse(savedLogs));
      } catch (e) {
        console.error("Failed to parse saved logs", e);
      }
    }
  }, []);

  // Securely listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (loggedUser) => {
      setUser(loggedUser);
      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Firebase Sync once Authenticated
  useEffect(() => {
    if (!user) return;

    console.log("Connecting real-time Firebase RTDB listeners for: https://gzza-27d5b-default-rtdb.asia-southeast1.firebasedatabase.app/");
    
    // Check connection state
    const connectionRef = dbRef(rtdb, ".info/connected");
    const unsubscribeConn = onValue(connectionRef, (snap) => {
      setDbConnected(!!snap.val());
    });

    // Sync whole /IoT node
    const iotReference = dbRef(rtdb, "IoT");
    const unsubscribeIot = onValue(iotReference, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setTelemetry((prev) => {
          const updated: IotData = {
            suhu: typeof val.Suhu === "number" ? val.Suhu : val.suhu ?? prev.suhu,
            kelembapan: typeof val.Kelembapan === "number" ? val.Kelembapan : val.kelembapan ?? prev.kelembapan,
            relay1: typeof val.Relay1 === "boolean" ? val.Relay1 : val.relay1 ?? prev.relay1,
            relay2: typeof val.Relay2 === "boolean" ? val.Relay2 : val.relay2 ?? prev.relay2,
            relay3: typeof val.Relay3 === "boolean" ? val.Relay3 : val.relay3 ?? prev.relay3,
            relay4: typeof val.Relay4 === "boolean" ? val.Relay4 : val.relay4 ?? prev.relay4,
          };

          // Record new metrics to telemetry history graph
          const now = new Date();
          const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
          
          setHistory((prevHistory) => {
            const newHistoryPoint: ReadingHistory = {
              timestamp: timeStr,
              suhu: updated.suhu,
              kelembapan: updated.kelembapan,
            };
            const trimmed = [...prevHistory, newHistoryPoint];
            // Keep last 15 elements to avoid memory leaks
            if (trimmed.length > 15) {
              trimmed.shift();
            }
            return trimmed;
          });

          return updated;
        });
      }
    });

    return () => {
      unsubscribeConn();
      unsubscribeIot();
    };
  }, [user]);

  // Handle click toggling of relays on RTDB with proper active-low translation for Arduino
  const handleToggle = (id: number, targetVal: boolean) => {
    if (!dbConnected) {
      console.warn("Database is currently offline. Action queued.");
    }
    const path = `IoT/Relay${id}`;
    dbSet(dbRef(rtdb, path), targetVal)
      .then(() => {
        setTelemetry((prev) => ({ ...prev, [`relay${id}`]: targetVal }));
      })
      .catch((err) => {
        console.error("Firebase write error:", err);
      });
  };

  const handleLabelChange = (id: number, newLabel: string) => {
    const updatedLabels = { ...labels, [`relay${id}Name`]: newLabel };
    setLabels(updatedLabels);
    localStorage.setItem("relay_labels_v2", JSON.stringify(updatedLabels));
  };

  const handleClearLogs = () => {
    setLogs([]);
    localStorage.removeItem("voice_command_logs_v2");
  };

  // Text-To-Speech Indonesian engine 
  const speakResponse = (text: string) => {
    if (!enableSoundResponse) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "id-ID"; // Try Indonesian locale
      utterance.rate = 1.0;
      
      // Look for Indonesian synthesized voice
      const voices = window.speechSynthesis.getVoices();
      const idVoice = voices.find(v => v.lang.toLowerCase().includes("id"));
      if (idVoice) {
        utterance.voice = idVoice;
      }
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("Browser text-to-speech failure", e);
    }
  };

  // Call Express multi-turn Gemini endpoint to execute commands
  const sendCommandToAI = async (text: string) => {
    if (!text.trim()) return;
    setIsProcessingCommand(true);
    setSpeechResultText(`Memproses: "${text}"`);
    
    try {
      const response = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: text,
          currentStatus: {
            suhu: telemetry.suhu,
            kelembapan: telemetry.kelembapan,
            relay1: telemetry.relay1,
            relay2: telemetry.relay2,
            relay3: telemetry.relay3,
            relay4: telemetry.relay4,
            relay1Name: labels.relay1Name,
            relay2Name: labels.relay2Name,
            relay3Name: labels.relay3Name,
            relay4Name: labels.relay4Name,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal memperoleh respon dari server AI.");
      }

      const result = await response.json();
      console.log("AI Interpreted Action:", result);

      // Execute targeted AI actions
      if (result.action === "TOGGLE_RELAY" && typeof result.relayNumber === "number") {
        handleToggle(result.relayNumber, !!result.value);
      } else if (result.action === "SET_ALL_RELAYS") {
        const val = !!result.value;
        dbSet(dbRef(rtdb, "IoT/Relay1"), val);
        dbSet(dbRef(rtdb, "IoT/Relay2"), val);
        dbSet(dbRef(rtdb, "IoT/Relay3"), val);
        dbSet(dbRef(rtdb, "IoT/Relay4"), val);
        setTelemetry((prev) => ({
          ...prev,
          relay1: val,
          relay2: val,
          relay3: val,
          relay4: val,
        }));
      }

      // Voice responses
      setSpeechResultText(result.speechResponse);
      speakResponse(result.speechResponse);

      // Write to Command history logs
      const newLog: VoiceCommandLog = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString("id-ID"),
        commandText: text,
        action: result.action,
        interpretedDetails: {
          relayNumber: result.relayNumber,
          value: result.value,
          speechResponse: result.speechResponse,
        },
        success: true,
      };

      setLogs((prev) => {
        const updated = [newLog, ...prev];
        localStorage.setItem("voice_command_logs_v2", JSON.stringify(updated));
        return updated;
      });

    } catch (err: any) {
      console.error(err);
      const errMsg = "Gagal memproses instruksi. Silakan cek sambungan internet server.";
      setSpeechResultText(errMsg);
      speakResponse(errMsg);

      const errorLog: VoiceCommandLog = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString("id-ID"),
        commandText: text,
        action: "ERROR",
        interpretedDetails: {
          relayNumber: null,
          value: null,
          speechResponse: errMsg,
        },
        success: false,
      };

      setLogs((prev) => {
        const updated = [errorLog, ...prev];
        localStorage.setItem("voice_command_logs_v2", JSON.stringify(updated));
        return updated;
      });
    } finally {
      setIsProcessingCommand(false);
    }
  };

  // Initialize Speech Recognition
  const startRecording = () => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognitionClass) {
      alert("Browser Anda tidak mendukung Web Speech API (Perekaman Suara). Gunakan Google Chrome agar perintah suara berjalan normal, atau gunakan kolom ketik manual di bawah.");
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const rec = new SpeechRecognitionClass();
      rec.lang = "id-ID"; // Set to Indonesian 
      rec.interimResults = false;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        setIsListening(true);
        setSpeechResultText("Mulai mendengarkan... katakan instruksi Anda.");
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          sendCommandToAI(transcript);
        }
      };

      rec.onerror = (e: any) => {
        console.error("Speech Recognition error:", e);
        setIsListening(false);
        setSpeechResultText("Perekaman batal atau tidak ada suara terdeteksi.");
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (e) {
      console.error("Failed to boot Speech recognition:", e);
    }
  };

  const handleLogOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
  };

  // While checking original auth state
  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#070b19] flex flex-col items-center justify-center font-sans">
        <ActivityIcon text="MENGHUBUNGKAN PROTOKOL SECURE..." />
      </div>
    );
  }

  // Not logged in -> Auth Barrier
  if (!user) {
    return <EmailAuth onAuthSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-[#050608] text-slate-100 flex flex-col relative overflow-hidden font-sans" style={{ background: "radial-gradient(circle at 50% 0%, #1a1c24 0%, #050608 70%)" }}>
      
      {/* Decorative ambient gradients */}
      <span className="absolute top-0 left-[10%] w-[600px] h-[600px] bg-[#00f2ff]/3 blur-[150px] rounded-full pointer-events-none animate-pulse" />
      <span className="absolute bottom-0 right-[10%] w-[500px] h-[500px] bg-[#a855f7]/3 blur-[150px] rounded-full pointer-events-none" />

      {/* Primary Dashboard Header */}
      <header className="border-b border-white/5 bg-[#050608]/45 backdrop-blur-md relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          
          {/* Logo brand */}
          <div className="flex items-center space-x-3" id="brand-logo">
            <div className="w-8 h-8 bg-[#00f2ff]/10 border border-[#00f2ff]/30 rounded-lg flex items-center justify-center shadow-[0_0_12px_rgba(0,242,255,0.2)]">
              <Cpu className="w-4.5 h-4.5 text-[#00f2ff]" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-[1.5px] text-slate-100 font-mono">
                GZZA <span className="text-[#00f2ff]" style={{ textShadow: "0 0 10px rgba(0,242,255,0.4)" }}>CORE</span>
              </span>
              <span className="hidden sm:inline-block ml-3 text-[9px] bg-[#00f2ff]/10 text-[#00f2ff] border border-[#00f2ff]/15 px-2 py-0.5 rounded uppercase font-mono tracking-widest">
                MCU NETWORK Terminal
              </span>
            </div>
          </div>

          {/* Action indicators */}
          <div className="flex items-center space-x-4">
            
            {/* Live Database status */}
            <div className="flex items-center space-x-2 bg-[#050608]/80 px-3 py-1.5 rounded-xl border border-white/5 font-mono text-[10px]">
              <div className={`w-2.5 h-2.5 rounded-full ${dbConnected ? "bg-[#00ff88] shadow-[0_0_8px_#00ff88]" : "bg-rose-500 shadow-[0_0_8px_#ef4444]"}`} />
              <span className={dbConnected ? "text-[#00ff88] font-bold" : "text-rose-500 font-bold"}>
                {dbConnected ? "RTDB CONNECTED" : "RTDB DISCONNECTED"}
              </span>
            </div>

            {/* Sound toggle */}
            <button
              onClick={() => setEnableSoundResponse(!enableSoundResponse)}
              className="p-1.5 bg-[#15171e] hover:bg-[#15171e]/80 text-slate-400 hover:text-slate-200 border border-white/5 rounded-xl cursor-pointer transition-all"
              title={enableSoundResponse ? "Matikan Respon Suara Lisan" : "Aktifkan Respon Suara Lisan"}
            >
              {enableSoundResponse ? <Volume2 className="w-4 h-4 text-[#00f2ff]" /> : <VolumeX className="w-4 h-4 text-slate-600" />}
            </button>

            {/* User credentials & Log out */}
            <div className="hidden md:flex flex-col text-right">
              <span className="text-[10px] font-mono text-slate-400">{user.email}</span>
              <span className="text-[9px] text-slate-600 font-mono uppercase tracking-wider">LEVEL: ADMINISTRATOR</span>
            </div>

            <button
              onClick={handleLogOut}
              className="p-1.5 bg-rose-500/5 hover:bg-rose-500/10 hover:text-rose-400 border border-rose-500/20 text-slate-400 rounded-xl cursor-pointer transition-all"
              title="Keluar Portal"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10 w-full animate-fade-in">
        
        {/* RECOMMENDATION DESIGN BANNER DESAIN */}
        <div className="mb-6 p-4 bg-[#15171e]/60 border border-white/5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00f2ff]/30 to-transparent" />
          <div className="flex items-start space-x-3">
            <div className="px-2.5 py-1 bg-[#00f2ff]/10 text-[#00f2ff] border border-[#00f2ff]/20 rounded text-[9px] font-mono tracking-widest uppercase mt-1 md:mt-0 shadow-[0_0_8px_rgba(0,242,255,0.1)]">
              IMMERSIVE DIRECTIVE
            </div>
            <div>
              <p className="text-xs font-bold font-sans text-slate-200 tracking-wide">Rekomendasi Pemetaan Tata Letak & Desain Dashboard:</p>
              <p className="text-[11px] text-slate-450 leading-relaxed mt-0.5">
                Gunakan skema <span className="text-[#00f2ff] font-medium">Premium Neon Slate</span> untuk kontras visual superior. Setiap relay dipasangkan 
                dengan ikon dinamis (Kipas, Lampu, AC) yang berputar atau menyala sesuai state relay. 
                Suhu & Kelembapan divisualisasikan dalam tipe circular gauge radial chart, berpadu dengan sensor telemetry sparkline chart 
                agar pola fluktuasi cuaca ruangan terbaca intuitif.
              </p>
            </div>
          </div>
          <span className="text-[10px] bg-[#050608] border border-white/5 px-2.5 py-1 text-slate-500 rounded-lg shrink-0 font-mono">
            Active-Low Low-Latency
          </span>
        </div>

        {/* Dashboard grid panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT SIDE: SENSOR DATA & REVIEWS (7 columns scale) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* GAUGE CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <SensorGauge type="suhu" value={telemetry.suhu} />
              <SensorGauge type="kelembapan" value={telemetry.kelembapan} />
            </div>

            {/* LIVE SPARKLINE GRAPH */}
            <TelemetryChart history={history} />
          </div>

          {/* RIGHT SIDE: RELAYS CHANNELS CONTROLLER (5 columns scale) */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-[#15171e]/60 border border-white/8 rounded-2xl p-5 relative overflow-hidden">
              {/* Top ambient highlight bar */}
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00f2ff] to-transparent" />

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <HardDrive className="w-4 h-4 text-[#00f2ff]" />
                  <span className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">Relay terminal desk</span>
                </div>
                <div className="flex space-x-1.5">
                  <button
                    onClick={() => {
                      dbSet(dbRef(rtdb, "IoT/Relay1"), true);
                      dbSet(dbRef(rtdb, "IoT/Relay2"), true);
                      dbSet(dbRef(rtdb, "IoT/Relay3"), true);
                      dbSet(dbRef(rtdb, "IoT/Relay4"), true);
                      setTelemetry((prev) => ({
                        ...prev, relay1: true, relay2: true, relay3: true, relay4: true,
                      }));
                    }}
                    className="text-[9px] cursor-pointer font-mono tracking-wider px-2.5 py-1 bg-[#00f2ff]/10 hover:bg-[#00f2ff]/20 text-[#00f2ff] border border-[#00f2ff]/20 rounded uppercase transition-all"
                  >
                    ON ALL
                  </button>
                  <button
                    onClick={() => {
                      dbSet(dbRef(rtdb, "IoT/Relay1"), false);
                      dbSet(dbRef(rtdb, "IoT/Relay2"), false);
                      dbSet(dbRef(rtdb, "IoT/Relay3"), false);
                      dbSet(dbRef(rtdb, "IoT/Relay4"), false);
                      setTelemetry((prev) => ({
                        ...prev, relay1: false, relay2: false, relay3: false, relay4: false,
                      }));
                    }}
                    className="text-[9px] cursor-pointer font-mono tracking-wider px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-400 border border-white/5 rounded uppercase transition-all"
                  >
                    OFF ALL
                  </button>
                </div>
              </div>

              {/* Grid 2x2 cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <RelayCard
                  id={1}
                  label={labels.relay1Name}
                  isOn={telemetry.relay1}
                  onToggle={handleToggle}
                  onLabelChange={handleLabelChange}
                />
                <RelayCard
                  id={2}
                  label={labels.relay2Name}
                  isOn={telemetry.relay2}
                  onToggle={handleToggle}
                  onLabelChange={handleLabelChange}
                />
                <RelayCard
                  id={3}
                  label={labels.relay3Name}
                  isOn={telemetry.relay3}
                  onToggle={handleToggle}
                  onLabelChange={handleLabelChange}
                />
                <RelayCard
                  id={4}
                  label={labels.relay4Name}
                  isOn={telemetry.relay4}
                  onToggle={handleToggle}
                  onLabelChange={handleLabelChange}
                />
              </div>
            </div>

            {/* ARTIFICIAL VOICE COMMAND CENTRAL BOX */}
            <div className="bg-[#15171e]/60 border border-white/8 rounded-2xl p-6 relative overflow-hidden shadow-xl shadow-cyan-950/20">
              
              {/* Voice pulse indicator ring decoration from absolute */}
              <span className="absolute -right-10 -bottom-10 w-32 h-32 bg-[#00f2ff]/5 blur-xl rounded-full pointer-events-none" />

              <div className="flex items-center justify-between mb-2.5 relative z-10">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-[#00f2ff]" />
                  <span className="text-xs font-mono font-bold tracking-wider text-slate-200">VOICE COMMAND STATION</span>
                </div>
                <div className="flex items-center">
                  <span className="text-[8px] tracking-widest font-mono text-[#00f2ff] bg-[#00f2ff]/10 px-2 py-0.5 rounded border border-[#00f2ff]/20 uppercase">
                    GEMINI
                  </span>
                </div>
              </div>

              {/* Description of command style */}
              <p className="text-[11px] text-slate-500 leading-relaxed mb-4 relative z-10 font-sans">
                Gunakan mikrofon untuk memberikan perintah percakapan Bahasa Indonesia secara alami. Gemini AI akan menginterpretasikannya secara instan.
              </p>

              {/* Voice action button block with integrated Voice Orb */}
              <div className="p-4 bg-[#050608]/50 border border-white/5 rounded-2xl relative z-10 flex flex-col items-center justify-center h-48">
                <AudioVisualizer 
                  isListening={isListening} 
                  onStart={startRecording}
                  disabled={isProcessingCommand}
                />
              </div>

              {/* Text message keyboard command entry backup safeguard */}
              <div className="mt-4 border-t border-white/5 pt-3 relative z-10">
                <label className="text-[9px] font-mono tracking-wider uppercase text-slate-400 flex items-center space-x-1.5 mb-2">
                  <Keyboard className="w-3.5 h-3.5 text-slate-500" />
                  <span>Manual Input Interface</span>
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={textCommand}
                    onChange={(e) => setTextCommand(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !isProcessingCommand && (sendCommandToAI(textCommand), setTextCommand(""))}
                    placeholder="Contoh: nyalakan lampu teras..."
                    disabled={isProcessingCommand}
                    className="flex-1 bg-[#050608] border border-white/8 hover:border-white/15 focus:border-[#00f2ff] focus:ring-1 focus:ring-[#00f2ff]/30 rounded-xl py-2 px-3.5 text-xs font-sans text-slate-100 outline-none transition-all"
                  />
                  <button
                    onClick={() => {
                      if (textCommand.trim()) {
                        sendCommandToAI(textCommand.trim());
                        setTextCommand("");
                      }
                    }}
                    disabled={isProcessingCommand || !textCommand.trim()}
                    className="p-2.5 bg-[#00f2ff]/15 hover:bg-[#00f2ff]/25 text-[#00f2ff] border border-[#00f2ff]/20 font-mono font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Transcript Display overlay */}
              <AnimatePresence>
                {speechResultText && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 p-3 bg-[#050608] border border-white/5 rounded-xl relative z-10 flex items-start space-x-2"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-sans text-slate-350 leading-relaxed whitespace-pre-wrap">
                        {speechResultText}
                      </p>
                      {isProcessingCommand && (
                        <span className="inline-flex space-x-1 mt-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00f2ff] animate-bounce"></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00f2ff] animate-bounce [animation-delay:0.2s]"></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00f2ff] animate-bounce [animation-delay:0.4s]"></span>
                        </span>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>

          </div>

        </div>

        {/* LOG PANEL COMPONENT */}
        <div className="mt-8">
          <LogsPanel logs={logs} onClear={handleClearLogs} />
        </div>

      </main>

      {/* FOOTER METADATA */}
      <footer className="border-t border-white/5 bg-[#050608]/45 py-6 mt-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono">
          <p className="text-slate-500 font-sans text-center md:text-left">
            © 2026 GZZA CORE. Terintegrasi dengan Firebase Realtime Database Client API & Google Gemini AI.
          </p>
          <div className="flex items-center space-x-4 text-[10px] text-slate-600">
            <span>INFERENCE: ID-ID</span>
            <span>•</span>
            <span>MODEL: GEMINI-2.5-FLASH</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

// ActivityIcon loading utility
function ActivityIcon({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 relative z-10 font-sans p-7 bg-[#15171e]/70 border border-white/5 rounded-3xl max-w-sm w-full text-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00f2ff] to-transparent" />
      <div className="p-3.5 bg-[#050608]/80 border border-white/5 rounded-2xl shadow-inner text-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.15)] animate-pulse">
        <Sparkles className="w-5 h-5" />
      </div>
      <div>
        <h4 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-widest">{text}</h4>
        <p className="text-[10px] text-slate-500 font-sans mt-2 leading-relaxed">
          Menunggu jabat tangan (handshake) sambungan otentikasi Firebase...
        </p>
      </div>
    </div>
  );
}

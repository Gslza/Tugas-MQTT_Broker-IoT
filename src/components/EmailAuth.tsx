import { useState, FormEvent } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { Lock, Mail, ToggleLeft, Activity, Info, Eye, EyeOff, Check } from "lucide-react";

interface EmailAuthProps {
  onAuthSuccess: () => void;
}

export default function EmailAuth({ onAuthSuccess }: EmailAuthProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    if (!email || !password) {
      setError("Silakan isi semua bidang input.");
      setLoading(false);
      return;
    }

    try {
      if (activeTab === "login") {
        await signInWithEmailAndPassword(auth, email, password);
        onAuthSuccess();
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        setSuccessMsg("Pendaftaran berhasil! Menyambungkan ke IoT Dashboard...");
        setTimeout(() => {
          onAuthSuccess();
        }, 1500);
      }
    } catch (err: any) {
      console.error(err);
      let localizedError = "Terjadi kesalahan sistem. Coba lagi.";
      if (err.code === "auth/invalid-credential") {
        localizedError = "Email atau sandi salah.";
      } else if (err.code === "auth/weak-password") {
        localizedError = "Sandi minimal harus terdiri dari 6 karakter.";
      } else if (err.code === "auth/email-already-in-use") {
        localizedError = "Email tersebut sudah terdaftar di sistem kami.";
      } else if (err.code === "auth/invalid-email") {
        localizedError = "Format penulisan email tidak valid.";
      } else if (err.code === "auth/operation-not-allowed") {
        localizedError = "Provider Email/Sandi belum diaktifkan di Firebase Console Anda.";
      }
      setError(localizedError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b19] flex items-center justify-center px-4 relative overflow-hidden font-sans">
      {/* Visual glowing geometric highlights */}
      <span className="absolute top-[20%] left-[20%] w-[400px] h-[400px] bg-indigo-600/10 blur-[130px] rounded-full pointer-events-none" />
      <span className="absolute bottom-[20%] right-[20%] w-[350px] h-[350px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Card wrapper */}
      <div className="w-full max-w-md bg-slate-950/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 backdrop-blur-xl">
        
        {/* Brand visual header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-slate-900 border border-slate-800 rounded-2xl mb-3 shadow-inner">
            <Activity className="w-6 h-6 text-emerald-400 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">KONEKSI INTELEKTUAL IoT</h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">SMART DEVISE PORTAL - gzza-27d5b</p>
        </div>

        {/* Tab selection */}
        <div className="flex p-1 bg-slate-950 border border-slate-900 rounded-xl mb-6">
          <button
            onClick={() => { setActiveTab("login"); setError(null); }}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === "login"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Masuk Portal
          </button>
          <button
            onClick={() => { setActiveTab("register"); setError(null); }}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === "register"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Daftar Akun
          </button>
        </div>

        {/* Form area */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email segment */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
              Alamat Surat Elektronik (Email)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@domain.com"
                className="w-full bg-slate-950/50 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl py-2.5 pl-10 pr-4 text-xs font-sans text-slate-100 transition-all outline-none"
                required
              />
            </div>
          </div>

          {/* Password segment */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
              Kata Sandi (Password)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full bg-slate-950/50 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl py-2.5 pl-10 pr-10 text-xs font-sans text-slate-100 transition-all outline-none"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Messages info segment */}
          {error && (
            <div className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl text-rose-400 text-xs leading-relaxed font-sans flex items-start space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs leading-relaxed font-sans flex items-center space-x-2">
              <Check className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-sans font-bold text-xs tracking-wider uppercase py-3 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 cursor-pointer mt-2"
          >
            {loading ? "Menghubungi Firebase..." : activeTab === "login" ? "Masuk ke Dashboard" : "Daftar Akun Baru"}
          </button>
        </form>

        {/* Guided instructions */}
        <div className="mt-6 border-t border-slate-900 pt-5 text-[10px] text-slate-500 leading-relaxed font-sans flex items-start space-x-2.5 bg-slate-950/30 p-3 rounded-xl">
          <Info className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-slate-400 mb-0.5">Petunjuk Pendaftaran Akun:</p>
            <p>
              Pastikan Anda telah mengaktifkan metode masuk <span className="text-slate-300 font-mono">Email / Password</span> di dalam Firebase Console konsol proyek Anda (<span className="text-slate-300 font-mono">gzza-27d5b</span>) untuk mendaftarkan akun baru dengan lancar.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

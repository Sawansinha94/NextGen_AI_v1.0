import React, { useState } from "react";
import {
  Lock,
  User as UserIcon,
  ArrowRight,
  ShieldAlert,
  Bot,
  KeyRound,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
} from "lucide-react";
import { ChaseBox } from "./ChaseBox";

interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
  onNavigateRegister: () => void;
}

export function LoginScreen({
  onLoginSuccess,
  onNavigateRegister,
}: LoginScreenProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username || !password) {
      setError("Please enter your username and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        window.setTimeout(() => {
          onLoginSuccess(data.user);
        }, 600);
      } else {
        setError(data.error || "Invalid username or password. Please try again.");
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoUser: string, demoPass: string) => {
    setUsername(demoUser);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen gradient-blue-marble-bg text-slate-800 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      <div className="w-full max-w-xl relative z-10 flex flex-col gap-5">
        {/* Main Central Card with Chasing Light Effect strictly on borders while waiting for output */}
        <ChaseBox active={loading} variant="main" className="w-full">
          <div className="bg-white/95 backdrop-blur-xl p-8 sm:p-10 border border-sky-400/20 shadow-2xl shadow-slate-950/40 rounded-2xl">
            {/* Header / Brand: NextGen Ai */}
            <div className="text-center mb-7">
              <div className="inline-flex items-center justify-center mb-3 relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/25">
                  <Bot className="w-7 h-7" />
                </div>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full animate-pulse shadow-sm" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 mb-2.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                <span className="text-[11px] font-semibold text-sky-700">
                  ServiceNow AI Assistant
                </span>
              </div>

              <div className="flex items-center justify-center gap-2 mb-1">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 flex items-center justify-center gap-2">
                  <span>NextGen</span>
                  <span className="bg-gradient-to-r from-sky-600 to-amber-600 bg-clip-text text-transparent italic">
                    Ai
                  </span>
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
                Chat with your ServiceNow assistant to search incidents, check tickets, and get fast answers.
              </p>
            </div>

            {/* Simple Feature Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
              {[
                { label: "Fast Answers", icon: CheckCircle2 },
                { label: "Ticket Search", icon: Layers },
                { label: "Live ServiceNow", icon: Cpu },
                { label: "24/7 Available", icon: Sparkles },
              ].map((pill, i) => (
                <div
                  key={i}
                  className="bg-slate-50/80 px-2.5 py-2 rounded-xl flex items-center justify-center gap-1.5 text-center border border-slate-200/80 text-slate-600 text-xs font-medium"
                >
                  <pill.icon className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span className="text-[11px]">{pill.label}</span>
                </div>
              ))}
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Username
                </label>
                <div className="relative w-full">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. sawan.sinha or admin"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative w-full">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-60 shadow-md shadow-sky-600/20"
                >
                  <span>
                    {loading ? "Signing in..." : "Sign In"}
                  </span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <p className="text-slate-500">
                Don't have an account?{" "}
                <button
                  onClick={onNavigateRegister}
                  className="text-sky-600 hover:text-sky-800 font-semibold cursor-pointer transition-colors"
                >
                  Sign up
                </button>
              </p>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                <span>Protected login</span>
              </div>
            </div>
          </div>
        </ChaseBox>

        {/* Quick Demo Credentials Box */}
        <div className="bg-white/80 backdrop-blur-md p-4 border border-slate-200/80 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-sm">
          <div>
            <span className="font-semibold text-slate-800 block">
              Quick Demo Accounts
            </span>
            <p className="text-slate-500 text-xs mt-0.5">
              Click an account to fill credentials and test:
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleQuickDemo("sawan.sinha", "admin123")}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-medium transition-colors cursor-pointer"
            >
              sawan.sinha
            </button>
            <button
              onClick={() => handleQuickDemo("admin", "admin123")}
              className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-medium transition-colors cursor-pointer"
            >
              admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

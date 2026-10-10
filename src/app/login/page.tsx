"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, Eye, EyeOff, Sparkles, ArrowRight, ShieldCheck, ChefHat } from "lucide-react";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setErrorMessage("Please enter both username/email and password");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const tokenData = await api.login(identifier, password);
      localStorage.setItem("panna_crm_token", tokenData.access_token);

      const profileResp = await api.getMe();
      if (profileResp && profileResp.data) {
        setAuth(profileResp.data, tokenData.access_token, tokenData.refresh_token);
        router.push("/");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#FAF8F5] text-slate-800">
      {/* Left Brand Showcase Column (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-panna-green-950 via-panna-green-900 to-panna-green-800 p-12 flex-col justify-between relative overflow-hidden text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-panna-gold-500/15 via-transparent to-transparent pointer-events-none" />

        {/* Top Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-panna-gold-500 to-panna-gold-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-panna-gold-500/20">
            <span className="font-serif text-2xl">P</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-2xl font-bold tracking-wide">Panna</span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-panna-gold-500/20 text-panna-gold-400 font-bold uppercase tracking-wider border border-panna-gold-500/30">
                CRM
              </span>
            </div>
            <p className="text-xs text-panna-green-300 font-medium">Cloud Kitchen Management Platform</p>
          </div>
        </div>

        {/* Middle Value Proposition */}
        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-panna-cream-100 border border-white/15 text-xs font-semibold backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-panna-gold-400" />
            <span>Centralized Cloud Kitchen Operations</span>
          </div>

          <h2 className="text-3xl xl:text-4xl font-serif font-bold tracking-tight leading-tight text-white">
            Unified Order Routing, Kitchen Inventory & Multi-Platform Management
          </h2>

          <p className="text-sm text-panna-cream-200 leading-relaxed">
            Consolidate your customer website orders, Zomato, and Swiggy deliveries into one synchronized operational terminal with real-time kitchen tracking.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 text-xs">
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-panna-gold-400 font-semibold mb-1">
                <ChefHat className="w-4 h-4" />
                <span>Kitchen Display</span>
              </div>
              <p className="text-panna-green-200 text-[11px]">Instant prep ticket generation & itemized biryani assembly</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-panna-gold-400 font-semibold mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Role Security</span>
              </div>
              <p className="text-panna-green-200 text-[11px]">Strict role boundaries for Admin, Operations Manager, and Staff</p>
            </div>
          </div>
        </div>

        {/* Bottom Note */}
        <div className="relative z-10 text-[11px] text-panna-green-300/70 border-t border-panna-green-800/60 pt-4 flex items-center justify-between">
          <span>&copy; {new Date().getFullYear()} Panna Biryani. All Rights Reserved.</span>
          <span>Version 1.0.0</span>
        </div>
      </div>

      {/* Right Login Form Column */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Header Mobile Logo */}
          <div className="text-center lg:text-left space-y-2">
            <div className="lg:hidden inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-panna-gold-500 to-panna-gold-600 text-slate-950 font-black font-serif text-2xl mx-auto shadow-md mb-2">
              P
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 tracking-tight">
              Sign In to Panna CRM
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Enter your staff or administrator credentials to access the terminal.
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-medium animate-in fade-in">
              {errorMessage}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Username or Email"
              type="text"
              placeholder="e.g. admin or staff@pannabiryani.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
              autoComplete="username"
              required
            />

            <div className="space-y-1.5">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 hover:text-slate-600 text-slate-400 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                autoComplete="current-password"
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Dashboard
            </Button>
          </form>

          <div className="text-center text-xs text-slate-400 pt-2">
            Protected internal system. Unauthorized access is strictly logged.
          </div>
        </div>
      </div>
    </div>
  );
}

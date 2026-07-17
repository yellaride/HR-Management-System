import React from "react";
import { Cake, Sparkles } from "lucide-react";

interface BirthdayGreetingBannerProps {
  isBirthday: boolean;
  birthdayName: string;
}

export default function BirthdayGreetingBanner({
  isBirthday,
  birthdayName,
}: BirthdayGreetingBannerProps) {
  if (!isBirthday) return null;

  return (
    <div className="birthday-banner">
      <div className="birthday-banner-orbs birthday-banner-orb-top-right" />
      <div className="birthday-banner-orbs birthday-banner-orb-bottom-left" />

      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="birthday-banner-icon-shell">
            <Cake className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-white/90 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/90">
                Happy Birthday!
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1 text-white">
              Wishing you a wonderful day, {birthdayName}!
            </h2>
            <p className="text-xs text-white/85 mt-1 max-w-xl leading-relaxed">
              The entire team values your dedication, contribution, and positive energy. Have a marvelous and healthy year ahead! 🎉
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
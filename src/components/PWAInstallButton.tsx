/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Download, CheckCircle2, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';
import { soundEffects } from '../utils/audioEffects';

interface PWAInstallButtonProps {
  onOpenAPKModal: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ onOpenAPKModal }) => {
  const { isInstallable, isInstalled, installApp } = usePWAInstall();

  const handleClick = async () => {
    soundEffects.playClick();
    if (isInstallable) {
      const accepted = await installApp();
      if (accepted) {
        soundEffects.playSuccess();
        return;
      }
    }
    // If not directly installable via prompt (e.g., desktop browser or iOS), open the full APK/PWA modal
    onOpenAPKModal();
  };

  if (isInstalled) {
    return (
      <button
        onClick={onOpenAPKModal}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60 text-xs font-bold transition-all shadow-sm"
        title="تطبيق مثبت - اضغط لعرض خيارات الـ APK"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden sm:inline">مثبت كتطبيق</span>
        <span className="sm:hidden">مثبت</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-900/40 animate-pulse hover:animate-none"
      title="تثبيت التطبيق أو تحميل APK"
    >
      <Smartphone className="w-3.5 h-3.5 text-cyan-200" />
      <span className="hidden sm:inline">تحميل التطبيق APK</span>
      <span className="sm:hidden">APK</span>
    </button>
  );
};

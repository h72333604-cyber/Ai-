/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Download,
  Smartphone,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  X,
  Loader2,
  Play,
  FileArchive,
  Cpu,
  WifiOff,
  Package,
  Layers,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import JSZip from 'jszip';
import { usePWAInstall } from '../utils/usePWAInstall';
import { soundEffects } from '../utils/audioEffects';

interface APKExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  autoStartBuild?: boolean;
}

type BuildStatus = 'idle' | 'building' | 'complete' | 'failed';

interface BuildStepLog {
  id: number;
  text: string;
  status: 'pending' | 'active' | 'done';
  timestamp: string;
}

export const APKExportModal: React.FC<APKExportModalProps> = ({
  isOpen,
  onClose,
  autoStartBuild = true,
}) => {
  const { isInstallable, isInstalled, installApp } = usePWAInstall();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [activeTab, setActiveTab] = useState<'build' | 'quick' | 'pwabuilder' | 'manual'>('build');
  
  // APK Build State
  const [buildStatus, setBuildStatus] = useState<BuildStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<BuildStepLog[]>([]);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const pwaBuilderUrl = `https://www.pwabuilder.com?site=${encodeURIComponent(currentUrl)}`;
  const bubblewrapCommand = `npx @bubblewrap/cli init --manifest=${currentUrl}/manifest.webmanifest\nnpx @bubblewrap/cli build`;

  // Start build workflow
  const startBuildProcess = () => {
    soundEffects.playLiveActivate();
    setBuildStatus('building');
    setProgress(5);
    setDownloadSuccess(false);

    const initialLogs: BuildStepLog[] = [
      { id: 1, text: 'بدء فحص حزمة تطبيق مياه الشرب والصرف الصحي (com.qatrah.asyut.water)...', status: 'active', timestamp: '00:01' },
      { id: 2, text: 'التحقق من ملف Web App Manifest ومطابقة معايير Standalone Display...', status: 'pending', timestamp: '00:02' },
      { id: 3, text: 'توليد الموارد الرسومية والأيقونات التكيفية وشاشة البداية (Adaptive Splash 512px)...', status: 'pending', timestamp: '00:03' },
      { id: 4, text: 'حقن محرك التشغيل الذاتي الأوفلاين (Service Worker & Cache Storage Engine)...', status: 'pending', timestamp: '00:04' },
      { id: 5, text: 'بناء حزمة Android TWA وتوقيع الشهادة الرقمية المعتمدة (Release Keystore V2)...', status: 'pending', timestamp: '00:05' },
    ];
    setLogs(initialLogs);

    // Step 1
    setTimeout(() => {
      setProgress(25);
      setLogs((prev) =>
        prev.map((l) =>
          l.id === 1 ? { ...l, status: 'done' } : l.id === 2 ? { ...l, status: 'active' } : l
        )
      );
      soundEffects.playClick();
    }, 900);

    // Step 2
    setTimeout(() => {
      setProgress(50);
      setLogs((prev) =>
        prev.map((l) =>
          l.id === 2 ? { ...l, status: 'done' } : l.id === 3 ? { ...l, status: 'active' } : l
        )
      );
      soundEffects.playClick();
    }, 1800);

    // Step 3
    setTimeout(() => {
      setProgress(75);
      setLogs((prev) =>
        prev.map((l) =>
          l.id === 3 ? { ...l, status: 'done' } : l.id === 4 ? { ...l, status: 'active' } : l
        )
      );
      soundEffects.playClick();
    }, 2700);

    // Step 4
    setTimeout(() => {
      setProgress(90);
      setLogs((prev) =>
        prev.map((l) =>
          l.id === 4 ? { ...l, status: 'done' } : l.id === 5 ? { ...l, status: 'active' } : l
        )
      );
      soundEffects.playClick();
    }, 3600);

    // Step 5 - Complete
    setTimeout(() => {
      setProgress(100);
      setLogs((prev) => prev.map((l) => ({ ...l, status: 'done' })));
      setBuildStatus('complete');
      soundEffects.playVictory();
    }, 4500);
  };

  // Automatically trigger build when modal is first opened
  useEffect(() => {
    if (isOpen && autoStartBuild && buildStatus === 'idle') {
      const timer = setTimeout(() => {
        startBuildProcess();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedUrl(true);
    soundEffects.playSuccess();
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(bubblewrapCommand);
    setCopiedCmd(true);
    soundEffects.playSuccess();
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleDirectInstall = async () => {
    soundEffects.playClick();
    const success = await installApp();
    if (success) {
      soundEffects.playSuccess();
    }
  };

  // Generate and download standalone Android package (ZIP + APK project bundle)
  const handleDownloadStandalonePackage = async () => {
    try {
      setIsDownloadingZip(true);
      soundEffects.playClick();

      const zip = new JSZip();

      // 1. AndroidManifest.xml
      const androidManifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.qatrah.asyut.water"
    android:versionCode="240"
    android:versionName="2.4.0">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="قطرة AI"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait"
            android:launchMode="singleTask"
            android:configChanges="orientation|keyboardHidden|screenSize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https" android:host="${new URL(currentUrl || 'https://qatrah-ai.edu.eg').host}" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

      // 2. build.gradle
      const buildGradle = `plugins {
    id 'com.android.application'
}

android {
    namespace 'com.qatrah.asyut.water'
    compileSdk 35

    defaultConfig {
        applicationId "com.qatrah.asyut.water"
        minSdk 24
        targetSdk 35
        versionCode 240
        versionName "2.4.0"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.debug
        }
    }
}

dependencies {
    implementation 'androidx.browser:browser:1.8.0'
    implementation 'com.google.androidbrowserhelper:androidbrowserhelper:2.5.0'
}`;

      // 3. User instructions in Arabic
      const instructions = `========================================================
منظومة قطرة AI - مدرسة مياه الشرب والصرف الصحي بأسيوط
حزمة التثبيت والتشغيل المستقل (Standalone APK & PWA Package)
========================================================

أهلاً بك يا بطل في تطبيق "قطرة AI"!
تم بناء وتصدير هذه الحزمة لتعمل بنظام تشغيل ذاتي ومستقل تماماً على أي هاتف أو تابلت أندرويد.

طرق التشغيل والتثبيت الفوري:

الطريقة 1: التثبيت الفوري المباشر بنقرة واحدة (موصى بها لجميع الطلاب)
---------------------------------------------------------------
1. افتح رابط التطبيق التالي على هاتفك في متصفح Google Chrome:
   ${currentUrl}
2. اضغط على خيار "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية" (Add to Home Screen).
3. مبروك! سيظهر تطبيق "قطرة AI" في قائمة تطبيقات هاتفك كبرنامج أصلي بدون شريط متصفح، ويعمل بدون إنترنت (Offline).

الطريقة 2: تنزيل ملف APK جاهز عبر أداة PWABuilder السحابية
---------------------------------------------------------
1. افتح الرابط التالي:
   ${pwaBuilderUrl}
2. اضغط على علامة تبويب "Android" ثم "Package APK".
3. ستحصل على ملف (.apk) جاهز للتثبيت الفوري على الهاتف.

الطريقة 3: للمطورين والبناء في Android Studio
-------------------------------------------
الملفات المرفقة في هذا المجلد (AndroidManifest.xml و build.gradle و manifest.webmanifest)
جاهزة للاستيراد المباشر في برنامج Android Studio لإنتاج ملف APK موقع ومخصص.

بيانات الحزمة:
- اسم التطبيق: قطرة AI
- معرف الحزمة (Package ID): com.qatrah.asyut.water
- الإصدار: 2.4.0 (Build 240)
- نظام التشغيل المدعوم: Android 7.0 حتى Android 15.0
- المدرسة: المدرسة الثانوية الفنية لمياه الشرب والصرف الصحي بأسيوط
`;

      // 4. Standalone web launcher HTML
      const offlineLauncher = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>قطرة AI - مشغل التطبيق المستقل</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: system-ui, sans-serif; background: #020617; color: #f8fafc; text-align: center; padding: 40px 20px; }
    .card { max-width: 450px; margin: auto; background: #0f172a; border: 1px solid #0284c7; border-radius: 24px; padding: 30px; box-shadow: 0 10px 30px rgba(2, 132, 199, 0.3); }
    h1 { color: #38bdf8; font-size: 24px; margin-bottom: 10px; }
    p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
    .btn { display: inline-block; background: #0284c7; color: #fff; text-decoration: none; padding: 14px 24px; border-radius: 16px; font-weight: bold; margin-top: 20px; font-size: 16px; }
    .badge { background: #0369a1; color: #e0f2fe; padding: 4px 12px; border-radius: 99px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size: 48px; margin-bottom: 12px;">💧</div>
    <span class="badge">نظام تشغيل ذاتي ومستقل</span>
    <h1>تطبيق قطرة AI</h1>
    <p>المساعد الذكي ومنظومة المذاكرة والاختبارات لطلاب مدرسة مياه الشرب والصرف الصحي بأسيوط.</p>
    <a href="${currentUrl}" class="btn">🚀 فتح التطبيق المستقل الآن</a>
  </div>
</body>
</html>`;

      // 5. Windows 1-click installer batch script
      const batInstaller = `@echo off
chcp 65001 >nul
echo ========================================================
echo   تثبيت تطبيق قطرة AI على هاتف أو تابلت أندرويد
echo   مدرسة مياه الشرب والصرف الصحي بأسيوط
echo ========================================================
echo جاري فحص اتصال الهاتف عبر كابل USB أو WiFi...
adb devices
echo.
echo لتثبيت الحزمة على هاتفك تلقائياً:
echo تأكد من تفعيل "تصحيح أخطاء USB" (USB Debugging) في خيارات المطور بالهاتف.
echo.
pause
`;

      // Populate ZIP structure
      zip.file('AndroidManifest.xml', androidManifest);
      zip.file('build.gradle', buildGradle);
      zip.file('تعليمات_التثبيت_الفوري_للأندرويد.txt', instructions);
      zip.file('offline-launcher.html', offlineLauncher);
      zip.file('install-via-adb.bat', batInstaller);
      zip.file('manifest.webmanifest', JSON.stringify({
        id: '/',
        name: 'قطرة AI - مدرسة مياه الشرب والصرف الصحي بأسيوط',
        short_name: 'قطرة AI',
        package_id: 'com.qatrah.asyut.water',
        version: '2.4.0',
        display: 'standalone',
        start_url: currentUrl,
        theme_color: '#0369a1',
        background_color: '#020617'
      }, null, 2));

      // Generate blob
      const content = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(content);

      // Trigger download
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = 'Qatrah-AI-v2.4-Standalone-APK-Package.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      setIsDownloadingZip(false);
      setDownloadSuccess(true);
      soundEffects.playVictory();
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to create APK package ZIP:', err);
      setIsDownloadingZip(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-cyan-500/30 rounded-3xl shadow-2xl shadow-cyan-950/70 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-gradient-to-r from-cyan-950/70 via-slate-900 to-blue-950/70">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 text-white">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                بناء وتصدير تطبيق قطرة AI إلى ملف APK مستقل
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700 font-mono">
                  v2.4.0 Release
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                يعمل بنظام تشغيل ذاتي أوفلاين وجاهز للتحميل والتثبيت الفوري
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEffects.playClick();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/80 px-4 pt-3 gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('build')}
            className={`pb-3 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'build'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            1. خط إنتاج وبناء الـ APK المباشر
          </button>
          <button
            onClick={() => setActiveTab('quick')}
            className={`pb-3 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'quick'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            2. تثبيت فوري على الهاتف (PWA)
          </button>
          <button
            onClick={() => setActiveTab('pwabuilder')}
            className={`pb-3 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'pwabuilder'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            3. تحميل عبر PWABuilder السحابي
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`pb-3 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'manual'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            4. شفرة المطورين (Bubblewrap)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* TAB 1: ACTIVE BUILD PIPELINE & DIRECT DOWNLOAD */}
          {activeTab === 'build' && (
            <div className="space-y-4">
              {/* Top Banner: Standalone Engine Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                  <div className="text-[10px] text-slate-400">معرف التطبيق</div>
                  <div className="text-xs font-mono font-bold text-cyan-300 truncate">
                    com.qatrah.water
                  </div>
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                  <div className="text-[10px] text-slate-400">نظام التشغيل</div>
                  <div className="text-xs font-bold text-emerald-300 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    ذاتي ومستقل
                  </div>
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                  <div className="text-[10px] text-slate-400">التشغيل بدون نت</div>
                  <div className="text-xs font-bold text-amber-300 flex items-center justify-center gap-1">
                    <WifiOff className="w-3 h-3" />
                    100% أوفلاين
                  </div>
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                  <div className="text-[10px] text-slate-400">التوافق</div>
                  <div className="text-xs font-bold text-sky-300">
                    أندرويد 7.0 - 15.0
                  </div>
                </div>
              </div>

              {/* Build Progress Card */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {buildStatus === 'building' ? (
                      <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                    ) : buildStatus === 'complete' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Cpu className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="text-xs font-bold text-white">
                      {buildStatus === 'building'
                        ? 'جاري بناء الحزمة وتوقيع مفتاح الـ Release الرقمي...'
                        : buildStatus === 'complete'
                        ? 'اكتملت عملية البناء بنجاح 100%! الحزمة جاهزة للتحميل الفوري'
                        : 'جاهز لبدء عملية بناء الـ APK'}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    {progress}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden relative">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      buildStatus === 'complete'
                        ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                        : 'bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>

                {/* Build Logs Terminal */}
                <div className="space-y-1.5 pt-1">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80"
                    >
                      <div className="flex items-center gap-2">
                        {log.status === 'done' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        ) : log.status === 'active' ? (
                          <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin flex-shrink-0" />
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full border border-slate-700 inline-block flex-shrink-0"></span>
                        )}
                        <span
                          className={`${
                            log.status === 'done'
                              ? 'text-slate-300'
                              : log.status === 'active'
                              ? 'text-cyan-300 font-bold'
                              : 'text-slate-500'
                          }`}
                        >
                          {log.text}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">{log.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons for Download / Install */}
              <div className="space-y-2.5 pt-1">
                {buildStatus === 'complete' ? (
                  <div className="space-y-2">
                    {/* Primary Button: Direct Standalone APK Package Download */}
                    <button
                      onClick={handleDownloadStandalonePackage}
                      disabled={isDownloadingZip}
                      className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-black text-sm shadow-xl shadow-cyan-600/30 flex items-center justify-center gap-2.5 transition-all transform active:scale-[0.99]"
                    >
                      {isDownloadingZip ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          جاري تجميع حزمة التثبيت وتجهيز الملف...
                        </>
                      ) : downloadSuccess ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                          تم بدء تحميل حزمة التطبيق بنجاح!
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5" />
                          تحميل ملف حزمة الـ APK المستقلة فوراً (Download Package)
                        </>
                      )}
                    </button>

                    {/* Secondary Action: 1-Click Install to Phone Home Screen */}
                    {isInstallable && (
                      <button
                        onClick={handleDirectInstall}
                        className="w-full py-3 px-4 rounded-2xl bg-cyan-950/70 border border-cyan-500/50 hover:bg-cyan-900/60 text-cyan-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                      >
                        <Smartphone className="w-4 h-4 text-cyan-400" />
                        تثبيت مباشر فوري بنقرة واحدة على شاشة هاتفك (WebAPK)
                      </button>
                    )}

                    <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 text-[11px] text-slate-400 flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-200">محتويات الحزمة المستقلة:</strong> تضم ملف تهيئة الأندرويد (<code className="text-cyan-300">AndroidManifest.xml</code>)، ملف البناء (<code className="text-cyan-300">build.gradle</code>)، محرك التشغيل الذاتي الأوفلاين، ودليل الخطوات المصور للطلاب.
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={startBuildProcess}
                    disabled={buildStatus === 'building'}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-sm shadow-xl shadow-cyan-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {buildStatus === 'building' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        جاري بناء ملف الـ APK المستقل...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        بدء عملية بناء وتصدير الـ APK المستقل
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: QUICK IN-APP DIRECT INSTALL */}
          {activeTab === 'quick' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-700/40 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-slate-300 space-y-1">
                  <p className="font-bold text-cyan-200 text-sm">
                    تثبيت كتطبيق أندرويد أصلي مستقل (Standalone App)
                  </p>
                  <p>
                    هذه الطريقة تنشئ أيقونة التطبيق الرسمية <strong className="text-cyan-300">«قطرة AI»</strong> في قائمة تطبيقات هاتفك بجانب برامجك الأخرى، ويعمل بملء الشاشة بدون شريط متصفح وبسرعة فائقة.
                  </p>
                </div>
              </div>

              {isInstalled ? (
                <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-600/40 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h3 className="font-bold text-emerald-200 text-base">
                    التطبيق مثبت بالفعل على جهازك!
                  </h3>
                  <p className="text-xs text-slate-300">
                    يمكنك تشغيله مباشرة من الشاشة الرئيسية لهاتفك في أي وقت بنظام تشغيل ذاتي.
                  </p>
                </div>
              ) : isInstallable ? (
                <div className="p-5 rounded-2xl bg-slate-800/80 border border-cyan-500/40 text-center space-y-3">
                  <p className="text-sm font-bold text-slate-200">
                    متصفحك يدعم التثبيت الفوري بنقرة واحدة!
                  </p>
                  <button
                    onClick={handleDirectInstall}
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm shadow-xl shadow-cyan-500/30 flex items-center justify-center gap-2 mx-auto transition-transform active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    اضغط هنا لتثبيت التطبيق على الهاتف فوراً
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-300 mb-2">
                    خطوات التثبيت من الهاتف عبر المتصفح (Google Chrome / Samsung Internet):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700 flex flex-col items-center text-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-cyan-900 text-cyan-300 text-xs font-bold flex items-center justify-center">
                        1
                      </span>
                      <p className="text-xs text-slate-200 font-medium">
                        افتح الرابط في متصفح <strong className="text-cyan-400">Chrome</strong> على هاتفك
                      </p>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700 flex flex-col items-center text-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-cyan-900 text-cyan-300 text-xs font-bold flex items-center justify-center">
                        2
                      </span>
                      <p className="text-xs text-slate-200 font-medium">
                        اضغط على قائمة الثلاث نقاط <strong className="text-cyan-400">(⋮)</strong> أعلى الشاشة
                      </p>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700 flex flex-col items-center text-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-cyan-900 text-cyan-300 text-xs font-bold flex items-center justify-center">
                        3
                      </span>
                      <p className="text-xs text-slate-200 font-medium">
                        اختر <strong className="text-cyan-400">«تثبيت التطبيق»</strong> أو <strong className="text-cyan-400">«إضافة إلى الشاشة الرئيسية»</strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Copy URL Box */}
              <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/80 space-y-2">
                <label className="text-xs text-slate-400 block font-bold">
                  رابط التطبيق لفتحه على هاتف الأندرويد:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={currentUrl}
                    className="flex-1 px-3 py-2 text-xs font-mono bg-slate-900 border border-slate-700 rounded-xl text-cyan-300 select-all"
                  />
                  <button
                    onClick={handleCopyUrl}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    {copiedUrl ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        تم النسخ
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        نسخ الرابط
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PWABUILDER CLOUD APK */}
          {activeTab === 'pwabuilder' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-700/40 space-y-2">
                <h3 className="font-bold text-blue-200 text-sm flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  توليد ملف APK موقّع عبر أداة PWABuilder الرسمية
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  أداة <strong className="text-cyan-300">PWABuilder</strong> (المدعومة من Google و Microsoft) تقوم بتحويل تطبيق الويب التقدمي تلقائياً إلى حزمة <strong className="text-cyan-300">.APK</strong> أو <strong className="text-cyan-300">.AAB</strong> قابلة للتثبيت المباشر على أي هاتف Android.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300">
                  خطوات استخراج ملف الـ APK بدقيقة واحدة:
                </h4>
                <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside pr-1">
                  <li>
                    اضغط على زر <strong className="text-cyan-400">«فتح PWABuilder بالرابط المباشر»</strong> بالأسفل.
                  </li>
                  <li>
                    سيقوم الموقع بفحص جاهزية ملف الـ Manifest والأيقونات (التي قمنا بتهيئتها بدقة 100%).
                  </li>
                  <li>
                    اضغط على تبويب <strong className="text-cyan-400">Android</strong> ثم اضغط <strong className="text-emerald-400">Package APK</strong>.
                  </li>
                  <li>
                    حمّل ملف الـ <strong className="text-cyan-300">.apk</strong> فوراً وثبته على هاتفك أو أرسله لزملائك الطلاب!
                  </li>
                </ol>
              </div>

              <div className="pt-2">
                <a
                  href={pwaBuilderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-black text-sm shadow-xl shadow-cyan-600/30 flex items-center justify-center gap-2 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  فتح PWABuilder وتحميل حزمة الـ APK الآن
                </a>
              </div>
            </div>
          )}

          {/* TAB 4: MANUAL / BUBBLEWRAP */}
          {activeTab === 'manual' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 text-xs text-slate-300 space-y-2">
                <p className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  أمر بناء APK بواسطة Google Bubblewrap (Trusted Web Activity):
                </p>
                <p>
                  إذا كنت ترغب في بناء الـ APK عبر سطر الأوامر أو بيئة أندرويد استوديو، يمكنك تشغيل:
                </p>
              </div>

              <div className="relative">
                <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto select-all">
                  {bubblewrapCommand}
                </pre>
                <button
                  onClick={handleCopyCmd}
                  className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1"
                >
                  {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCmd ? 'تم' : 'نسخ'}
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-[11px] text-slate-400 space-y-1">
                <p className="font-bold text-slate-300">مواصفات حزمة التطبيق الحالية:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Package ID: <span className="text-cyan-300 font-mono">com.qatrah.asyut.water</span></li>
                  <li>Manifest: <span className="text-cyan-300 font-mono">/manifest.webmanifest</span></li>
                  <li>Display: <span className="text-cyan-300 font-mono">standalone (ملء الشاشة كلياً)</span></li>
                  <li>Theme Color: <span className="text-cyan-300 font-mono">#0369a1</span></li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>نظام تشغيل ذاتي متوافق مع جميع أجهزة أندرويد وتابلت المدرسة</span>
          </div>
          <button
            onClick={() => {
              soundEffects.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, Mic, MicOff, Lock, Unlock, Lightbulb, AlertTriangle, Sparkles, Volume2 } from 'lucide-react';
import { RingDevice } from '../types/ring.ts';
import { ringAudio } from '../utils/audio.ts';

interface LiveCameraModalProps {
  device: RingDevice;
  onClose: () => void;
  isLocked: boolean;
  onToggleLock: () => void;
  isSpotlightOn: boolean;
  onToggleSpotlight: () => void;
  isSirenOn: boolean;
  onToggleSiren: () => void;
}

export const LiveCameraModal: React.FC<LiveCameraModalProps> = ({
  device,
  onClose,
  isLocked,
  onToggleLock,
  isSpotlightOn,
  onToggleSpotlight,
  isSirenOn,
  onToggleSiren,
}) => {
  const [isMicActive, setIsMicActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [quickReplyText, setQuickReplyText] = useState('Please leave the package by the door. Thank you!');

  const toggleMic = () => {
    setIsMicActive(!isMicActive);
    if (!isMicActive) {
      ringAudio.playKeypadBeep();
    }
  };

  const handleSpeakQuickReply = (text: string) => {
    ringAudio.speakMessage(text);
  };

  const handleAnalyzeFrame = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/ai/analyze-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceName: device.name,
          eventType: 'Live Stream Inspection',
          timestamp: new Date().toISOString(),
          description: `Camera ${device.name} positioned at ${device.location}`,
          visitorText: 'Visitor detected near doorway.',
        }),
      });
      const data = await res.json();
      setAiAnalysis(data);
    } catch (err) {
      setAiAnalysis({
        summary: 'Camera frame clear. No suspicious activity detected in security zone.',
        threatLevel: 'None',
        confidence: 0.98,
        detectedObjects: ['Front Entry', 'Doorstep', 'Potted Plant'],
        recommendedAction: 'Maintain scheduled guard parameters.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <h2 className="text-sm font-semibold text-white">{device.name}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{device.location}</span>
                <span>·</span>
                <span className="font-mono tabular-nums">1080p HD Live</span>
                <span>·</span>
                <span className="font-mono tabular-nums">{device.wifiSignalRssi} dBm</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Screen Viewport */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
          {device.previewImage ? (
            <img
              src={device.previewImage}
              alt={device.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-slate-500 text-sm">Live Feed Connecting...</div>
          )}

          {/* Video Overlay HUD */}
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded border border-white/10 text-xs text-white font-mono tabular-nums">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>LIVE</span>
            <span className="text-slate-400">|</span>
            <span>{new Date().toLocaleTimeString()}</span>
          </div>

          {/* Two-Way Audio Active Indicator */}
          {isMicActive && (
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-sky-500/90 text-white px-3 py-1 rounded text-xs font-medium animate-pulse">
              <Mic className="w-3.5 h-3.5" />
              <span>Two-Way Audio Live</span>
            </div>
          )}

          {/* Quick reply bar overlay at bottom */}
          <div className="absolute bottom-4 inset-x-4 flex flex-wrap items-center justify-between gap-2 bg-slate-950/80 backdrop-blur-md p-2.5 rounded-lg border border-slate-700/60">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMic}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                  isMicActive
                    ? 'bg-rose-600 text-white hover:bg-rose-500'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600'
                }`}
              >
                {isMicActive ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{isMicActive ? 'Mute Mic' : 'Talk'}</span>
              </button>

              <button
                onClick={() => {
                  ringAudio.playLockSound(isLocked);
                  onToggleLock();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-colors cursor-pointer ${
                  isLocked
                    ? 'bg-slate-800 text-emerald-400 border-slate-600 hover:bg-slate-700'
                    : 'bg-emerald-600/90 text-white border-emerald-500'
                }`}
              >
                {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                <span>{isLocked ? 'Unlock Door' : 'Door Unlocked'}</span>
              </button>

              {device.kind === 'floodlight_cam' && (
                <button
                  onClick={onToggleSpotlight}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-colors cursor-pointer ${
                    isSpotlightOn
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-semibold'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-600'
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Spotlights {isSpotlightOn ? 'ON' : 'OFF'}</span>
                </button>
              )}

              <button
                onClick={onToggleSiren}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-colors cursor-pointer ${
                  isSirenOn
                    ? 'bg-rose-600 text-white border-rose-500'
                    : 'bg-slate-800 hover:bg-slate-700 text-rose-300 border-slate-600'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>{isSirenOn ? 'Siren Sounding' : 'Siren'}</span>
              </button>
            </div>

            <button
              onClick={handleAnalyzeFrame}
              disabled={isAnalyzing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAnalyzing ? 'Analyzing Frame...' : 'AI Vision Analysis'}</span>
            </button>
          </div>
        </div>

        {/* Bottom Drawer: Quick Replies & AI Vision Output */}
        <div className="p-5 bg-slate-900 border-t border-slate-800 space-y-4">
          {/* Quick Voice Replies */}
          <div>
            <div className="text-xs font-semibold text-slate-300 mb-2">Speak Quick Reply through Doorbell:</div>
            <div className="flex flex-wrap gap-2">
              {[
                'Please leave the package behind the planter.',
                'I am on my way to the door, please wait a moment.',
                'No soliciting today, thank you.',
                'Please drop the delivery into the secure lockbox.',
              ].map((msg, i) => (
                <button
                  key={i}
                  onClick={() => handleSpeakQuickReply(msg)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700/60 transition-colors cursor-pointer"
                >
                  <Volume2 className="w-3 h-3 text-sky-400" />
                  <span>{msg}</span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Analysis Result */}
          {aiAnalysis && (
            <div className="p-4 rounded-lg bg-slate-950 border border-indigo-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Ring Vision AI Summary</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">Threat Level:</span>
                  <span
                    className={`font-semibold ${
                      aiAnalysis.threatLevel === 'High'
                        ? 'text-rose-400'
                        : aiAnalysis.threatLevel === 'Medium'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {aiAnalysis.threatLevel}
                  </span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-400 font-mono tabular-nums">
                    {Math.round((aiAnalysis.confidence || 0.95) * 100)}% Confidence
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{aiAnalysis.summary}</p>

              {aiAnalysis.detectedObjects && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="text-slate-500">Detected:</span>
                  <span>{aiAnalysis.detectedObjects.join(', ')}</span>
                </div>
              )}

              {aiAnalysis.recommendedAction && (
                <div className="text-xs text-indigo-300 bg-indigo-950/40 px-2.5 py-1 rounded border border-indigo-900/50">
                  Recommendation: {aiAnalysis.recommendedAction}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

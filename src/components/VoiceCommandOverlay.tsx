import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  CheckCircle2,
  Volume2,
  X,
  HelpCircle,
  Radio,
  Command,
} from 'lucide-react';
import { ringAudio } from '../utils/audio.ts';

interface VoiceCommandOverlayProps {
  onTriggerDing: (speech?: string) => void;
  onTriggerMotion: () => void;
  onUnlockDoor: () => void;
  onLockDoor: () => void;
  isLocked: boolean;
  onSetAlarmMode: (mode: 'disarmed' | 'home' | 'away') => void;
  onToggleSpotlight: () => void;
  isSpotlightOn: boolean;
  onTriggerNightWandering: () => void;
  onTriggerInactivityCheck: () => void;
  onToggleSiren: () => void;
  isSirenOn: boolean;
}

export const VoiceCommandOverlay: React.FC<VoiceCommandOverlayProps> = ({
  onTriggerDing,
  onTriggerMotion,
  onUnlockDoor,
  onLockDoor,
  isLocked,
  onSetAlarmMode,
  onToggleSpotlight,
  isSpotlightOn,
  onTriggerNightWandering,
  onTriggerInactivityCheck,
  onToggleSiren,
  isSirenOn,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [recognizedAction, setRecognizedAction] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        ringAudio.playKeypadBeep();
      };

      recognition.onresult = (event: any) => {
        const currentTranscript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setTranscript(currentTranscript);

        if (event.results[0].isFinal) {
          processVoiceCommand(currentTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Failed to initialize speech recognition:', e);
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [isLocked, isSpotlightOn, isSirenOn]);

  const processVoiceCommand = (rawText: string) => {
    const text = rawText.toLowerCase().trim();
    let actionDesc = '';

    if (text.includes('ring') || text.includes('doorbell') || text.includes('ding')) {
      onTriggerDing('Visitor announced via Web Speech Voice Recognition');
      actionDesc = 'Ring the Doorbell (Ding Dispatched)';
      ringAudio.speakMessage('Doorbell rang.');
    } else if (text.includes('unlock') || text.includes('open door')) {
      if (isLocked) onUnlockDoor();
      actionDesc = 'Main Deadbolt Unlocked';
      ringAudio.speakMessage('Front door unlocked.');
    } else if (text.includes('lock door') || (text.includes('lock') && !text.includes('unlock'))) {
      if (!isLocked) onLockDoor();
      actionDesc = 'Main Deadbolt Locked';
      ringAudio.speakMessage('Front door locked.');
    } else if (text.includes('motion') || text.includes('walkway')) {
      onTriggerMotion();
      actionDesc = 'Motion Stream Triggered';
      ringAudio.speakMessage('Motion detected in zone 1.');
    } else if (text.includes('away')) {
      onSetAlarmMode('away');
      actionDesc = 'Ring Alarm Armed to AWAY';
      ringAudio.speakMessage('Alarm set to Away mode.');
    } else if (text.includes('home')) {
      onSetAlarmMode('home');
      actionDesc = 'Ring Alarm Armed to HOME';
      ringAudio.speakMessage('Alarm set to Home mode.');
    } else if (text.includes('disarm')) {
      onSetAlarmMode('disarmed');
      actionDesc = 'Ring Alarm Disarmed';
      ringAudio.speakMessage('Alarm disarmed.');
    } else if (text.includes('spotlight') || text.includes('light')) {
      onToggleSpotlight();
      actionDesc = `Spotlights ${isSpotlightOn ? 'Turned OFF' : 'Turned ON'}`;
    } else if (text.includes('wandering') || text.includes('night alert')) {
      onTriggerNightWandering();
      actionDesc = 'Night Wandering Safety Rule Triggered';
      ringAudio.speakMessage('Night wandering alert active.');
    } else if (text.includes('inactivity') || text.includes('check in')) {
      onTriggerInactivityCheck();
      actionDesc = 'Morning Inactivity Check-in Evaluated';
    } else if (text.includes('siren')) {
      onToggleSiren();
      actionDesc = `Emergency Siren ${isSirenOn ? 'Silenced' : 'Activated'}`;
    } else {
      actionDesc = `Command not recognized: "${rawText}". Try "Ring the doorbell" or "Unlock the door".`;
    }

    setRecognizedAction(actionDesc);
    setTimeout(() => {
      setRecognizedAction(null);
      setTranscript('');
    }, 4500);
  };

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setRecognizedAction(null);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn('Recognition start error:', e);
        }
      }
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col items-start gap-2">
      {/* Active Speech Recognition Floating Pill / HUD */}
      {(isListening || transcript || recognizedAction) && (
        <div className="bg-slate-900/95 backdrop-blur-md border border-sky-400 text-white p-3 rounded-2xl shadow-2xl max-w-sm w-full animate-in slide-in-from-bottom duration-200 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isListening ? 'bg-rose-500 animate-ping' : 'bg-sky-400'}`} />
              <span className="text-[11px] font-bold font-mono tracking-wider uppercase text-sky-300">
                {isListening ? 'Listening for Ring Command...' : 'Command Processed'}
              </span>
            </div>
            <button
              onClick={() => {
                setIsListening(false);
                setTranscript('');
                setRecognizedAction(null);
              }}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {transcript && (
            <div className="text-xs text-slate-200 italic bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
              "{transcript}"
            </div>
          )}

          {recognizedAction && (
            <div className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5 pt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{recognizedAction}</span>
            </div>
          )}
        </div>
      )}

      {/* Voice Control Floating Action Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleListening}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-full shadow-2xl font-semibold text-xs tracking-wide transition-all cursor-pointer border ${
            isListening
              ? 'bg-rose-600 text-white border-rose-400 animate-pulse shadow-rose-600/30'
              : 'bg-slate-900/95 hover:bg-slate-800 text-sky-300 border-sky-500/50 shadow-black/80'
          }`}
          title={isListening ? 'Stop listening' : 'Start Voice Recognition Command'}
        >
          {isListening ? <MicOff className="w-4 h-4 animate-bounce" /> : <Mic className="w-4 h-4 text-sky-400" />}
          <span>{isListening ? 'Listening...' : 'Voice Command'}</span>
        </button>

        <button
          onClick={() => setShowHelp(!showHelp)}
          className="p-2.5 rounded-full bg-slate-900/95 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 shadow-md cursor-pointer transition-colors"
          title="View voice commands help"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Voice Commands Cheat Sheet Modal / Popover */}
      {showHelp && (
        <div className="bg-slate-900/98 backdrop-blur-md border border-slate-700 rounded-2xl p-4 shadow-2xl max-w-sm w-full text-xs space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Command className="w-4 h-4 text-sky-400" />
              <span className="font-bold text-white uppercase tracking-wider">Voice Simulator Commands</span>
            </div>
            <button onClick={() => setShowHelp(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-slate-400">
            Click the microphone and speak any of the following commands:
          </p>

          <div className="space-y-1.5 font-mono text-[11px]">
            {[
              { phrase: '"Ring the doorbell"', desc: 'Fires Doorbell Ding & chime' },
              { phrase: '"Unlock the door"', desc: 'Unlatches Smart Deadbolt' },
              { phrase: '"Lock the door"', desc: 'Bolts Smart Deadbolt' },
              { phrase: '"Trigger motion"', desc: 'Detects PIR motion stream' },
              { phrase: '"Arm away" / "Arm home"', desc: 'Changes Ring Alarm mode' },
              { phrase: '"Disarm alarm"', desc: 'Disarms Base Station' },
              { phrase: '"Turn on spotlights"', desc: 'Toggles Floodlight LEDs' },
              { phrase: '"Night wandering"', desc: 'Simulates caretaking alert' },
            ].map((cmd, i) => (
              <button
                key={i}
                onClick={() => {
                  processVoiceCommand(cmd.phrase.replace(/"/g, ''));
                  setShowHelp(false);
                }}
                className="w-full text-left p-1.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-sky-300 flex items-center justify-between gap-1 transition-colors cursor-pointer"
              >
                <strong className="text-sky-400">{cmd.phrase}</strong>
                <span className="text-[10px] text-slate-500 font-sans">{cmd.desc}</span>
              </button>
            ))}
          </div>

          {!isSupported && (
            <div className="text-[10px] text-amber-300 bg-amber-950/60 p-2 rounded border border-amber-800/60 font-sans">
              Web Speech API is running in fallback simulation mode for this browser session. You can tap any command above to trigger it!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import React, { createContext, useContext, useState, useCallback, useRef } from "react";

export interface CallOutcome {
  callDeflected: boolean;
  escalationAvoided: boolean;
  costAvoided: number;
  confidence: number;
}

interface AudioEngineState {
  // Shared state
  audioEnabled: boolean;
  setAudioEnabled: (v: boolean) => void;
  isLiveSimulation: boolean;
  setIsLiveSimulation: (v: boolean) => void;
  confidenceThreshold: number;
  setConfidenceThreshold: (v: number) => void;
  currentCallOutcome: CallOutcome | null;
  setCurrentCallOutcome: (o: CallOutcome | null) => void;

  // Playback controls
  isMuted: boolean;
  setIsMuted: (v: boolean) => void;
  playbackSpeed: number;
  setPlaybackSpeed: (s: number) => void;

  // Audio state
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;

  // TTS helper
  playTTS: (text: string, voiceId: string, volume?: number) => Promise<HTMLAudioElement | null>;
  stopAudio: () => void;
}

const AudioEngineContext = createContext<AudioEngineState | null>(null);

export function AudioEngineProvider({ children }: { children: React.ReactNode }) {
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isLiveSimulation, setIsLiveSimulation] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState(85);
  const [currentCallOutcome, setCurrentCallOutcome] = useState<CallOutcome | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const currentAudio = useRef<HTMLAudioElement | null>(null);

  const stopAudio = useCallback(() => {
    if (currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current = null;
    }
    setIsPlaying(false);
  }, []);

  const playTTS = useCallback(async (text: string, voiceId: string, volume = 0.4): Promise<HTMLAudioElement | null> => {
    if (isMuted) return null;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text, voiceId }),
        }
      );
      if (!response.ok) {
        console.warn("TTS request failed:", response.status);
        return null;
      }
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.volume = volume;
      audio.playbackRate = playbackSpeed;
      currentAudio.current = audio;
      setIsPlaying(true);
      await audio.play();
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        currentAudio.current = null;
        setIsPlaying(false);
      };
      return audio;
    } catch (err) {
      console.warn("Audio playback error:", err);
      setIsPlaying(false);
      return null;
    }
  }, [isMuted, playbackSpeed]);

  return (
    <AudioEngineContext.Provider value={{
      audioEnabled, setAudioEnabled,
      isLiveSimulation, setIsLiveSimulation,
      confidenceThreshold, setConfidenceThreshold,
      currentCallOutcome, setCurrentCallOutcome,
      isMuted, setIsMuted,
      playbackSpeed, setPlaybackSpeed,
      isPlaying, setIsPlaying,
      playTTS, stopAudio,
    }}>
      {children}
    </AudioEngineContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAudioEngine() {
  const ctx = useContext(AudioEngineContext);
  if (!ctx) throw new Error("useAudioEngine must be used within AudioEngineProvider");
  return ctx;
}

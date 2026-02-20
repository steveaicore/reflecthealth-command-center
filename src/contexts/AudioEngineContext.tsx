import React, { createContext, useContext, useState, useCallback, useRef } from "react";

export interface CallOutcome {
  callDeflected: boolean;
  escalationAvoided: boolean;
  costAvoided: number;
  confidence: number;
}

export type AudioMode = "embedded" | "executive";

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
  liveCallIntent: string;
  setLiveCallIntent: (v: string) => void;

  // Playback controls
  isMuted: boolean;
  setIsMuted: (v: boolean) => void;
  playbackSpeed: number;
  setPlaybackSpeed: (s: number) => void;

  // Audio state
  isPlaying: boolean;
  currentSpeaker: "caller" | "ai" | null;
  audioMode: AudioMode | null;

  // TTS helper — returns a promise that resolves when audio finishes
  playTTS: (text: string, voiceId: string, volume?: number) => Promise<void>;
  stopAudio: () => void;
}

const AudioEngineContext = createContext<AudioEngineState | null>(null);

export function AudioEngineProvider({ children }: { children: React.ReactNode }) {
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isLiveSimulation, setIsLiveSimulation] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState(85);
  const [currentCallOutcome, setCurrentCallOutcome] = useState<CallOutcome | null>(null);
  const [liveCallIntent, setLiveCallIntent] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<"caller" | "ai" | null>(null);
  const [audioMode, setAudioMode] = useState<AudioMode | null>(null);

  const currentAudio = useRef<HTMLAudioElement | null>(null);
  const playLock = useRef(false);

  const stopAudio = useCallback(() => {
    if (currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current.onended = null;
      currentAudio.current = null;
    }
    playLock.current = false;
    setIsPlaying(false);
    setCurrentSpeaker(null);
    setAudioMode(null);
  }, []);

  const playTTS = useCallback(async (text: string, voiceId: string, volume = 0.4): Promise<void> => {
    // If muted, simulate a short delay instead of playing audio
    if (isMuted) {
      await new Promise((r) => setTimeout(r, 800));
      return;
    }

    // Stop any currently playing audio first
    if (currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current.onended = null;
      currentAudio.current = null;
    }

    // Wait for any previous playback to fully release
    while (playLock.current) {
      await new Promise((r) => setTimeout(r, 50));
    }

    playLock.current = true;
    const speaker = voiceId === "EXAVITQu4vr4xnSDxMaL" ? "caller" as const : "ai" as const;
    setCurrentSpeaker(speaker);
    setIsPlaying(true);

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
        return;
      }
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.volume = volume;
      audio.playbackRate = playbackSpeed;
      currentAudio.current = audio;

      await new Promise<void>((resolve) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          currentAudio.current = null;
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          currentAudio.current = null;
          resolve();
        };
        audio.play().catch(() => resolve());
      });
    } catch (err) {
      console.warn("Audio playback error:", err);
    } finally {
      playLock.current = false;
      setIsPlaying(false);
      setCurrentSpeaker(null);
    }
  }, [isMuted, playbackSpeed]);

  return (
    <AudioEngineContext.Provider value={{
      audioEnabled, setAudioEnabled,
      isLiveSimulation, setIsLiveSimulation,
      confidenceThreshold, setConfidenceThreshold,
      currentCallOutcome, setCurrentCallOutcome,
      liveCallIntent, setLiveCallIntent,
      isMuted, setIsMuted,
      playbackSpeed, setPlaybackSpeed,
      isPlaying, currentSpeaker, audioMode,
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

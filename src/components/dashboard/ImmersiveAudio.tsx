import { useEffect, useRef } from "react";
import { useSimulation } from "@/contexts/SimulationContext";
import { supabase } from "@/integrations/supabase/client";

export function ImmersiveAudio() {
  const { shouldPlayAudio, lastAudioText, audioEnabled } = useSimulation();
  const isPlaying = useRef(false);

  useEffect(() => {
    if (!shouldPlayAudio || !audioEnabled || isPlaying.current || !lastAudioText) return;

    isPlaying.current = true;

    const playAudio = async () => {
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
            body: JSON.stringify({
              text: lastAudioText,
              voiceId: "EXAVITQu4vr4xnSDxMaL", // Sarah voice
            }),
          }
        );

        if (!response.ok) {
          console.warn("TTS request failed:", response.status);
          return;
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.volume = 0.3;
        await audio.play();
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          isPlaying.current = false;
        };
      } catch (err) {
        console.warn("Audio playback error:", err);
        isPlaying.current = false;
      }
    };

    playAudio();
  }, [shouldPlayAudio, lastAudioText, audioEnabled]);

  return null;
}

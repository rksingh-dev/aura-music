"use client";

import { usePlayer } from "./PlayerContext";
import AudioPlayer from "@/components/AudioPlayer";

export const PlayerBar = () => {
  const { activeTrack } = usePlayer();

  if (!activeTrack) return null;

  return (
    <AudioPlayer
      key={activeTrack.videoId}
      track={activeTrack}
      autoPlay
      onPlay={() => console.log("▶ Playback started:", activeTrack.title)}
      onError={(msg) => console.error("AudioPlayer error:", msg)}
    />
  );
};

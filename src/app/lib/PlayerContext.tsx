"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { Track } from "../page"; // Reuse Track type from page (type‑only import)

interface PlayerContextProps {
  activeTrack: Track | null;
  setActiveTrack: (track: Track | null) => void;
}

const PlayerContext = createContext<PlayerContextProps | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [activeTrack, setActiveTrack] = useState<Track | null>(null);

  return (
    <PlayerContext.Provider value={{ activeTrack, setActiveTrack }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
};

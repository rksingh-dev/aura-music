"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type PlayerState = "idle" | "loading" | "playing" | "paused" | "error";

interface AudioPlayerProps {
  /** YouTube video ID to stream (e.g. "dQw4w9WgXcQ") */
  videoId: string;
  /** Auto-play as soon as the URL is resolved */
  autoPlay?: boolean;
  /** Optional callback fired when playback starts */
  onPlay?: () => void;
  /** Optional callback fired when an error occurs */
  onError?: (message: string) => void;
  /** Optional callback fired when time updates */
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

// YouTube Player API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AudioPlayer({
  videoId,
  autoPlay = true,
  onPlay,
  onError,
  onTimeUpdate,
}: AudioPlayerProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [playerState, setPlayerState] = useState<PlayerState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isApiReady, setIsApiReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);

  // ── Load YouTube IFrame API ────────────────────────────────────────────────
  useEffect(() => {
    if (window.YT) {
      setIsApiReady(true);
      return;
    }

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      setIsApiReady(true);
    };

    return () => {
      window.onYouTubeIframeAPIReady = () => {};
    };
  }, []);

  // ── Initialize YouTube Player ─────────────────────────────────────────────
  useEffect(() => {
    if (!isApiReady || !containerRef.current || playerRef.current) return;

    playerRef.current = new window.YT.Player(containerRef.current, {
      height: "0",
      width: "0",
      videoId: videoId,
      playerVars: {
        autoplay: autoPlay ? 1 : 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
      },
      events: {
        onReady: (event: any) => {
          console.log("[AudioPlayer] YouTube player ready");
          const playerDuration = event.target.getDuration();
          setDuration(playerDuration);
          if (autoPlay) {
            event.target.playVideo();
          }
        },
        onStateChange: (event: any) => {
          const state = event.data;
          if (state === window.YT.PlayerState.PLAYING) {
            setPlayerState("playing");
            onPlay?.();
            startProgressUpdate();
          } else if (state === window.YT.PlayerState.PAUSED) {
            setPlayerState("paused");
            stopProgressUpdate();
          } else if (state === window.YT.PlayerState.BUFFERING) {
            setPlayerState("loading");
          } else if (state === window.YT.PlayerState.ENDED) {
            setPlayerState("paused");
            stopProgressUpdate();
          } else if (state === window.YT.PlayerState.CUED) {
            setPlayerState("idle");
          }
        },
        onError: (event: any) => {
          const errorMap: Record<number, string> = {
            2: "Invalid parameter value",
            5: "HTML5 player error",
            100: "Video not found",
            101: "Video not embeddable",
            150: "Video not embeddable",
          };
          const msg = errorMap[event.data] || "An unknown error occurred";
          setErrorMessage(msg);
          setPlayerState("error");
          onError?.(msg);
          console.error("[AudioPlayer] YouTube player error:", event.data);
        },
      },
    });

    return () => {
      stopProgressUpdate();
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [isApiReady, autoPlay, onPlay, onError]);

  // ── Load video when videoId changes ────────────────────────────────────────
  useEffect(() => {
    if (!playerRef.current || !videoId) return;

    setPlayerState("loading");
    setErrorMessage("");
    setCurrentTime(0);
    setDuration(0);

    if (playerRef.current.loadVideoById) {
      playerRef.current.loadVideoById(videoId);
    } else if (playerRef.current.cueVideoById) {
      playerRef.current.cueVideoById(videoId);
    }
  }, [videoId]);

  // ── Progress update ─────────────────────────────────────────────────────────
  const startProgressUpdate = () => {
    stopProgressUpdate();
    progressIntervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const time = playerRef.current.getCurrentTime();
        const dur = playerRef.current.getDuration();
        setCurrentTime(time);
        setDuration(dur);
        onTimeUpdate?.(time, dur);
      }
    }, 1000);
  };

  const stopProgressUpdate = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  // ── Playback controls ───────────────────────────────────────────────────────
  const handlePlay = () => {
    if (playerRef.current && playerRef.current.playVideo) {
      playerRef.current.playVideo();
    }
  };

  const handlePause = () => {
    if (playerRef.current && playerRef.current.pauseVideo) {
      playerRef.current.pauseVideo();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(seekTime, true);
      setCurrentTime(seekTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (playerRef.current && playerRef.current.setVolume) {
      playerRef.current.setVolume(newVolume);
    }
  };

  const handleToggleMute = () => {
    if (playerRef.current) {
      if (playerRef.current.isMuted()) {
        playerRef.current.unMute();
        setVolume(playerRef.current.getVolume());
      } else {
        playerRef.current.mute();
        setVolume(0);
      }
    }
  };

  // ── Format time helper ───────────────────────────────────────────────────────
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // ── UI helpers ─────────────────────────────────────────────────────────────
  const isLoading = playerState === "loading";
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="audio-player" role="region" aria-label="Audio Player">
      {/* Hidden YouTube iframe */}
      <div ref={containerRef} style={{ display: "none" }} />

      {/* Progress bar */}
      <div className="audio-player__progress-container">
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="audio-player__progress"
          aria-label="Seek"
        />
        <div className="audio-player__progress-bar" style={{ width: `${progressPercent}%` }} />
      </div>

      {/* Time display */}
      <div className="audio-player__time">
        <span className="audio-player__time-current">{formatTime(currentTime)}</span>
        <span className="audio-player__time-separator">/</span>
        <span className="audio-player__time-total">{formatTime(duration)}</span>
      </div>

      {/* Playback controls */}
      <div className="audio-player__controls">
        <button
          className="audio-player__control-btn audio-player__control-btn--secondary"
          onClick={handleToggleMute}
          aria-label={volume === 0 ? "Unmute" : "Mute"}
        >
          {volume === 0 ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
              <line x1="23" y1="9" x2="17" y2="15"></line>
              <line x1="17" y1="9" x2="23" y2="15"></line>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
            </svg>
          )}
        </button>

        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={handleVolumeChange}
          className="audio-player__volume"
          aria-label="Volume"
        />

        {playerState === "paused" || playerState === "idle" ? (
          <button
            className="audio-player__control-btn audio-player__control-btn--primary"
            onClick={handlePlay}
            aria-label="Play"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </button>
        ) : (
          <button
            className="audio-player__control-btn audio-player__control-btn--primary"
            onClick={handlePause}
            aria-label="Pause"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
          </button>
        )}
      </div>

      {/* Error display */}
      {playerState === "error" && errorMessage && (
        <div className="audio-player__error" role="alert">
          <strong>⚠ {errorMessage}</strong>
        </div>
      )}

      {/* Debug info (remove in production) */}
      {process.env.NODE_ENV === "development" && (
        <details className="audio-player__debug">
          <summary>Debug info (dev only)</summary>
          <div style={{ fontSize: "0.75rem" }}>
            <p>Video ID: {videoId}</p>
            <p>State: {playerState}</p>
            <p>API Ready: {isApiReady ? "Yes" : "No"}</p>
            <p>Time: {formatTime(currentTime)} / {formatTime(duration)}</p>
            <p>Volume: {volume}%</p>
          </div>
        </details>
      )}
    </div>
  );
}
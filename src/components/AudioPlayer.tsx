"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Mic2,
  MonitorSpeaker,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type PlayerState = "idle" | "loading" | "playing" | "paused" | "error";

interface Track {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string | null;
  billboardRank?: string;
  billboardTitle?: string;
  billboardArtist?: string;
}

interface AudioPlayerProps {
  /** Track to stream */
  track: Track;
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
  track,
  autoPlay = true,
  onPlay,
  onError,
  onTimeUpdate,
}: AudioPlayerProps) {
  const videoId = track.videoId;
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
          // Notify the app that the track has finished
+          try {
+            window.dispatchEvent(new Event('track-ended'));
+          } catch (e) {
+            console.error('Failed to dispatch track-ended event', e);
+          }
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
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // ── UI helpers ─────────────────────────────────────────────────────────────
  const isLoading = playerState === "loading";
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="player-bar" role="region" aria-label="Audio Player">
      {/* Hidden YouTube iframe */}
      <div ref={containerRef} style={{ display: "none" }} />

      {/* ── LEFT: Now Playing Info ── */}
      <div className="player-bar__left">
        {track.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={track.thumbnail} alt={track.title} className="player-bar__cover" />
        ) : (
          <div className="player-bar__cover-placeholder" />
        )}
        <div className="player-bar__info">
          <div className="player-bar__title" title={track.title}>{track.title}</div>
          <div className="player-bar__channel" title={track.channel}>{track.channel}</div>
        </div>
      </div>

      {/* ── CENTER: Playback & Progress ── */}
      <div className="player-bar__center">
        <div className="player-bar__controls-main">
          <button className="player-btn-icon player-btn-secondary" aria-label="Shuffle">
            <Shuffle size={16} />
          </button>
          <button className="player-btn-icon" aria-label="Previous">
            <SkipBack size={20} fill="currentColor" />
          </button>
          
          {playerState === "playing" ? (
            <button className="player-btn-play" onClick={handlePause} aria-label="Pause">
              <Pause size={20} fill="currentColor" />
            </button>
          ) : (
            <button className="player-btn-play" onClick={handlePlay} aria-label="Play">
              <Play size={20} fill="currentColor" />
            </button>
          )}

          <button className="player-btn-icon" aria-label="Next">
            <SkipForward size={20} fill="currentColor" />
          </button>
          <button className="player-btn-icon player-btn-secondary" aria-label="Repeat">
            <Repeat size={16} />
          </button>
        </div>

        <div className="player-bar__progress-row">
          <span className="player-time">{formatTime(currentTime)}</span>
          <div className="progress-container">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="progress-slider"
              aria-label="Seek"
            />
            <div className="progress-bg">
              <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
          <span className="player-time">{formatTime(duration)}</span>
        </div>
      </div>

      {/* ── RIGHT: Volume & Extras ── */}
      <div className="player-bar__right">
        <button className="player-btn-icon player-btn-secondary" aria-label="Lyrics" title="Lyrics">
          <Mic2 size={16} />
        </button>
        <button className="player-btn-icon player-btn-secondary" aria-label="Devices" title="Devices">
          <MonitorSpeaker size={16} />
        </button>
        <button className="player-btn-icon player-btn-secondary" onClick={handleToggleMute} aria-label={volume === 0 ? "Unmute" : "Mute"}>
          {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        
        <div className="volume-container">
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={handleVolumeChange}
          className="volume-slider"
          aria-label="Volume"
        />
        <div className="volume-bg">
          <div className="volume-fill" style={{ width: `${volume}%` }} />
        </div>
      </div>
      </div>
    </div>
  );
}
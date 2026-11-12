import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Heart, Pause, Play } from 'lucide-react';
import { DOHA_SONGS } from '../../data/birthdayContent';
import {
  loadSpotifyIframeApi,
  type SpotifyEmbedController,
} from '../../utils/spotifyIframeApi';
import { Kicker, PrimaryButton } from '../ui/Primitives';

interface Stage6MusicCornerProps {
  onNext: () => void;
  onAmbientTempPaused: (paused: boolean) => void;
}

export const Stage6MusicCorner: React.FC<Stage6MusicCornerProps> = ({
  onNext,
  onAmbientTempPaused,
}) => {
  const [activeSong, setActiveSong] = useState(DOHA_SONGS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [apiFailed, setApiFailed] = useState(false);

  const embedHostRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<SpotifyEmbedController | null>(null);
  const onAmbientTempPausedRef = useRef(onAmbientTempPaused);
  onAmbientTempPausedRef.current = onAmbientTempPaused;

  useEffect(() => {
    let cancelled = false;
    let localController: SpotifyEmbedController | null = null;
    const host = embedHostRef.current;
    if (!host) return;

    const mountNode = document.createElement('div');
    host.replaceChildren(mountNode);

    loadSpotifyIframeApi()
      .then((IFrameAPI) => {
        if (cancelled) return;

        IFrameAPI.createController(
          mountNode,
          {
            width: '100%',
            height: 152,
            uri: `spotify:track:${DOHA_SONGS[0].spotifyTrackId}`,
            theme: 'dark',
          },
          (controller) => {
            if (cancelled) {
              controller.destroy();
              return;
            }
            localController = controller;
            controllerRef.current = controller;

            controller.addListener('ready', () => {
              if (cancelled) return;
              // Attempt autoplay when the soundtrack stage appears (subject to browser autoplay policy)
              controller.play();
            });

            controller.addListener('playback_started', () => {
              if (cancelled) return;
              setIsPlaying(true);
              onAmbientTempPausedRef.current(true);
            });

            controller.addListener('playback_update', (event) => {
              if (cancelled) return;
              const playing = !event.data.isPaused;
              setIsPlaying(playing);
              onAmbientTempPausedRef.current(playing);
            });
          }
        );
      })
      .catch(() => {
        if (!cancelled) {
          setApiFailed(true);
        }
      });

    return () => {
      cancelled = true;
      controllerRef.current = null;
      onAmbientTempPausedRef.current(false);
      if (localController) {
        localController.destroy();
      }
      host.replaceChildren();
    };
  }, []);

  const handleSelectSong = (song: (typeof DOHA_SONGS)[number]) => {
    const controller = controllerRef.current;

    if (song.id === activeSong.id && controller) {
      controller.togglePlay();
      return;
    }

    setActiveSong(song);
    if (controller) {
      controller.loadUri(`spotify:track:${song.spotifyTrackId}`);
      controller.play();
    }
  };

  const handleTogglePlay = () => {
    controllerRef.current?.togglePlay();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.5 }}
      className="w-full flex flex-col items-center text-center"
    >
      <Kicker className="text-[#1ed760]">Chapter 07 · Her Soundtrack</Kicker>
      <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white mt-1.5 max-w-md leading-snug tracking-tight">
        Your Favorite Songs, Because Every Love Story Has a{' '}
        <span className="font-serif italic font-normal text-[#1ed760]">Soundtrack.</span>
      </h2>
      <p className="mt-1.5 text-xs sm:text-sm text-white/75 max-w-md">
        As much as I love these tracks, my favorite sound in the world is still hearing you sing. 🎤✨
      </p>

      {/* Vinyl + Now Playing Card */}
      <div className="glass mt-4 w-full max-w-md rounded-3xl p-4 sm:p-5">
        <div className="flex items-center gap-4 mb-4">
          {/* Album Art + Spinning Vinyl Disc */}
          <div className="relative w-20 h-16 shrink-0">
            <motion.div
              animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
              transition={
                isPlaying
                  ? { duration: 6, repeat: Infinity, ease: 'linear' }
                  : { duration: 0.4 }
              }
              className="absolute right-0 top-1 w-14 h-14 rounded-full bg-[radial-gradient(circle_at_center,#1ed760_0_15%,#111_16%_100%)] border border-white/20 shadow-lg flex items-center justify-center"
            >
              <div className="w-3 h-3 rounded-full bg-[#120a22]" />
            </motion.div>
            <div
              style={{ background: activeSong.cover }}
              className="relative z-10 w-16 h-16 rounded-xl shadow-xl border border-white/25 flex items-center justify-center text-xl"
            >
              🎵
            </div>
          </div>

          <motion.div
            key={activeSong.id}
            initial={{ opacity: 0.6, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="text-left min-w-0 flex-1"
          >
            <span className="inline-block rounded-full bg-[#1ed760]/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#1ed760] mb-1">
              Doha’s Mix
            </span>
            <p className="font-display text-lg font-extrabold text-white truncate">
              {activeSong.title}
            </p>
            <p className="text-xs font-medium text-white/70 truncate">{activeSong.artist}</p>
          </motion.div>

          {!apiFailed && (
            <button
              type="button"
              onClick={handleTogglePlay}
              aria-label={isPlaying ? 'Pause song' : 'Play song'}
              className="shrink-0 w-10 h-10 rounded-full bg-[#1ed760] text-[#06210f] flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>
          )}
        </div>

        {apiFailed ? (
          <iframe
            title={`${activeSong.title} by ${activeSong.artist}`}
            src={`https://open.spotify.com/embed/track/${activeSong.spotifyTrackId}?utm_source=generator&theme=0`}
            width="100%"
            height="152"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-2xl border-0 shadow-lg"
          />
        ) : (
          <div
            ref={embedHostRef}
            className="w-full min-h-[152px] rounded-2xl overflow-hidden shadow-lg bg-black/25"
          />
        )}

        <motion.p
          key={`note-${activeSong.id}`}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          className="mt-3 font-hand text-xl text-[#ffd6e0]"
        >
          “{activeSong.note}”
        </motion.p>
      </div>

      {/* Spotify Wrapped Top Songs List */}
      <div className="mt-3.5 w-full max-w-md space-y-2">
        {DOHA_SONGS.map((song, idx) => {
          const isSelected = song.id === activeSong.id;
          return (
            <motion.button
              key={song.id}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelectSong(song)}
              className={`w-full flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-left transition cursor-pointer border ${
                isSelected
                  ? 'bg-white/20 border-[#1ed760]/70 shadow-md'
                  : 'bg-white/[0.06] border-white/10 hover:bg-white/12'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-display text-xs font-extrabold text-white/50 w-4">
                  0{idx + 1}
                </span>
                <div
                  style={{ background: song.cover }}
                  className="w-9 h-9 rounded-lg shrink-0 border border-white/20"
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{song.title}</p>
                  <p className="text-xs text-white/65 truncate">{song.artist}</p>
                </div>
              </div>
              {isSelected ? (
                <Heart className="w-4 h-4 text-[#1ed760] fill-[#1ed760] shrink-0" />
              ) : (
                <Play className="w-3.5 h-3.5 text-white/45 shrink-0" />
              )}
            </motion.button>
          );
        })}
      </div>

      <PrimaryButton variant="pink" onClick={onNext} className="mt-6">
        <span>Make Your 21st Wish 🎂</span>
        <ArrowRight className="w-4 h-4" />
      </PrimaryButton>
    </motion.div>
  );
};

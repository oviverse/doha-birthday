import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Heart, Pause, Play } from 'lucide-react';
import { DOHA_SONGS } from '../../data/birthdayContent';
import {
  loadSpotifyIframeApi,
  type SpotifyEmbedController,
} from '../../utils/spotifyIframeApi';
import { ambientAudio } from '../../utils/ambientAudio';
import { triggerHaptic } from '../../utils/haptics';
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
            height: 80,
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
    triggerHaptic(8);
    ambientAudio.playSoftTap(1.05);
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
    triggerHaptic(8);
    controllerRef.current?.togglePlay();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.5 }}
      className="w-full flex flex-col items-center text-center"
    >
      <Kicker className="text-[#1ed760]">Chapter 08 · Her Soundtrack</Kicker>
      <h2 className="font-display text-xl sm:text-3xl font-extrabold text-white mt-1 max-w-md leading-tight tracking-tight">
        Every Love Story Has a{' '}
        <span className="font-serif italic font-normal text-[#1ed760]">Soundtrack.</span>
      </h2>
      <p className="mt-0.5 text-[11px] sm:text-xs text-white/75 max-w-md">
        My favorite sound in the world is still hearing you sing 🎤✨
      </p>

      {/* Vinyl + Now Playing Card */}
      <div className="glass mt-2.5 w-full max-w-md rounded-3xl p-3.5 sm:p-4 relative overflow-hidden">
        {/* Floating musical notes when playing */}
        {isPlaying && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {['♪', '♫', '♪'].map((note, idx) => (
              <motion.span
                key={idx}
                initial={{ y: 40, x: 30 + idx * 90, opacity: 0 }}
                animate={{ y: -30, opacity: [0, 0.7, 0], x: 35 + idx * 90 + (idx % 2 === 0 ? 12 : -12) }}
                transition={{ duration: 2.8, repeat: Infinity, delay: idx * 0.8, ease: 'easeOut' }}
                className="absolute bottom-6 text-sm text-[#1ed760]/75"
              >
                {note}
              </motion.span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 mb-2.5">
          {/* Album Art + Spinning Vinyl Disc + Tonearm */}
          <div className="relative w-[76px] h-14 shrink-0">
            <motion.div
              animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
              transition={
                isPlaying
                  ? { duration: 5.5, repeat: Infinity, ease: 'linear' }
                  : { duration: 0.4 }
              }
              className="absolute right-0 top-0.5 w-[52px] h-[52px] rounded-full bg-[radial-gradient(circle_at_center,#1ed760_0_16%,#151515_17%_45%,#222_46%_48%,#111_49%_100%)] border border-white/20 shadow-lg flex items-center justify-center"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-[#120a22]" />
            </motion.div>
            <div
              style={{ background: activeSong.cover }}
              className="relative z-10 w-14 h-14 rounded-xl shadow-xl border border-white/25 flex items-center justify-center text-lg"
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
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="inline-block rounded-full bg-[#1ed760]/20 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#1ed760]">
                Doha’s Mix
              </span>
              {isPlaying && (
                <span className="flex items-end gap-[2px] h-2.5" aria-hidden>
                  <span className="eq-bar w-[2px] h-2 rounded-full bg-[#1ed760]" />
                  <span className="eq-bar w-[2px] h-2.5 rounded-full bg-[#1ed760]" style={{ animationDelay: '0.2s' }} />
                  <span className="eq-bar w-[2px] h-1.5 rounded-full bg-[#1ed760]" style={{ animationDelay: '0.4s' }} />
                </span>
              )}
            </div>
            <p className="font-display text-base sm:text-lg font-extrabold text-white truncate">
              {activeSong.title}
            </p>
            <p className="text-[11px] font-medium text-white/70 truncate">{activeSong.artist}</p>
          </motion.div>

          {!apiFailed && (
            <button
              type="button"
              onClick={handleTogglePlay}
              aria-label={isPlaying ? 'Pause song' : 'Play song'}
              className="shrink-0 w-9 h-9 rounded-full bg-[#1ed760] text-[#06210f] flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition cursor-pointer"
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
            height="80"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-xl border-0 shadow-lg"
          />
        ) : (
          <div
            ref={embedHostRef}
            className="w-full h-[80px] rounded-xl overflow-hidden shadow-lg bg-black/30"
          />
        )}

        <motion.p
          key={`note-${activeSong.id}`}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          className="mt-2 font-hand text-[17px] sm:text-lg text-[#ffd6e0] leading-snug"
        >
          “{activeSong.note}”
        </motion.p>
      </div>

      {/* Compact 2-Column Song Grid (all 6 songs visible without scrolling) */}
      <div className="mt-2.5 w-full max-w-md grid grid-cols-2 gap-1.5">
        {DOHA_SONGS.map((song, idx) => {
          const isSelected = song.id === activeSong.id;
          return (
            <motion.button
              key={song.id}
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => handleSelectSong(song)}
              className={`flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left transition cursor-pointer border ${
                isSelected
                  ? 'bg-white/20 border-[#1ed760]/75 shadow-md'
                  : 'bg-white/[0.06] border-white/10 hover:bg-white/12'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  style={{ background: song.cover }}
                  className="w-7 h-7 rounded-md shrink-0 border border-white/20 flex items-center justify-center text-[10px] font-extrabold text-white/90"
                >
                  {idx + 1}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-xs font-bold text-white truncate">{song.title}</p>
                  <p className="text-[9.5px] text-white/60 truncate">{song.artist}</p>
                </div>
              </div>
              {isSelected ? (
                <Heart className="w-3.5 h-3.5 text-[#1ed760] fill-[#1ed760] shrink-0" />
              ) : (
                <Play className="w-3 h-3 text-white/45 shrink-0" />
              )}
            </motion.button>
          );
        })}
      </div>

      <PrimaryButton
        variant="pink"
        onClick={() => {
          triggerHaptic(12);
          onNext();
        }}
        className="mt-3.5 px-7 py-3 text-sm"
      >
        <span>Make Your 21st Wish 🎂</span>
        <ArrowRight className="w-4 h-4" />
      </PrimaryButton>
    </motion.div>
  );
};

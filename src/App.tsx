import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { StoryShell } from './components/StoryShell';
import { ChapterIntro } from './components/ChapterIntro';
import { Stage1Welcome } from './components/stages/Stage1Welcome';
import { StagePasswordGate } from './components/stages/StagePasswordGate';
import { Stage2LoveLetter } from './components/stages/Stage2LoveLetter';
import { Stage3JackpotWheel } from './components/stages/Stage3JackpotWheel';
import { Stage4ReasonsLove } from './components/stages/Stage4ReasonsLove';
import { StageChildhoodMemories } from './components/stages/StageChildhoodMemories';
import { Stage5PhotoBooth } from './components/stages/Stage5PhotoBooth';
import { Stage6MusicCorner } from './components/stages/Stage6MusicCorner';
import { Stage7BlowCandles } from './components/stages/Stage7BlowCandles';
import { Stage8FinalMessage } from './components/stages/Stage8FinalMessage';
import { ambientAudio } from './utils/ambientAudio';
import { loadSpotifyIframeApi } from './utils/spotifyIframeApi';

const TOTAL_STAGES = 10;

export function App() {
  const isPreviewMode =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('preview') === '1';

  const [stage, setStage] = useState(0);
  const [introStage, setIntroStage] = useState<number | null>(null);
  const [secretUnlocked, setSecretUnlocked] = useState(isPreviewMode);
  const [highestUnlocked, setHighestUnlocked] = useState(() =>
    isPreviewMode ? TOTAL_STAGES - 1 : 0
  );

  useEffect(() => {
    ambientAudio.startAmbient();
    void loadSpotifyIframeApi().catch(() => {});
    return () => ambientAudio.stopAmbient();
  }, []);

  const goToStage = (target: number, showIntro = true) => {
    const clamped = Math.max(0, Math.min(TOTAL_STAGES - 1, target));
    setStage(clamped);
    setHighestUnlocked((prev) => Math.max(prev, clamped));
    if (showIntro && clamped > 0) {
      setIntroStage(clamped);
    } else {
      setIntroStage(null);
    }
  };

  const handleOpenSurprise = () => {
    ambientAudio.startAmbient();
    ambientAudio.playSparkleChime();
    goToStage(1, true);
  };

  const handleUnlockSecret = () => {
    setSecretUnlocked(true);
    goToStage(2, true);
  };

  const handleAmbientTempPaused = (paused: boolean) => {
    ambientAudio.setTempPaused(paused);
  };

  const handleRestart = () => {
    goToStage(0, false);
  };

  return (
    <StoryShell
      currentStage={stage}
      totalStages={TOTAL_STAGES}
      onPrevStage={() => goToStage(stage - 1, false)}
      onSelectStage={(s) => goToStage(s, false)}
      onUnlockAll={() => {
        setSecretUnlocked(true);
        setHighestUnlocked(TOTAL_STAGES - 1);
      }}
      highestUnlocked={highestUnlocked}
      focusMode={stage === 4 || stage === 5}
    >
      <AnimatePresence>
        {introStage !== null && (
          <ChapterIntro
            key={`chapter-intro-${introStage}`}
            stageIndex={introStage}
            onDone={() => setIntroStage(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {stage === 0 && <Stage1Welcome key="stage-0" onNext={handleOpenSurprise} />}
        {stage === 1 && (
          <StagePasswordGate
            key="stage-1"
            isUnlocked={secretUnlocked}
            onUnlock={handleUnlockSecret}
          />
        )}
        {stage === 2 && <Stage2LoveLetter key="stage-2" onNext={() => goToStage(3)} />}
        {stage === 3 && <Stage3JackpotWheel key="stage-3" onNext={() => goToStage(4)} />}
        {stage === 4 && <Stage4ReasonsLove key="stage-4" onNext={() => goToStage(5)} />}
        {stage === 5 && (
          <StageChildhoodMemories
            key="stage-5"
            onNext={() => goToStage(6)}
            isIntroActive={introStage !== null}
          />
        )}
        {stage === 6 && <Stage5PhotoBooth key="stage-6" onNext={() => goToStage(7)} />}
        {stage === 7 && (
          <Stage6MusicCorner
            key="stage-7"
            onNext={() => goToStage(8)}
            onAmbientTempPaused={handleAmbientTempPaused}
          />
        )}
        {stage === 8 && <Stage7BlowCandles key="stage-8" onNext={() => goToStage(9)} />}
        {stage === 9 && <Stage8FinalMessage key="stage-9" onRestart={handleRestart} />}
      </AnimatePresence>
    </StoryShell>
  );
}

export default App;

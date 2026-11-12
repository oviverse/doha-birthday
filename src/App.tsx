import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { StoryShell } from './components/StoryShell';
import { ChapterIntro } from './components/ChapterIntro';
import { Stage1Welcome } from './components/stages/Stage1Welcome';
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

const TOTAL_STAGES = 9;

export function App() {
  const [stage, setStage] = useState(0);
  const [introStage, setIntroStage] = useState<number | null>(null);
  const [highestUnlocked, setHighestUnlocked] = useState(0);

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenSurprise = () => {
    ambientAudio.startAmbient();
    ambientAudio.playSparkleChime();
    goToStage(1, true);
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
      // TEMP: temporary skip handler for easy testing across all stages
      onSkipStage={() => goToStage((stage + 1) % TOTAL_STAGES, false)}
      onSelectStage={(s) => goToStage(s, false)}
      highestUnlocked={highestUnlocked}
      focusMode={stage === 3 || stage === 4}
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
        {stage === 1 && <Stage2LoveLetter key="stage-1" onNext={() => goToStage(2)} />}
        {stage === 2 && <Stage3JackpotWheel key="stage-2" onNext={() => goToStage(3)} />}
        {stage === 3 && <Stage4ReasonsLove key="stage-3" onNext={() => goToStage(4)} />}
        {stage === 4 && (
          <StageChildhoodMemories
            key="stage-4"
            onNext={() => goToStage(5)}
            isIntroActive={introStage !== null}
          />
        )}
        {stage === 5 && <Stage5PhotoBooth key="stage-5" onNext={() => goToStage(6)} />}
        {stage === 6 && (
          <Stage6MusicCorner
            key="stage-6"
            onNext={() => goToStage(7)}
            onAmbientTempPaused={handleAmbientTempPaused}
          />
        )}
        {stage === 7 && <Stage7BlowCandles key="stage-7" onNext={() => goToStage(8)} />}
        {stage === 8 && <Stage8FinalMessage key="stage-8" onRestart={handleRestart} />}
      </AnimatePresence>
    </StoryShell>
  );
}

export default App;

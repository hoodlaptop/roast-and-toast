import { useEffect, useMemo, useRef, useState } from 'react';

// 초 → "m:ss"
function formatClock(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// 단계 종료 알림용 짧은 비프음 (Web Audio, 외부 의존성 없음)
function playBeep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
    osc.onended = () => ctx.close();
  } catch {
    /* 오디오 미지원 환경에서는 시각 플래시만 사용 */
  }
}

export default function BrewTimer({ steps = [] }) {
  // durationSec 이 양수인 단계만 타이머 시퀀스에 포함 (null/0 제외)
  const sequence = useMemo(
    () => steps.filter((s) => typeof s.durationSec === 'number' && s.durationSec > 0),
    [steps]
  );
  const totalSec = useMemo(
    () => sequence.reduce((sum, s) => sum + s.durationSec, 0),
    [sequence]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [remaining, setRemaining] = useState(sequence[0]?.durationSec ?? 0);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const flashTimer = useRef(null);

  // 시퀀스가 바뀌면(다른 레시피) 처음 상태로 초기화
  useEffect(() => {
    setCurrentIndex(0);
    setRemaining(sequence[0]?.durationSec ?? 0);
    setIsRunning(false);
    setIsDone(false);
  }, [sequence]);

  // 카운트다운: isRunning 일 때만 1초 간격, cleanup 으로 정확히 해제
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      setRemaining((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  // 남은 시간이 0이 되면 알림 후 다음 단계로 자동 진행
  useEffect(() => {
    if (!isRunning || remaining > 0) return;

    playBeep();
    setIsFlashing(true);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setIsFlashing(false), 500);

    if (currentIndex < sequence.length - 1) {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      setRemaining(sequence[next].durationSec);
    } else {
      setIsRunning(false);
      setIsDone(true);
    }
  }, [remaining, isRunning, currentIndex, sequence]);

  // 언마운트 시 flash 타이머 정리
  useEffect(() => () => clearTimeout(flashTimer.current), []);

  function handleStart() {
    if (!sequence.length) return;
    setIsDone(false);
    setIsRunning(true);
  }
  function handlePause() {
    setIsRunning(false);
  }
  function handleReset() {
    setIsRunning(false);
    setIsDone(false);
    setCurrentIndex(0);
    setRemaining(sequence[0]?.durationSec ?? 0);
  }

  if (!sequence.length) {
    return (
      <div className="brew-timer">
        <p className="muted">타이머로 진행할 시간 지정 단계가 없습니다.</p>
      </div>
    );
  }

  const currentStep = sequence[currentIndex];

  // 진행바 비율 (표시용 파생값 — 타이머 로직과 무관)
  const stepPct = isDone
    ? 100
    : currentStep.durationSec > 0
      ? ((currentStep.durationSec - Math.max(remaining, 0)) / currentStep.durationSec) * 100
      : 0;

  return (
    <div className={`brew-timer${isFlashing ? ' brew-flash' : ''}`}>
      <div className="brew-head">
        <h2>추출 타이머</h2>
        <span className="muted">전체 {formatClock(totalSec)}</span>
      </div>

      <div className="brew-display">
        <div className="brew-remaining">{formatClock(Math.max(remaining, 0))}</div>
        <div className="brew-current">
          {isDone ? '추출 완료 ☕' : `${currentIndex + 1}/${sequence.length} · ${currentStep.instruction}`}
        </div>
      </div>

      <div className="brew-progress" role="progressbar"
           aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(stepPct)}>
        <div className="brew-progress-fill" style={{ width: `${stepPct}%` }} />
      </div>

      <div className="brew-controls">
        {isRunning ? (
          <button className="btn" onClick={handlePause}>일시정지</button>
        ) : (
          <button className="btn btn-primary" onClick={handleStart} disabled={isDone}>
            {currentIndex === 0 && remaining === currentStep.durationSec ? '시작' : '계속'}
          </button>
        )}
        <button className="btn btn-ghost" onClick={handleReset}>리셋</button>
      </div>

      <ol className="brew-steps">
        {sequence.map((step, i) => (
          <li
            key={step.order}
            className={i === currentIndex && !isDone ? 'brew-step brew-step-active' : 'brew-step'}
          >
            <span>{step.instruction}</span>
            <span className="brew-step-time">{formatClock(step.durationSec)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

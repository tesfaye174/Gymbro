import { useState, useRef, useCallback, useEffect } from 'react';
import { Exercise, WorkoutState } from '@/types';
import * as haptics from '@/services/haptics';

export interface TimerState {
  state: WorkoutState;
  remainingSeconds: number;
  totalElapsed: number;
  exerciseIndex: number;
  setIndex: number;
  isPaused: boolean;
}

export function useTimer(exercises: Exercise[]) {
  const [timerState, setTimerState] = useState<TimerState>({
    state: 'idle',
    remainingSeconds: 0,
    totalElapsed: 0,
    exerciseIndex: 0,
    setIndex: 0,
    isPaused: false,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentExercise = exercises[timerState.exerciseIndex] ?? null;
  const isLastSet = currentExercise ? timerState.setIndex >= currentExercise.sets - 1 : true;
  const isLastExercise = timerState.exerciseIndex >= exercises.length - 1;
  const nextExerciseName = !isLastExercise ? exercises[timerState.exerciseIndex + 1]?.name : undefined;

  // Start elapsed counter
  const startElapsed = useCallback(() => {
    if (elapsedRef.current) clearInterval(elapsedRef.current);
    elapsedRef.current = setInterval(() => {
      setTimerState((prev) => ({ ...prev, totalElapsed: prev.totalElapsed + 1 }));
    }, 1000);
  }, []);

  // Stop all timers
  const stopTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const stopAll = useCallback(() => {
    stopTimers();
    if (elapsedRef.current) {
      clearInterval(elapsedRef.current);
      elapsedRef.current = null;
    }
  }, [stopTimers]);

  // Advance to next set/exercise
  const advance = useCallback(() => {
    stopTimers();

    setTimerState((prev) => {
      const ex = exercises[prev.exerciseIndex];
      if (!ex) return { ...prev, state: 'completed' };

      if (prev.setIndex < ex.sets - 1) {
        return { ...prev, state: 'exerciseRunning', setIndex: prev.setIndex + 1, remainingSeconds: 0 };
      } else if (prev.exerciseIndex < exercises.length - 1) {
        return { ...prev, state: 'exerciseRunning', exerciseIndex: prev.exerciseIndex + 1, setIndex: 0, remainingSeconds: 0 };
      } else {
        return { ...prev, state: 'completed' };
      }
    });
  }, [exercises, stopTimers]);

  // Start rest countdown
  const startRest = useCallback((seconds: number) => {
    stopTimers();
    setTimerState((prev) => ({ ...prev, state: 'restRunning', remainingSeconds: seconds }));

    intervalRef.current = setInterval(() => {
      setTimerState((prev) => {
        if (prev.remainingSeconds <= 1) {
          haptics.restEnd();
          return prev; // Will be advanced by effect
        }
        return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
      });
    }, 1000);
  }, [stopTimers]);

  // Watch for rest completion
  useEffect(() => {
    if (timerState.state === 'restRunning' && timerState.remainingSeconds <= 0 && intervalRef.current) {
      advance();
    }
  }, [timerState.state, timerState.remainingSeconds, advance]);

  // ─── Public actions ─────────────────────────

  const start = useCallback(() => {
    if (exercises.length === 0) return;
    setTimerState({
      state: 'exerciseRunning',
      remainingSeconds: 0,
      totalElapsed: 0,
      exerciseIndex: 0,
      setIndex: 0,
      isPaused: false,
    });
    startElapsed();
  }, [exercises, startElapsed]);

  const completeSet = useCallback(() => {
    haptics.exerciseEnd();
    const ex = exercises[timerState.exerciseIndex];
    if (ex) {
      startRest(ex.restSeconds);
    }
  }, [exercises, timerState.exerciseIndex, startRest]);

  const skip = useCallback(() => {
    advance();
  }, [advance]);

  const goBack = useCallback(() => {
    stopTimers();
    setTimerState((prev) => {
      if (prev.setIndex > 0) {
        return { ...prev, state: 'exerciseRunning', setIndex: prev.setIndex - 1, remainingSeconds: 0 };
      } else if (prev.exerciseIndex > 0) {
        const prevEx = exercises[prev.exerciseIndex - 1];
        return {
          ...prev,
          state: 'exerciseRunning',
          exerciseIndex: prev.exerciseIndex - 1,
          setIndex: Math.max((prevEx?.sets ?? 1) - 1, 0),
          remainingSeconds: 0,
        };
      }
      return prev;
    });
  }, [exercises, stopTimers]);

  const pause = useCallback(() => {
    stopTimers();
    if (elapsedRef.current) {
      clearInterval(elapsedRef.current);
      elapsedRef.current = null;
    }
    setTimerState((prev) => ({ ...prev, isPaused: true }));
  }, [stopTimers]);

  const resume = useCallback(() => {
    setTimerState((prev) => ({ ...prev, isPaused: false }));
    startElapsed();
    if (timerState.state === 'restRunning' && timerState.remainingSeconds > 0) {
      // Restart countdown from remaining
      const remaining = timerState.remainingSeconds;
      intervalRef.current = setInterval(() => {
        setTimerState((prev) => {
          if (prev.remainingSeconds <= 1) {
            haptics.restEnd();
            return prev;
          }
          return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
        });
      }, 1000);
    }
  }, [timerState.state, timerState.remainingSeconds, startElapsed]);

  const finish = useCallback(() => {
    stopAll();
    haptics.workoutComplete();
    setTimerState((prev) => ({ ...prev, state: 'completed' }));
  }, [stopAll]);

  const reset = useCallback(() => {
    stopAll();
    setTimerState({
      state: 'idle',
      remainingSeconds: 0,
      totalElapsed: 0,
      exerciseIndex: 0,
      setIndex: 0,
      isPaused: false,
    });
  }, [stopAll]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAll();
  }, [stopAll]);

  return {
    ...timerState,
    currentExercise,
    isLastSet,
    isLastExercise,
    nextExerciseName,
    start,
    completeSet,
    skip,
    goBack,
    pause,
    resume,
    finish,
    reset,
  };
}

import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Colors } from '@/constants/colors';
import { WorkoutTemplate } from '@/types';
import { fetchTemplate, createSession, completeSession, addSetRecord, fetchLastWeight } from '@/services/database';
import { scheduleRestComplete, cancelAll, requestPermission } from '@/services/notifications';
import { useTimer } from '@/hooks/useTimer';
import GymBroButton from '@/components/GymBroButton';
import TimerDisplay from '@/components/TimerDisplay';
import StepperControl from '@/components/StepperControl';

export default function WorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [template, setTemplate] = useState<WorkoutTemplate | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [weight, setWeight] = useState(0);
  const [reps, setReps] = useState(0);
  const [standMode, setStandMode] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const startDate = useRef(new Date());

  const timer = useTimer(template?.exercises ?? []);
  const weightStep = 2.5;

  // Load template
  useEffect(() => {
    if (!id) return;
    fetchTemplate(id).then((t) => {
      if (t) setTemplate(t);
    });
  }, [id]);

  // Start workout when template loads
  useEffect(() => {
    if (!template) return;

    async function begin() {
      await requestPermission();
      activateKeepAwakeAsync();
      startDate.current = new Date();
      const sid = await createSession(template!.name, template!.id);
      setSessionId(sid);
      timer.start();
    }

    begin();

    return () => {
      deactivateKeepAwake();
      cancelAll();
    };
  }, [template]);

  // Load last weight when exercise changes
  useEffect(() => {
    if (!timer.currentExercise) return;
    setReps(timer.currentExercise.reps);
    fetchLastWeight(timer.currentExercise.name).then((w) => setWeight(w ?? 0));
  }, [timer.exerciseIndex]);

  // Handle completion
  useEffect(() => {
    if (timer.state === 'completed' && sessionId && !showComplete) {
      handleEnd();
    }
  }, [timer.state]);

  async function handleCompleteSet() {
    if (!sessionId) return;
    await addSetRecord(sessionId, timer.currentExercise!.name, weight, reps, 0, timer.setIndex);
    timer.completeSet();

    if (timer.currentExercise) {
      scheduleRestComplete(timer.currentExercise.restSeconds, timer.nextExerciseName);
    }
  }

  async function handleEnd() {
    if (!sessionId) return;
    cancelAll();
    deactivateKeepAwake();
    await completeSession(sessionId, timer.totalElapsed);
    setShowComplete(true);
  }

  function handleSkip() {
    cancelAll();
    timer.skip();
  }

  function handlePauseResume() {
    if (timer.isPaused) {
      timer.resume();
    } else {
      timer.pause();
      cancelAll();
    }
  }

  // Format elapsed
  const elapsed = `${Math.floor(timer.totalElapsed / 60)}:${(timer.totalElapsed % 60).toString().padStart(2, '0')}`;

  if (!template) return null;

  // ─── Complete screen ──────────────────────────
  if (showComplete) {
    return (
      <View style={styles.container}>
        <View style={styles.completeCenter}>
          <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
          <Text style={styles.completeTitle}>Allenamento Completato!</Text>

          <View style={styles.completeCard}>
            <View style={styles.completeRow}>
              <Ionicons name="document-text-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.completeLabel}>Scheda</Text>
              <Text style={styles.completeValue}>{template.name}</Text>
            </View>
            <View style={styles.completeDivider} />
            <View style={styles.completeRow}>
              <Ionicons name="time-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.completeLabel}>Durata</Text>
              <Text style={styles.completeValue}>{elapsed}</Text>
            </View>
          </View>
        </View>

        <View style={styles.pad}>
          <GymBroButton title="CHIUDI" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  // ─── Stand Mode ──────────────────────────
  if (standMode) {
    return (
      <View style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          {timer.state === 'restRunning' ? (
            <>
              <Text style={styles.standLabel}>RECUPERO</Text>
              <TimerDisplay seconds={timer.remainingSeconds} isStandMode />
            </>
          ) : (
            <Text style={styles.standWeight}>{weight % 1 === 0 ? weight : weight.toFixed(1)} kg</Text>
          )}

          <Text style={styles.standExercise}>{timer.currentExercise?.name}</Text>
          <Text style={styles.standSets}>Serie {timer.setIndex + 1}/{timer.currentExercise?.sets}</Text>
        </View>

        <View style={styles.pad}>
          {timer.state === 'exerciseRunning' && (
            <>
              <View style={styles.standStepperRow}>
                <TouchableOpacity onPress={() => setWeight(Math.max(0, weight - weightStep))} style={styles.standRound}>
                  <Ionicons name="remove" size={30} color={Colors.text} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setWeight(weight + weightStep)} style={styles.standRound}>
                  <Ionicons name="add" size={30} color={Colors.text} />
                </TouchableOpacity>
              </View>
              <GymBroButton title="COMPLETATA" onPress={handleCompleteSet} style={{ marginBottom: 12 }} />
            </>
          )}
          <View style={styles.standBtnRow}>
            <TouchableOpacity style={styles.standBtn} onPress={handlePauseResume}>
              <Text style={styles.standBtnText}>{timer.isPaused ? 'RIPRENDI' : 'PAUSA'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.standBtn} onPress={handleSkip}>
              <Text style={styles.standBtnText}>SALTA</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => setStandMode(false)} style={{ alignItems: 'center', marginTop: 8 }}>
            <Text style={styles.exitStand}>Esci da Stand Mode</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Normal Mode ──────────────────────────
  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleEnd} style={styles.touchTarget}>
          <Ionicons name="close" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.elapsed}>{elapsed}</Text>
        <TouchableOpacity onPress={() => setStandMode(true)} style={styles.touchTarget}>
          <Ionicons name="expand-outline" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Exercise info */}
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{timer.currentExercise?.name}</Text>
        <Text style={styles.setsText}>Serie {timer.setIndex + 1}/{timer.currentExercise?.sets}</Text>
        <Text style={styles.progressText}>Esercizio {timer.exerciseIndex + 1}/{template.exercises.length}</Text>
      </View>

      {/* State content */}
      <View style={{ flex: 1, justifyContent: 'center' }}>
        {timer.state === 'exerciseRunning' && (
          <View style={styles.exerciseContent}>
            <StepperControl
              label="PESO (kg)"
              value={weight % 1 === 0 ? String(weight) : weight.toFixed(1)}
              onIncrement={() => setWeight(weight + weightStep)}
              onDecrement={() => setWeight(Math.max(0, weight - weightStep))}
              large
            />
            <StepperControl
              label="RIPETIZIONI"
              value={String(reps)}
              onIncrement={() => setReps(reps + 1)}
              onDecrement={() => setReps(Math.max(0, reps - 1))}
            />
            <View style={styles.pad}>
              <GymBroButton title="SERIE COMPLETATA" icon="checkmark" onPress={handleCompleteSet} />
            </View>
          </View>
        )}

        {timer.state === 'restRunning' && (
          <View style={styles.restContent}>
            <Text style={styles.restLabel}>RECUPERO</Text>
            <TimerDisplay seconds={timer.remainingSeconds} />
            {timer.nextExerciseName && timer.isLastSet && (
              <Text style={styles.nextText}>Prossimo: {timer.nextExerciseName}</Text>
            )}
            <View style={styles.pad}>
              <GymBroButton title="SALTA RECUPERO" variant="secondary" onPress={handleSkip} />
            </View>
          </View>
        )}
      </View>

      {/* Bottom controls */}
      <View style={styles.controls}>
        <TouchableOpacity onPress={handlePauseResume} style={styles.controlBtn}>
          <Ionicons name={timer.isPaused ? 'play' : 'pause'} size={24} color={Colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={timer.goBack} style={styles.controlBtn}>
          <Ionicons name="play-back" size={20} color={Colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSkip} style={styles.controlBtn}>
          <Ionicons name="play-forward" size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingTop: 60 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 },
  touchTarget: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  elapsed: { fontSize: 14, color: Colors.textSecondary, fontVariant: ['tabular-nums'] },
  exerciseInfo: { alignItems: 'center', marginTop: 24 },
  exerciseName: { fontSize: 24, fontWeight: '700', color: Colors.text },
  setsText: { fontSize: 20, fontWeight: '600', color: Colors.textSecondary, marginTop: 4 },
  progressText: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  exerciseContent: { alignItems: 'center', gap: 24 },
  restContent: { alignItems: 'center', gap: 16 },
  restLabel: { fontSize: 14, color: Colors.textSecondary },
  nextText: { fontSize: 18, color: Colors.accent },
  pad: { paddingHorizontal: 16, width: '100%' },
  controls: { flexDirection: 'row', justifyContent: 'center', gap: 16, paddingBottom: 40 },
  controlBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  // Complete
  completeCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  completeTitle: { fontSize: 24, fontWeight: '700', color: Colors.text },
  completeCard: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, width: '80%', marginTop: 16 },
  completeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  completeLabel: { flex: 1, fontSize: 16, color: Colors.textSecondary },
  completeValue: { fontSize: 16, color: Colors.text, fontVariant: ['tabular-nums'] },
  completeDivider: { height: 1, backgroundColor: '#333', marginVertical: 12 },
  // Stand
  standLabel: { fontSize: 20, fontWeight: '600', color: Colors.textSecondary },
  standWeight: { fontSize: 120, fontWeight: '700', color: Colors.text, fontVariant: ['tabular-nums'] },
  standExercise: { fontSize: 28, fontWeight: '700', color: Colors.text, marginTop: 16 },
  standSets: { fontSize: 22, fontWeight: '600', color: Colors.textSecondary, marginTop: 4 },
  standStepperRow: { flexDirection: 'row', justifyContent: 'center', gap: 32, marginBottom: 16 },
  standRound: { width: 70, height: 70, borderRadius: 35, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  standBtnRow: { flexDirection: 'row', gap: 12 },
  standBtn: { flex: 1, height: 60, backgroundColor: Colors.surface, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  standBtnText: { fontSize: 18, fontWeight: '700', color: Colors.text },
  exitStand: { fontSize: 14, color: Colors.textSecondary },
});

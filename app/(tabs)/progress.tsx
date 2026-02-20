import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { Colors } from '@/constants/colors';
import { fetchAllSessions, fetchStreak, fetchPersonalRecord } from '@/services/database';
import { WorkoutSession } from '@/types';
import GymBroCard from '@/components/GymBroCard';

const screenWidth = Dimensions.get('window').width - 64;

export default function ProgressScreen() {
  const [exerciseNames, setExerciseNames] = useState<string[]>([]);
  const [selected, setSelected] = useState('');
  const [chartLabels, setChartLabels] = useState<string[]>([]);
  const [chartValues, setChartValues] = useState<number[]>([]);
  const [pr, setPr] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalWorkouts, setTotalWorkouts] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    const sessions = await fetchAllSessions();
    setTotalWorkouts(sessions.filter((s) => s.completed).length);
    setStreak(await fetchStreak());

    const names = new Set<string>();
    sessions.forEach((s) => s.setRecords.forEach((r) => names.add(r.exerciseName)));
    const sorted = Array.from(names).sort();
    setExerciseNames(sorted);

    const sel = selected || sorted[0] || '';
    if (sel) selectExercise(sel, sessions);
  }

  async function selectExercise(name: string, sessions?: WorkoutSession[]) {
    setSelected(name);
    const allSessions = sessions ?? (await fetchAllSessions());
    const record = await fetchPersonalRecord(name);
    setPr(record);

    const dataPoints: { date: Date; value: number }[] = [];
    for (const session of allSessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())) {
      const records = session.setRecords.filter((r) => r.exerciseName === name);
      if (records.length > 0) {
        const max = Math.max(...records.map((r) => r.weight));
        dataPoints.push({ date: new Date(session.date), value: max });
      }
    }

    if (dataPoints.length > 0) {
      setChartLabels(dataPoints.slice(-7).map((p) => `${p.date.getDate()}/${p.date.getMonth() + 1}`));
      setChartValues(dataPoints.slice(-7).map((p) => p.value));
    } else {
      setChartLabels([]);
      setChartValues([]);
    }
  }

  if (exerciseNames.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="trending-up-outline" size={50} color={Colors.textSecondary} />
        <Text style={styles.emptyTitle}>Nessun dato</Text>
        <Text style={styles.emptySubtitle}>Completa degli allenamenti per vedere i progressi</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      {/* Stats */}
      <View style={styles.statsRow}>
        <GymBroCard style={{ flex: 1 }}>
          <View style={styles.statContent}>
            <Ionicons name="barbell-outline" size={20} color={Colors.accent} />
            <View>
              <Text style={styles.statLabel}>Allenamenti</Text>
              <Text style={styles.statValue}>{totalWorkouts}</Text>
            </View>
          </View>
        </GymBroCard>
        <GymBroCard style={{ flex: 1 }}>
          <View style={styles.statContent}>
            <Ionicons name="flame" size={20} color={Colors.orange} />
            <View>
              <Text style={styles.statLabel}>Streak</Text>
              <Text style={styles.statValue}>{streak}</Text>
            </View>
          </View>
        </GymBroCard>
      </View>

      {/* Exercise picker */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
        {exerciseNames.map((name) => (
          <TouchableOpacity
            key={name}
            onPress={() => selectExercise(name)}
            style={[styles.pickerChip, name === selected && styles.pickerChipActive]}
          >
            <Text style={[styles.pickerText, name === selected && styles.pickerTextActive]}>{name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Chart */}
      {chartValues.length > 1 && (
        <GymBroCard style={{ marginTop: 16 }}>
          <Text style={styles.chartTitle}>Peso nel tempo</Text>
          <LineChart
            data={{
              labels: chartLabels,
              datasets: [{ data: chartValues }],
            }}
            width={screenWidth}
            height={200}
            chartConfig={{
              backgroundColor: Colors.surface,
              backgroundGradientFrom: Colors.surface,
              backgroundGradientTo: Colors.surface,
              decimalPlaces: 1,
              color: () => Colors.accent,
              labelColor: () => Colors.textSecondary,
              propsForDots: { r: '4', strokeWidth: '2', stroke: Colors.accent },
            }}
            bezier
            style={{ borderRadius: 8 }}
          />
        </GymBroCard>
      )}

      {/* PR */}
      {pr > 0 && (
        <GymBroCard style={{ marginTop: 16 }}>
          <View style={styles.prRow}>
            <Ionicons name="trophy" size={24} color="#FFD700" />
            <View>
              <Text style={styles.prLabel}>Record Personale</Text>
              <Text style={styles.prValue}>{pr % 1 === 0 ? pr : pr.toFixed(1)} kg</Text>
            </View>
          </View>
        </GymBroCard>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  empty: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: Colors.text },
  emptySubtitle: { fontSize: 16, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 40 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statLabel: { fontSize: 14, color: Colors.textSecondary },
  statValue: { fontSize: 20, fontWeight: '700', color: Colors.text },
  pickerScroll: { marginTop: 16 },
  pickerChip: { backgroundColor: Colors.surface, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, marginRight: 8 },
  pickerChipActive: { backgroundColor: Colors.accent },
  pickerText: { fontSize: 14, color: Colors.text },
  pickerTextActive: { color: '#fff' },
  chartTitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 12 },
  prRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  prLabel: { fontSize: 14, color: Colors.textSecondary },
  prValue: { fontSize: 20, fontWeight: '700', color: Colors.text },
});

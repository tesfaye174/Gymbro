import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { WorkoutSession } from '@/types';
import { fetchAllSessions } from '@/services/database';
import GymBroCard from '@/components/GymBroCard';

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [session, setSession] = useState<WorkoutSession | null>(null);

  useEffect(() => {
    fetchAllSessions().then((all) => {
      const found = all.find((s) => s.id === id);
      if (found) setSession(found);
    });
  }, [id]);

  if (!session) return null;

  const duration = `${Math.floor(session.duration / 60)}:${(session.duration % 60).toString().padStart(2, '0')}`;
  const totalVolume = session.setRecords.reduce((acc, r) => acc + r.weight * r.repsDone, 0);

  // Group records by exercise
  const exerciseGroups: Record<string, typeof session.setRecords> = {};
  session.setRecords.forEach((r) => {
    (exerciseGroups[r.exerciseName] ??= []).push(r);
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      {/* Summary */}
      <GymBroCard>
        <View style={styles.summaryRow}>
          <Ionicons name="time-outline" size={20} color={Colors.textSecondary} />
          <Text style={styles.summaryLabel}>Durata</Text>
          <Text style={styles.summaryValue}>{duration}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Ionicons name="barbell-outline" size={20} color={Colors.textSecondary} />
          <Text style={styles.summaryLabel}>Volume totale</Text>
          <Text style={styles.summaryValue}>{totalVolume % 1 === 0 ? totalVolume : totalVolume.toFixed(1)} kg</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Ionicons
            name={session.completed ? 'checkmark-circle' : 'close-circle-outline'}
            size={20}
            color={session.completed ? Colors.success : Colors.warning}
          />
          <Text style={styles.summaryLabel}>Stato</Text>
          <Text style={[styles.summaryValue, { color: session.completed ? Colors.success : Colors.warning }]}>
            {session.completed ? 'Completato' : 'Incompleto'}
          </Text>
        </View>
      </GymBroCard>

      {/* Exercise breakdown */}
      {Object.entries(exerciseGroups).map(([name, records]) => (
        <GymBroCard key={name} style={{ marginTop: 12 }}>
          <Text style={styles.exTitle}>{name}</Text>
          {records.sort((a, b) => a.setIndex - b.setIndex).map((r) => (
            <View key={r.id} style={styles.setRow}>
              <Text style={styles.setLabel}>Serie {r.setIndex + 1}</Text>
              <Text style={styles.setDetail}>
                {r.weight % 1 === 0 ? r.weight : r.weight.toFixed(1)} kg × {r.repsDone}
              </Text>
            </View>
          ))}
        </GymBroCard>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryLabel: { flex: 1, fontSize: 16, color: Colors.textSecondary },
  summaryValue: { fontSize: 16, color: Colors.text, fontVariant: ['tabular-nums'] },
  divider: { height: 1, backgroundColor: '#333', marginVertical: 12 },
  exTitle: { fontSize: 20, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  setRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  setLabel: { fontSize: 14, color: Colors.textSecondary },
  setDetail: { fontSize: 16, color: Colors.text },
});

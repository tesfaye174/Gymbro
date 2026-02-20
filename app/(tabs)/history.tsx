import { useState, useCallback } from 'react';
import { View, Text, SectionList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { WorkoutSession } from '@/types';
import { fetchAllSessions, deleteSession, fetchStreak } from '@/services/database';
import GymBroCard from '@/components/GymBroCard';

export default function HistoryScreen() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [streak, setStreak] = useState(0);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  async function load() {
    setSessions(await fetchAllSessions());
    setStreak(await fetchStreak());
  }

  function handleDelete(id: string) {
    Alert.alert('Elimina', 'Eliminare questa sessione?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina', style: 'destructive', onPress: async () => {
          await deleteSession(id);
          load();
        },
      },
    ]);
  }

  function formatDuration(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  function getMonthKey(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  }

  const sections = Object.entries(
    sessions.reduce<Record<string, WorkoutSession[]>>((acc, s) => {
      const key = getMonthKey(s.date);
      (acc[key] ??= []).push(s);
      return acc;
    }, {})
  ).map(([title, data]) => ({ title, data }));

  if (sessions.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="time-outline" size={50} color={Colors.textSecondary} />
        <Text style={styles.emptyTitle}>Nessun allenamento</Text>
        <Text style={styles.emptySubtitle}>I tuoi allenamenti appariranno qui</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        ListHeaderComponent={streak > 0 ? (
          <GymBroCard style={{ marginBottom: 16 }}>
            <View style={styles.streakRow}>
              <Ionicons name="flame" size={24} color={Colors.orange} />
              <View>
                <Text style={styles.streakValue}>{streak} giorni di fila</Text>
                <Text style={styles.streakLabel}>Continua così!</Text>
              </View>
            </View>
          </GymBroCard>
        ) : null}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/session/${item.id}`)}
            onLongPress={() => handleDelete(item.id)}
            activeOpacity={0.7}
          >
            <GymBroCard style={{ marginBottom: 8 }}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.templateName}</Text>
                  <Text style={styles.date}>{formatDate(item.date)}</Text>
                </View>
                <View style={styles.rightCol}>
                  <Text style={styles.duration}>{formatDuration(item.duration)}</Text>
                  <Ionicons
                    name={item.completed ? 'checkmark-circle' : 'close-circle-outline'}
                    size={20}
                    color={item.completed ? Colors.success : Colors.warning}
                  />
                </View>
              </View>
            </GymBroCard>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  empty: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: Colors.text },
  emptySubtitle: { fontSize: 16, color: Colors.textSecondary },
  sectionHeader: { fontSize: 14, color: Colors.textSecondary, marginTop: 16, marginBottom: 8, textTransform: 'capitalize' },
  row: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 18, color: Colors.text, fontWeight: '600' },
  date: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  rightCol: { alignItems: 'flex-end', gap: 4 },
  duration: { fontSize: 18, color: Colors.text, fontVariant: ['tabular-nums'] },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  streakValue: { fontSize: 18, color: Colors.text, fontWeight: '600' },
  streakLabel: { fontSize: 14, color: Colors.textSecondary },
});

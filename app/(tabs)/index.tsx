import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { WorkoutTemplate } from '@/types';
import { fetchAllTemplates, fetchStreak } from '@/services/database';
import GymBroButton from '@/components/GymBroButton';
import GymBroCard from '@/components/GymBroCard';

export default function TodayScreen() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);
  const [streak, setStreak] = useState(0);
  const [showPicker, setShowPicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    const t = await fetchAllTemplates();
    setTemplates(t);
    if (!selectedTemplate && t.length > 0) setSelectedTemplate(t[0]);
    const s = await fetchStreak();
    setStreak(s);
  }

  function estimatedMinutes(template: WorkoutTemplate): number {
    const totalSets = template.exercises.reduce((acc, e) => acc + e.sets, 0);
    const avgRest = template.exercises.length > 0
      ? template.exercises.reduce((acc, e) => acc + e.restSeconds, 0) / template.exercises.length
      : 90;
    return Math.max(Math.round(totalSets * (45 + avgRest) / 60), 1);
  }

  if (!selectedTemplate) {
    return (
      <View style={styles.container}>
        <View style={styles.empty}>
          <Ionicons name="barbell-outline" size={60} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>Nessuna scheda creata</Text>
          <Text style={styles.emptySubtitle}>Crea la tua prima scheda di allenamento</Text>
        </View>
        <View style={styles.bottomPad}>
          <GymBroButton title="CREA SCHEDA" icon="add" onPress={() => router.push('/template/new')} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerLabel}>Oggi</Text>
        <Text style={styles.headerTitle}>{selectedTemplate.name}</Text>
        {streak > 0 && (
          <View style={styles.streakRow}>
            <Ionicons name="flame" size={16} color={Colors.orange} />
            <Text style={styles.streakText}>{streak} giorni</Text>
          </View>
        )}
      </View>

      {/* Estimated time */}
      <View style={styles.timeRow}>
        <Ionicons name="time-outline" size={18} color={Colors.textSecondary} />
        <Text style={styles.timeText}>{estimatedMinutes(selectedTemplate)} min</Text>
      </View>

      {/* Exercise list */}
      <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 16 }}>
        {selectedTemplate.exercises.map((ex) => (
          <GymBroCard key={ex.id} style={{ marginBottom: 8 }}>
            <View style={styles.exerciseRow}>
              <Text style={styles.exerciseName}>{ex.name}</Text>
              <Text style={styles.exerciseSets}>{ex.sets}x{ex.reps}</Text>
            </View>
          </GymBroCard>
        ))}
      </ScrollView>

      {/* CTA */}
      <View style={styles.bottomPad}>
        <GymBroButton
          title="INIZIA ALLENAMENTO"
          icon="play"
          onPress={() => router.push(`/workout/${selectedTemplate.id}`)}
        />
        <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.changeBtn}>
          <Text style={styles.changeText}>Cambia scheda</Text>
        </TouchableOpacity>
      </View>

      {/* Picker modal */}
      <Modal visible={showPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Scegli Scheda</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {templates.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={styles.pickerItem}
                  onPress={() => { setSelectedTemplate(t); setShowPicker(false); }}
                >
                  <Text style={styles.pickerName}>{t.name}</Text>
                  <Text style={styles.pickerMeta}>{t.exercises.length} esercizi · {estimatedMinutes(t)} min</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { alignItems: 'center', paddingTop: 24 },
  headerLabel: { fontSize: 14, color: Colors.textSecondary },
  headerTitle: { fontSize: 24, fontWeight: '700', color: Colors.text, marginTop: 4 },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  streakText: { fontSize: 14, color: Colors.orange },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 },
  timeText: { fontSize: 18, color: Colors.textSecondary },
  list: { flex: 1, paddingHorizontal: 16, marginTop: 16 },
  exerciseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exerciseName: { fontSize: 18, color: Colors.text },
  exerciseSets: { fontSize: 18, color: Colors.textSecondary },
  bottomPad: { paddingHorizontal: 16, paddingBottom: 24 },
  changeBtn: { alignItems: 'center', marginTop: 8 },
  changeText: { fontSize: 14, color: Colors.textSecondary },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTitle: { fontSize: 24, fontWeight: '700', color: Colors.text },
  emptySubtitle: { fontSize: 18, color: Colors.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '600', color: Colors.text },
  pickerItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#333' },
  pickerName: { fontSize: 18, color: Colors.text },
  pickerMeta: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
});

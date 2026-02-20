import { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Modal, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Exercise } from '@/types';
import { createTemplate } from '@/services/database';
import { quickTemplates, commonExercises } from '@/constants/quickTemplates';
import GymBroButton from '@/components/GymBroButton';
import GymBroCard from '@/components/GymBroCard';
import { v4 as uuid } from 'uuid';

const splitTypes = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body', 'Custom'];

export default function NewTemplateScreen() {
  const [name, setName] = useState('');
  const [splitType, setSplitType] = useState('Custom');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [showExerciseModal, setShowExerciseModal] = useState(false);

  // Exercise editor state
  const [exName, setExName] = useState('');
  const [exSets, setExSets] = useState(3);
  const [exReps, setExReps] = useState(10);
  const [exRest, setExRest] = useState(90);

  function addExercise() {
    if (!exName.trim()) return;
    setExercises([...exercises, {
      id: uuid(),
      name: exName.trim(),
      sets: exSets,
      reps: exReps,
      restSeconds: exRest,
      order: exercises.length,
    }]);
    setExName('');
    setExSets(3);
    setExReps(10);
    setExRest(90);
    setShowExerciseModal(false);
  }

  function removeExercise(id: string) {
    setExercises(exercises.filter((e) => e.id !== id));
  }

  function loadQuickTemplate(idx: number) {
    const qt = quickTemplates[idx];
    setName(qt.name);
    setSplitType(qt.splitType);
    setExercises(qt.exercises.map((e, i) => ({ ...e, id: uuid(), order: i })));
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Errore', 'Inserisci un nome per la scheda.');
      return;
    }
    if (exercises.length === 0) {
      Alert.alert('Errore', 'Aggiungi almeno un esercizio.');
      return;
    }
    await createTemplate(name.trim(), splitType, exercises.map((e, i) => ({ ...e, order: i })));
    router.back();
  }

  const filtered = exName.length > 0
    ? commonExercises.filter((n) => n.toLowerCase().includes(exName.toLowerCase())).slice(0, 5)
    : [];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {/* Name */}
        <Text style={styles.label}>Nome scheda</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Es: Push Day"
          placeholderTextColor={Colors.textSecondary}
          style={styles.input}
        />

        {/* Split type */}
        <Text style={[styles.label, { marginTop: 16 }]}>Tipo split</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          {splitTypes.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setSplitType(s)}
              style={[styles.chip, s === splitType && styles.chipActive]}
            >
              <Text style={[styles.chipText, s === splitType && styles.chipTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Quick templates */}
        <Text style={[styles.label, { marginTop: 20 }]}>Template rapidi</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          {quickTemplates.map((qt, i) => (
            <TouchableOpacity key={qt.name} onPress={() => loadQuickTemplate(i)} style={styles.qtChip}>
              <Ionicons name="flash" size={14} color={Colors.accent} />
              <Text style={styles.qtText}>{qt.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Exercises */}
        <Text style={[styles.label, { marginTop: 20 }]}>Esercizi ({exercises.length})</Text>
        {exercises.map((ex) => (
          <GymBroCard key={ex.id} style={{ marginTop: 8 }}>
            <View style={styles.exRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.exName}>{ex.name}</Text>
                <Text style={styles.exMeta}>{ex.sets}x{ex.reps} · {ex.restSeconds}s riposo</Text>
              </View>
              <TouchableOpacity onPress={() => removeExercise(ex.id)} style={{ padding: 8 }}>
                <Ionicons name="close-circle" size={22} color={Colors.destructive} />
              </TouchableOpacity>
            </View>
          </GymBroCard>
        ))}

        <TouchableOpacity onPress={() => setShowExerciseModal(true)} style={styles.addBtn}>
          <Ionicons name="add-circle" size={22} color={Colors.accent} />
          <Text style={styles.addText}>Aggiungi esercizio</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Save */}
      <View style={styles.saveBar}>
        <GymBroButton title="CREA SCHEDA" onPress={handleSave} />
      </View>

      {/* Exercise modal */}
      <Modal visible={showExerciseModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuovo Esercizio</Text>
              <TouchableOpacity onPress={() => setShowExerciseModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              value={exName}
              onChangeText={setExName}
              placeholder="Nome esercizio"
              placeholderTextColor={Colors.textSecondary}
              style={styles.input}
            />

            {filtered.length > 0 && (
              <View style={{ marginTop: 4 }}>
                {filtered.map((s) => (
                  <TouchableOpacity key={s} onPress={() => setExName(s)} style={styles.suggestion}>
                    <Text style={styles.suggestionText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.paramRow}>
              <Text style={styles.paramLabel}>Serie</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity onPress={() => setExSets(Math.max(1, exSets - 1))} style={styles.stepBtn}>
                  <Ionicons name="remove" size={18} color={Colors.accent} />
                </TouchableOpacity>
                <Text style={styles.stepVal}>{exSets}</Text>
                <TouchableOpacity onPress={() => setExSets(Math.min(10, exSets + 1))} style={styles.stepBtn}>
                  <Ionicons name="add" size={18} color={Colors.accent} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.paramRow}>
              <Text style={styles.paramLabel}>Ripetizioni</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity onPress={() => setExReps(Math.max(1, exReps - 1))} style={styles.stepBtn}>
                  <Ionicons name="remove" size={18} color={Colors.accent} />
                </TouchableOpacity>
                <Text style={styles.stepVal}>{exReps}</Text>
                <TouchableOpacity onPress={() => setExReps(Math.min(50, exReps + 1))} style={styles.stepBtn}>
                  <Ionicons name="add" size={18} color={Colors.accent} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.paramRow}>
              <Text style={styles.paramLabel}>Recupero</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity onPress={() => setExRest(Math.max(15, exRest - 15))} style={styles.stepBtn}>
                  <Ionicons name="remove" size={18} color={Colors.accent} />
                </TouchableOpacity>
                <Text style={styles.stepVal}>{exRest}s</Text>
                <TouchableOpacity onPress={() => setExRest(Math.min(300, exRest + 15))} style={styles.stepBtn}>
                  <Ionicons name="add" size={18} color={Colors.accent} />
                </TouchableOpacity>
              </View>
            </View>

            <GymBroButton title="AGGIUNGI" onPress={addExercise} disabled={!exName.trim()} style={{ marginTop: 16 }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  label: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
  input: { backgroundColor: Colors.surface, color: Colors.text, fontSize: 18, padding: 14, borderRadius: 10, marginTop: 8 },
  chip: { backgroundColor: Colors.surface, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, marginRight: 8 },
  chipActive: { backgroundColor: Colors.accent },
  chipText: { fontSize: 14, color: Colors.text },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  qtChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surface, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginRight: 8 },
  qtText: { fontSize: 14, color: Colors.accent },
  exRow: { flexDirection: 'row', alignItems: 'center' },
  exName: { fontSize: 18, color: Colors.text, fontWeight: '600' },
  exMeta: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  addText: { fontSize: 16, color: Colors.accent },
  saveBar: { padding: 16, backgroundColor: Colors.background },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '600', color: Colors.text },
  suggestion: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#333' },
  suggestionText: { fontSize: 16, color: Colors.accent },
  paramRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  paramLabel: { fontSize: 16, color: Colors.text },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceLight, alignItems: 'center', justifyContent: 'center' },
  stepVal: { fontSize: 18, fontWeight: '600', color: Colors.text, minWidth: 40, textAlign: 'center', fontVariant: ['tabular-nums'] },
});

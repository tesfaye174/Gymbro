import { useState, useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { deleteAllData } from '@/services/database';

export default function SettingsScreen() {
  const [restSeconds, setRestSeconds] = useState(90);
  const [weightStep, setWeightStep] = useState(2.5);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const rest = await AsyncStorage.getItem('defaultRestSeconds');
    const step = await AsyncStorage.getItem('weightStep');
    if (rest) setRestSeconds(parseInt(rest));
    if (step) setWeightStep(parseFloat(step));
  }

  async function saveRest(val: number) {
    const clamped = Math.max(15, Math.min(300, val));
    setRestSeconds(clamped);
    await AsyncStorage.setItem('defaultRestSeconds', String(clamped));
  }

  async function saveWeightStep(val: number) {
    setWeightStep(val);
    await AsyncStorage.setItem('weightStep', String(val));
  }

  function handleDeleteAll() {
    Alert.alert('Sei sicuro?', 'Questa azione eliminerà tutte le schede, sessioni e record.', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina', style: 'destructive', onPress: () => {
          Alert.alert('Conferma eliminazione', 'Ultimo avviso: tutti i dati saranno persi definitivamente.', [
            { text: 'Annulla', style: 'cancel' },
            {
              text: 'Elimina tutto', style: 'destructive', onPress: async () => {
                await deleteAllData();
                Alert.alert('Fatto', 'Tutti i dati sono stati eliminati.');
              },
            },
          ]);
        },
      },
    ]);
  }

  const weightSteps = [1.0, 1.25, 2.0, 2.5, 5.0];

  return (
    <View style={styles.container}>
      {/* Rest time */}
      <Text style={styles.sectionTitle}>ALLENAMENTO</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Recupero default</Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity onPress={() => saveRest(restSeconds - 15)} style={styles.stepBtn}>
              <Ionicons name="remove" size={20} color={Colors.accent} />
            </TouchableOpacity>
            <Text style={styles.stepValue}>{restSeconds}s</Text>
            <TouchableOpacity onPress={() => saveRest(restSeconds + 15)} style={styles.stepBtn}>
              <Ionicons name="add" size={20} color={Colors.accent} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        <View>
          <Text style={styles.label}>Incremento peso</Text>
          <View style={styles.chipsRow}>
            {weightSteps.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, s === weightStep && styles.chipActive]}
                onPress={() => saveWeightStep(s)}
              >
                <Text style={[styles.chipText, s === weightStep && styles.chipTextActive]}>
                  {s % 1 === 0 ? s : s.toFixed(2)} kg
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Data */}
      <Text style={styles.sectionTitle}>DATI</Text>
      <View style={styles.card}>
        <TouchableOpacity onPress={handleDeleteAll} style={styles.row}>
          <Ionicons name="trash-outline" size={20} color={Colors.destructive} />
          <Text style={[styles.label, { color: Colors.destructive }]}>Elimina tutti i dati</Text>
        </TouchableOpacity>
      </View>

      {/* Info */}
      <Text style={styles.sectionTitle}>INFO</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Versione</Text>
          <Text style={styles.valueText}>1.0.0</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  sectionTitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 24, marginBottom: 8, letterSpacing: 1 },
  card: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  label: { fontSize: 16, color: Colors.text },
  valueText: { fontSize: 16, color: Colors.textSecondary },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceLight, alignItems: 'center', justifyContent: 'center' },
  stepValue: { fontSize: 18, fontWeight: '600', color: Colors.text, fontVariant: ['tabular-nums'], minWidth: 50, textAlign: 'center' },
  chipsRow: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  chip: { backgroundColor: Colors.surfaceLight, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  chipActive: { backgroundColor: Colors.accent },
  chipText: { fontSize: 14, color: Colors.text },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#333' },
});

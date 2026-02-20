import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { WorkoutTemplate } from '@/types';
import { fetchAllTemplates, deleteTemplate, duplicateTemplate } from '@/services/database';
import GymBroCard from '@/components/GymBroCard';

export default function TemplatesScreen() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  async function load() {
    setTemplates(await fetchAllTemplates());
  }

  function handleDelete(id: string, name: string) {
    Alert.alert('Elimina', `Eliminare "${name}"?`, [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina', style: 'destructive', onPress: async () => {
          await deleteTemplate(id);
          load();
        },
      },
    ]);
  }

  async function handleDuplicate(id: string) {
    await duplicateTemplate(id);
    load();
  }

  function estimatedMinutes(t: WorkoutTemplate): number {
    const totalSets = t.exercises.reduce((a, e) => a + e.sets, 0);
    const avgRest = t.exercises.length > 0
      ? t.exercises.reduce((a, e) => a + e.restSeconds, 0) / t.exercises.length
      : 90;
    return Math.max(Math.round(totalSets * (45 + avgRest) / 60), 1);
  }

  if (templates.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.empty}>
          <Ionicons name="document-text-outline" size={50} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>Nessuna scheda</Text>
          <Text style={styles.emptySubtitle}>Crea la tua prima scheda di allenamento</Text>
        </View>
        <TouchableOpacity style={styles.fab} onPress={() => router.push('/template/new')}>
          <Ionicons name="add" size={32} color={Colors.text} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={templates}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push(`/template/${item.id}`)} activeOpacity={0.7}>
            <GymBroCard style={{ marginBottom: 12 }}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <View style={styles.titleRow}>
                    <Text style={styles.name}>{item.name}</Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.splitType}</Text>
                    </View>
                  </View>
                  <Text style={styles.meta}>
                    {item.exercises.length} esercizi · ~{estimatedMinutes(item)} min
                  </Text>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => handleDuplicate(item.id)} style={styles.actionBtn}>
                    <Ionicons name="copy-outline" size={20} color={Colors.accent} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={styles.actionBtn}>
                    <Ionicons name="trash-outline" size={20} color={Colors.destructive} />
                  </TouchableOpacity>
                </View>
              </View>
            </GymBroCard>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/template/new')}>
        <Ionicons name="add" size={32} color={Colors.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: Colors.text },
  emptySubtitle: { fontSize: 16, color: Colors.textSecondary },
  row: { flexDirection: 'row', alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 18, color: Colors.text, fontWeight: '600' },
  badge: { backgroundColor: 'rgba(51,136,238,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 12, color: Colors.accent },
  meta: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: { padding: 8 },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4,
  },
});

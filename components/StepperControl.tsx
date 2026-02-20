import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

interface Props {
  label: string;
  value: string;
  onIncrement: () => void;
  onDecrement: () => void;
  large?: boolean;
}

export default function StepperControl({ label, value, onIncrement, onDecrement, large = false }: Props) {
  const iconSize = large ? 44 : 36;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <TouchableOpacity onPress={onDecrement} style={styles.touchTarget} activeOpacity={0.6}>
          <Ionicons name="remove-circle" size={iconSize} color={Colors.accent} />
        </TouchableOpacity>

        <Text style={[styles.value, large && styles.valueLarge]}>{value}</Text>

        <TouchableOpacity onPress={onIncrement} style={styles.touchTarget} activeOpacity={0.6}>
          <Ionicons name="add-circle" size={iconSize} color={Colors.accent} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  touchTarget: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    color: Colors.text,
    minWidth: 80,
    textAlign: 'center',
  },
  valueLarge: {
    fontSize: 36,
  },
});

import { Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

interface Props {
  seconds: number;
  isStandMode?: boolean;
}

export default function TimerDisplay({ seconds, isStandMode = false }: Props) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const formatted = `${m}:${s.toString().padStart(2, '0')}`;

  return (
    <Text style={[styles.timer, isStandMode && styles.timerStand]}>
      {formatted}
    </Text>
  );
}

const styles = StyleSheet.create({
  timer: {
    fontSize: 72,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    color: Colors.text,
    textAlign: 'center',
  },
  timerStand: {
    fontSize: 120,
  },
});

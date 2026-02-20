import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import * as haptics from '@/services/haptics';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  disabled?: boolean;
}

export default function GymBroButton({ title, onPress, variant = 'primary', icon, style, disabled }: Props) {
  const bgColor = variant === 'primary' ? Colors.primary : variant === 'destructive' ? 'rgba(255,59,48,0.2)' : Colors.surface;
  const textColor = variant === 'destructive' ? Colors.destructive : Colors.text;

  return (
    <TouchableOpacity
      onPress={() => {
        haptics.buttonTap();
        onPress();
      }}
      disabled={disabled}
      style={[styles.button, { backgroundColor: bgColor, opacity: disabled ? 0.5 : 1 }, style]}
      activeOpacity={0.7}
    >
      {icon && <Ionicons name={icon} size={20} color={textColor} style={{ marginRight: 8 }} />}
      <Text style={[styles.text, { color: textColor }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 70,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    fontSize: 18,
    fontWeight: '700',
  },
});

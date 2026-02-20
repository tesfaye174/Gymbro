import * as Haptics from 'expo-haptics';

export function exerciseEnd() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export async function restEnd() {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  setTimeout(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, 150);
}

export function workoutComplete() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export function buttonTap() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

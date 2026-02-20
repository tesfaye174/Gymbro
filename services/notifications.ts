import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestPermission() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleRestComplete(seconds: number, nextExercise?: string) {
  await cancelAll();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Tempo di recupero terminato',
      body: nextExercise ? `Prossimo: ${nextExercise}` : 'Pronti per la prossima serie',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(seconds, 1),
    },
  });
}

export async function cancelAll() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

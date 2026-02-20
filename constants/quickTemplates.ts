import { Exercise } from '@/types';
import { v4 as uuid } from 'uuid';

export interface QuickTemplate {
  name: string;
  splitType: string;
  exercises: Omit<Exercise, 'id'>[];
}

export const quickTemplates: QuickTemplate[] = [
  {
    name: 'Push Day',
    splitType: 'Push',
    exercises: [
      { name: 'Bench Press', sets: 4, reps: 8, restSeconds: 120, order: 0 },
      { name: 'Shoulder Press', sets: 3, reps: 10, restSeconds: 90, order: 1 },
      { name: 'Incline Dumbbell Press', sets: 3, reps: 10, restSeconds: 90, order: 2 },
      { name: 'Lateral Raises', sets: 3, reps: 15, restSeconds: 60, order: 3 },
      { name: 'Tricep Pushdown', sets: 3, reps: 12, restSeconds: 60, order: 4 },
    ],
  },
  {
    name: 'Pull Day',
    splitType: 'Pull',
    exercises: [
      { name: 'Deadlift', sets: 4, reps: 6, restSeconds: 150, order: 0 },
      { name: 'Pull-Ups', sets: 4, reps: 8, restSeconds: 120, order: 1 },
      { name: 'Barbell Row', sets: 3, reps: 10, restSeconds: 90, order: 2 },
      { name: 'Face Pulls', sets: 3, reps: 15, restSeconds: 60, order: 3 },
      { name: 'Bicep Curls', sets: 3, reps: 12, restSeconds: 60, order: 4 },
    ],
  },
  {
    name: 'Leg Day',
    splitType: 'Legs',
    exercises: [
      { name: 'Squat', sets: 4, reps: 8, restSeconds: 150, order: 0 },
      { name: 'Romanian Deadlift', sets: 3, reps: 10, restSeconds: 120, order: 1 },
      { name: 'Leg Press', sets: 3, reps: 12, restSeconds: 90, order: 2 },
      { name: 'Leg Curl', sets: 3, reps: 12, restSeconds: 60, order: 3 },
      { name: 'Calf Raises', sets: 4, reps: 15, restSeconds: 60, order: 4 },
    ],
  },
  {
    name: 'Full Body',
    splitType: 'Full Body',
    exercises: [
      { name: 'Squat', sets: 3, reps: 8, restSeconds: 120, order: 0 },
      { name: 'Bench Press', sets: 3, reps: 8, restSeconds: 120, order: 1 },
      { name: 'Barbell Row', sets: 3, reps: 10, restSeconds: 90, order: 2 },
      { name: 'Shoulder Press', sets: 3, reps: 10, restSeconds: 90, order: 3 },
      { name: 'Pull-Ups', sets: 3, reps: 8, restSeconds: 90, order: 4 },
    ],
  },
];

export const commonExercises = [
  'Bench Press', 'Incline Bench Press', 'Dumbbell Press',
  'Shoulder Press', 'Lateral Raises', 'Front Raises',
  'Squat', 'Leg Press', 'Leg Extension', 'Leg Curl',
  'Deadlift', 'Romanian Deadlift', 'Barbell Row',
  'Pull-Ups', 'Lat Pulldown', 'Seated Row',
  'Bicep Curls', 'Hammer Curls', 'Tricep Pushdown',
  'Tricep Dips', 'Face Pulls', 'Cable Flyes',
  'Calf Raises', 'Hip Thrust', 'Lunges',
  'Plank', 'Crunch', 'Russian Twist',
];

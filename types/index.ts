export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  restSeconds: number;
  order: number;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  splitType: string;
  createdAt: string;
  exercises: Exercise[];
}

export interface SetRecord {
  id: string;
  sessionId: string;
  exerciseName: string;
  weight: number;
  repsDone: number;
  fatigue: number;
  setIndex: number;
  timestamp: string;
}

export interface WorkoutSession {
  id: string;
  templateName: string;
  templateId: string | null;
  date: string;
  duration: number;
  completed: boolean;
  setRecords: SetRecord[];
}

export type WorkoutState = 'idle' | 'exerciseRunning' | 'restRunning' | 'completed';

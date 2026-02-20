import * as SQLite from 'expo-sqlite';
import { v4 as uuid } from 'uuid';
import { WorkoutTemplate, Exercise, WorkoutSession, SetRecord } from '@/types';

let db: SQLite.SQLiteDatabase;

export async function initDB() {
  db = await SQLite.openDatabaseAsync('gymbro.db');

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      split_type TEXT DEFAULT 'Custom',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      template_id TEXT NOT NULL,
      name TEXT NOT NULL,
      sets INTEGER DEFAULT 3,
      reps INTEGER DEFAULT 10,
      rest_seconds INTEGER DEFAULT 90,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      template_name TEXT NOT NULL,
      template_id TEXT,
      date TEXT NOT NULL,
      duration INTEGER DEFAULT 0,
      completed INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS set_records (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      exercise_name TEXT NOT NULL,
      weight REAL DEFAULT 0,
      reps_done INTEGER DEFAULT 0,
      fatigue INTEGER DEFAULT 0,
      set_index INTEGER DEFAULT 0,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    );
  `);

  return db;
}

export function getDB() {
  return db;
}

// ─── Templates ────────────────────────────────────────────

export async function createTemplate(
  name: string,
  splitType: string,
  exercises: Omit<Exercise, 'id'>[]
): Promise<string> {
  const id = uuid();
  const now = new Date().toISOString();

  await db.runAsync(
    'INSERT INTO templates (id, name, split_type, created_at) VALUES (?, ?, ?, ?)',
    [id, name, splitType, now]
  );

  for (const ex of exercises) {
    await db.runAsync(
      'INSERT INTO exercises (id, template_id, name, sets, reps, rest_seconds, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [uuid(), id, ex.name, ex.sets, ex.reps, ex.restSeconds, ex.order]
    );
  }

  return id;
}

export async function fetchAllTemplates(): Promise<WorkoutTemplate[]> {
  const rows = await db.getAllAsync<any>('SELECT * FROM templates ORDER BY created_at DESC');
  const templates: WorkoutTemplate[] = [];

  for (const row of rows) {
    const exercises = await db.getAllAsync<any>(
      'SELECT * FROM exercises WHERE template_id = ? ORDER BY sort_order ASC',
      [row.id]
    );

    templates.push({
      id: row.id,
      name: row.name,
      splitType: row.split_type,
      createdAt: row.created_at,
      exercises: exercises.map((e: any) => ({
        id: e.id,
        name: e.name,
        sets: e.sets,
        reps: e.reps,
        restSeconds: e.rest_seconds,
        order: e.sort_order,
      })),
    });
  }

  return templates;
}

export async function fetchTemplate(id: string): Promise<WorkoutTemplate | null> {
  const row = await db.getFirstAsync<any>('SELECT * FROM templates WHERE id = ?', [id]);
  if (!row) return null;

  const exercises = await db.getAllAsync<any>(
    'SELECT * FROM exercises WHERE template_id = ? ORDER BY sort_order ASC',
    [row.id]
  );

  return {
    id: row.id,
    name: row.name,
    splitType: row.split_type,
    createdAt: row.created_at,
    exercises: exercises.map((e: any) => ({
      id: e.id,
      name: e.name,
      sets: e.sets,
      reps: e.reps,
      restSeconds: e.rest_seconds,
      order: e.sort_order,
    })),
  };
}

export async function updateTemplate(
  id: string,
  name: string,
  splitType: string,
  exercises: Omit<Exercise, 'id'>[]
) {
  await db.runAsync('UPDATE templates SET name = ?, split_type = ? WHERE id = ?', [name, splitType, id]);
  await db.runAsync('DELETE FROM exercises WHERE template_id = ?', [id]);

  for (const ex of exercises) {
    await db.runAsync(
      'INSERT INTO exercises (id, template_id, name, sets, reps, rest_seconds, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [uuid(), id, ex.name, ex.sets, ex.reps, ex.restSeconds, ex.order]
    );
  }
}

export async function deleteTemplate(id: string) {
  await db.runAsync('DELETE FROM templates WHERE id = ?', [id]);
}

export async function duplicateTemplate(id: string): Promise<string> {
  const template = await fetchTemplate(id);
  if (!template) throw new Error('Template not found');

  return createTemplate(
    `${template.name} (copia)`,
    template.splitType,
    template.exercises.map((e, i) => ({ ...e, order: i }))
  );
}

// ─── Sessions ─────────────────────────────────────────────

export async function createSession(templateName: string, templateId: string | null): Promise<string> {
  const id = uuid();
  const now = new Date().toISOString();

  await db.runAsync(
    'INSERT INTO sessions (id, template_name, template_id, date, duration, completed) VALUES (?, ?, ?, ?, 0, 0)',
    [id, templateName, templateId]
  );

  return id;
}

export async function completeSession(id: string, duration: number) {
  await db.runAsync('UPDATE sessions SET duration = ?, completed = 1 WHERE id = ?', [duration, id]);
}

export async function addSetRecord(
  sessionId: string,
  exerciseName: string,
  weight: number,
  repsDone: number,
  fatigue: number,
  setIndex: number
) {
  await db.runAsync(
    'INSERT INTO set_records (id, session_id, exercise_name, weight, reps_done, fatigue, set_index, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [uuid(), sessionId, exerciseName, weight, repsDone, fatigue, setIndex, new Date().toISOString()]
  );
}

export async function fetchAllSessions(): Promise<WorkoutSession[]> {
  const rows = await db.getAllAsync<any>('SELECT * FROM sessions ORDER BY date DESC');
  const sessions: WorkoutSession[] = [];

  for (const row of rows) {
    const records = await db.getAllAsync<any>(
      'SELECT * FROM set_records WHERE session_id = ? ORDER BY set_index ASC',
      [row.id]
    );

    sessions.push({
      id: row.id,
      templateName: row.template_name,
      templateId: row.template_id,
      date: row.date,
      duration: row.duration,
      completed: !!row.completed,
      setRecords: records.map((r: any) => ({
        id: r.id,
        sessionId: r.session_id,
        exerciseName: r.exercise_name,
        weight: r.weight,
        repsDone: r.reps_done,
        fatigue: r.fatigue,
        setIndex: r.set_index,
        timestamp: r.timestamp,
      })),
    });
  }

  return sessions;
}

export async function deleteSession(id: string) {
  await db.runAsync('DELETE FROM sessions WHERE id = ?', [id]);
}

export async function fetchLastWeight(exerciseName: string): Promise<number | null> {
  const row = await db.getFirstAsync<any>(
    'SELECT weight FROM set_records WHERE exercise_name = ? ORDER BY timestamp DESC LIMIT 1',
    [exerciseName]
  );
  return row?.weight ?? null;
}

export async function fetchPersonalRecord(exerciseName: string): Promise<number> {
  const row = await db.getFirstAsync<any>(
    'SELECT MAX(weight) as pr FROM set_records WHERE exercise_name = ?',
    [exerciseName]
  );
  return row?.pr ?? 0;
}

export async function fetchStreak(): Promise<number> {
  const rows = await db.getAllAsync<any>(
    "SELECT DISTINCT date(date) as d FROM sessions WHERE completed = 1 ORDER BY d DESC"
  );

  if (rows.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstDate = new Date(rows[0].d);
  firstDate.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((today.getTime() - firstDate.getTime()) / 86400000);
  if (diffDays > 1) return 0;

  let streak = 1;
  for (let i = 1; i < rows.length; i++) {
    const curr = new Date(rows[i - 1].d);
    const prev = new Date(rows[i].d);
    const diff = Math.floor((curr.getTime() - prev.getTime()) / 86400000);
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export async function deleteAllData() {
  await db.execAsync(`
    DELETE FROM set_records;
    DELETE FROM sessions;
    DELETE FROM exercises;
    DELETE FROM templates;
  `);
}

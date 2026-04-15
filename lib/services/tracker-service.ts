import fs from 'fs';
import path from 'path';

export type TrackerStatus = 'applied' | 'phone' | 'interview' | 'offer' | 'rejected';

export interface TrackerEntry {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  location: string;
  source: string;
  url: string;
  appliedAt: string;
  status: TrackerStatus;
  notes: string;
}

const TRACKER_PATH = path.join(process.cwd(), 'data', 'tracker.json');

export class TrackerService {
  static getAll(): TrackerEntry[] {
    if (!fs.existsSync(TRACKER_PATH)) return [];
    try { return JSON.parse(fs.readFileSync(TRACKER_PATH, 'utf-8')); }
    catch { return []; }
  }

  static save(entries: TrackerEntry[]): void {
    const dir = path.dirname(TRACKER_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(TRACKER_PATH, JSON.stringify(entries, null, 2));
  }

  static upsert(entry: Omit<TrackerEntry, 'id' | 'appliedAt' | 'status' | 'notes'> & Partial<Pick<TrackerEntry, 'id' | 'status' | 'notes'>>): TrackerEntry {
    const all = this.getAll();
    const existing = all.find(e => e.jobId === entry.jobId);
    if (existing) {
      const updated = { ...existing, ...entry };
      this.save(all.map(e => e.jobId === entry.jobId ? updated : e));
      return updated;
    }
    const newEntry: TrackerEntry = {
      id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      appliedAt: new Date().toISOString().split('T')[0],
      status: 'applied',
      notes: '',
      ...entry,
    };
    this.save([newEntry, ...all]);
    return newEntry;
  }

  static updateStatus(id: string, status: TrackerStatus): void {
    const all = this.getAll();
    this.save(all.map(e => e.id === id ? { ...e, status } : e));
  }

  static updateNotes(id: string, notes: string): void {
    const all = this.getAll();
    this.save(all.map(e => e.id === id ? { ...e, notes } : e));
  }

  static delete(id: string): void {
    this.save(this.getAll().filter(e => e.id !== id));
  }
}

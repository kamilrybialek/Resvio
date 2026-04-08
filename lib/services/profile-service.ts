import { UserProfile } from "../types";
import fs from 'fs';
import path from 'path';

export class ProfileService {
  private static PROFILE_PATH = path.join(process.cwd(), 'data', 'profile.json');

  static getProfile(): UserProfile | null {
    if (!fs.existsSync(this.PROFILE_PATH)) return null;
    try {
      const data = fs.readFileSync(this.PROFILE_PATH, 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  static saveProfile(profile: UserProfile): void {
    const dir = path.dirname(this.PROFILE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.PROFILE_PATH, JSON.stringify(profile, null, 2));
  }

  static markJobApplied(jobId: string): void {
    const profile = this.getProfile();
    if (profile) {
      const applied = profile.appliedJobs || [];
      if (!applied.includes(jobId)) {
        profile.appliedJobs = [...applied, jobId];
        this.saveProfile(profile);
      }
    }
  }

  static clearDatabase(): void {
    if (fs.existsSync(this.PROFILE_PATH)) {
      fs.unlinkSync(this.PROFILE_PATH);
    }
  }
}


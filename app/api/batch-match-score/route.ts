import { NextRequest, NextResponse } from 'next/server';
import { ProfileService } from '@/lib/services/profile-service';
import { Job } from '@/lib/types';

const MAX_JOBS = 50;

// ── Stop-words to ignore in keyword matching ────────────────────────────────
const STOP_WORDS = new Set([
  'and','the','for','with','that','this','have','from','will','are','been',
  'your','our','their','about','more','also','they','when','what','which',
  'work','team','role','join','help','looking','great','strong','good',
  'you','we','us','new','all','any','per','can','not','but','its','has',
  'job','position','company','candidate','experience','able','must','should',
  'offer','including','like','make','use','used','using','based','across',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,;:./()\-\[\]"'!?+]+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w) && !/^\d+$/.test(w));
}

function buildFreqMap(tokens: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const t of tokens) map.set(t, (map.get(t) ?? 0) + 1);
  return map;
}

/** Partial match: 'typescript' matches 'typescripting', 'react' matches 'reactjs' */
function softContains(haystack: Set<string>, needle: string): boolean {
  if (haystack.has(needle)) return true;
  for (const h of haystack) {
    if (h.startsWith(needle) || needle.startsWith(h)) return true;
  }
  return false;
}

function scoreJob(
  job: Job,
  skills: string[],
  cvTokens: string[],
  cvFreq: Map<string, number>,
  cvText: string,
): number {
  const jobText  = (job.title + ' ' + job.description + ' ' + (job.tags?.join(' ') ?? '')).toLowerCase();
  const jobTokens = tokenize(jobText);
  const jobFreq   = buildFreqMap(jobTokens);
  const jobSet    = new Set(jobTokens);

  // ── 1. Skill match (0–35 pts) ─────────────────────────────────────────────
  // Weight: exact hit = 1.0, partial hit = 0.5
  let skillScore = 0;
  if (skills.length > 0) {
    let hits = 0;
    for (const skill of skills) {
      const s = skill.toLowerCase().trim();
      if (jobText.includes(s)) {
        hits += 1.0;
      } else if (softContains(jobSet, s)) {
        hits += 0.5;
      }
    }
    // Sigmoid-like curve: even 3/20 skills hit should give ~20 pts
    const ratio = hits / skills.length;
    skillScore = Math.round(35 * (1 - Math.exp(-3 * ratio)));
  }

  // ── 2. CV ↔ Job keyword overlap (0–30 pts, TF-IDF-lite) ──────────────────
  // Weight each job token by how rare it is in everyday language (proxy: length).
  // Longer tokens (≥6 chars) are likely domain terms and worth more.
  let weightedHits = 0;
  let totalWeight  = 0;
  for (const [token, freq] of jobFreq) {
    if (token.length < 4) continue;
    const w = token.length >= 6 ? 2 : 1;          // domain-term bonus
    totalWeight += w * Math.min(freq, 3);          // cap per-word influence
    if (cvFreq.has(token) || softContains(new Set(cvTokens), token)) {
      weightedHits += w * Math.min(freq, 3);
    }
  }
  const overlapRatio = totalWeight > 0 ? weightedHits / totalWeight : 0;
  const cvScore = Math.round(30 * (1 - Math.exp(-4 * overlapRatio)));

  // ── 3. Title relevance (0–20 pts) ────────────────────────────────────────
  const titleTokens = tokenize(job.title);
  let titleHits = 0;
  for (const tt of titleTokens) {
    if (cvText.toLowerCase().includes(tt)) titleHits++;
  }
  const titleRatio = titleTokens.length > 0 ? titleHits / titleTokens.length : 0;
  const titleScore = Math.round(20 * titleRatio);

  // ── 4. Seniority alignment (0–10 pts) ────────────────────────────────────
  const SENIOR = ['senior', 'lead', 'principal', 'staff', 'architect', 'head', 'director', 'manager', 'vp'];
  const JUNIOR = ['junior', 'entry', 'graduate', 'trainee', 'intern', 'apprentice'];
  const MID    = ['mid', 'intermediate', 'medior', 'regular'];

  const inJob = (terms: string[]) => terms.some(t => jobText.includes(t));
  const inCv  = (terms: string[]) => terms.some(t => cvText.toLowerCase().includes(t));

  let seniorityScore = 6; // neutral default
  if      (inJob(SENIOR) && inCv(SENIOR)) seniorityScore = 10;
  else if (inJob(JUNIOR) && inCv(JUNIOR)) seniorityScore = 10;
  else if (inJob(MID)    && inCv(MID))    seniorityScore = 10;
  else if (inJob(SENIOR) && inCv(JUNIOR)) seniorityScore = 2;  // big gap
  else if (inJob(JUNIOR) && inCv(SENIOR)) seniorityScore = 4;  // overqualified
  else if (!inJob(SENIOR) && !inJob(JUNIOR) && !inJob(MID)) seniorityScore = 7; // no level stated

  // ── 5. Location / remote (0–5 pts) ───────────────────────────────────────
  const jobLoc = job.location.toLowerCase();
  const remote = ['remote', 'distans', 'zdalne', 'hybrid', 'flexible'];
  const locationScore = remote.some(r => jobLoc.includes(r)) ? 5 : 3;

  // ── Sum & normalise ───────────────────────────────────────────────────────
  const raw = skillScore + cvScore + titleScore + seniorityScore + locationScore;
  // Max theoretical: 35+30+20+10+5 = 100
  // Add small noise (±3) so identical-looking jobs vary slightly
  const noise = Math.round((Math.sin(job.id.charCodeAt(0) * 17 + job.id.length) * 3));
  return Math.min(99, Math.max(2, raw + noise));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const jobs: Job[] = Array.isArray(body.jobs) ? body.jobs.slice(0, MAX_JOBS) : [];

    if (jobs.length === 0) return NextResponse.json({ scores: {} });

    const profile = ProfileService.getProfile();
    const cvText  = (profile?.baseCv || profile?.baseCvPath || '').trim();
    const skills  = Array.isArray(profile?.skills) && profile.skills.length > 0
      ? profile.skills : [];

    if (!cvText && skills.length === 0) return NextResponse.json({ scores: {} });

    // Pre-tokenize CV once for all jobs
    const cvTokens = tokenize(cvText);
    const cvFreq   = buildFreqMap(cvTokens);

    const scores: Record<string, number> = {};
    for (const job of jobs) {
      scores[job.id] = scoreJob(job, skills, cvTokens, cvFreq, cvText);
    }

    return NextResponse.json({ scores });
  } catch (err) {
    console.error('[batch-match-score] error:', err);
    return NextResponse.json({ scores: {} });
  }
}

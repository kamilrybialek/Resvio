import { NextRequest, NextResponse } from 'next/server';
import { ProfileService } from '@/lib/services/profile-service';
import { Job } from '@/lib/types';

const MAX_JOBS = 50;

/**
 * Keyword-based match scoring — no AI, instant, runs on server.
 *
 * Algorithm (0–100):
 *  30 pts  Skill overlap (candidate skills found in job text)
 *  25 pts  CV keyword overlap (words from CV body found in job text)
 *  20 pts  Title relevance (job title words found in CV)
 *  15 pts  Seniority alignment
 *  10 pts  Location match (bonus for remote / same city)
 */
function scoreJob(job: Job, skills: string[], cvWords: Set<string>, cvText: string): number {
  const jobText = (job.title + ' ' + job.description + ' ' + job.company).toLowerCase();
  const jobWords = new Set(jobText.split(/[\s,;()\-/]+/).filter(w => w.length > 3));

  // 1. Skill overlap (30 pts)
  let skillHits = 0;
  for (const skill of skills) {
    const s = skill.toLowerCase();
    if (jobText.includes(s)) skillHits++;
  }
  const skillScore = skills.length > 0
    ? Math.min(30, Math.round((skillHits / skills.length) * 30 + (skillHits > 0 ? 5 : 0)))
    : 0;

  // 2. CV keyword overlap (25 pts) — how many distinct job keywords appear in CV
  const jobKeywords = Array.from(jobWords).filter(w => w.length > 4);
  let cvHits = 0;
  for (const kw of jobKeywords) {
    if (cvWords.has(kw)) cvHits++;
  }
  const cvScore = jobKeywords.length > 0
    ? Math.min(25, Math.round((cvHits / Math.max(jobKeywords.length, 1)) * 50))
    : 0;

  // 3. Title word match (20 pts)
  const titleWords = job.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  let titleHits = 0;
  for (const tw of titleWords) {
    if (cvText.toLowerCase().includes(tw)) titleHits++;
  }
  const titleScore = titleWords.length > 0
    ? Math.min(20, Math.round((titleHits / titleWords.length) * 20))
    : 0;

  // 4. Seniority alignment (15 pts)
  const seniorTerms = ['senior', 'lead', 'principal', 'staff', 'architect', 'manager', 'head', 'director'];
  const juniorTerms = ['junior', 'entry', 'graduate', 'trainee', 'intern'];
  const midTerms    = ['mid', 'intermediate', 'medior'];

  const jobSenior = seniorTerms.some(t => jobText.includes(t));
  const jobJunior = juniorTerms.some(t => jobText.includes(t));
  const jobMid    = midTerms.some(t => jobText.includes(t));

  const cvSenior  = seniorTerms.some(t => cvText.toLowerCase().includes(t));
  const cvJunior  = juniorTerms.some(t => cvText.toLowerCase().includes(t));
  const cvMid     = midTerms.some(t => cvText.toLowerCase().includes(t));

  let seniorityScore = 10; // neutral
  if (jobSenior && cvSenior) seniorityScore = 15;
  if (jobJunior && cvJunior) seniorityScore = 15;
  if (jobMid    && cvMid)    seniorityScore = 15;
  if (jobSenior && cvJunior) seniorityScore = 3;  // overqualified mismatch
  if (jobJunior && cvSenior) seniorityScore = 5;  // underqualified mismatch

  // 5. Location / remote bonus (10 pts)
  const jobLoc = job.location.toLowerCase();
  const isRemote = jobLoc.includes('remote') || jobLoc.includes('distans') || jobLoc.includes('zdalne');
  const locationScore = isRemote ? 10 : 6; // remote = always accessible

  const total = skillScore + cvScore + titleScore + seniorityScore + locationScore;
  return Math.min(100, Math.max(1, total));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const jobs: Job[] = Array.isArray(body.jobs) ? body.jobs.slice(0, MAX_JOBS) : [];

    if (jobs.length === 0) {
      return NextResponse.json({ scores: {} });
    }

    const profile = ProfileService.getProfile();
    const cvText  = (profile?.baseCv || profile?.baseCvPath || '').trim();
    const skills  = Array.isArray(profile?.skills) && profile.skills.length > 0
      ? profile.skills
      : [];

    // Need at least a CV or skill list to score
    if (!cvText && skills.length === 0) {
      return NextResponse.json({ scores: {} });
    }

    // Pre-tokenize CV for fast lookups
    const cvWords = new Set(
      cvText.toLowerCase().split(/[\s,;()\-/]+/).filter(w => w.length > 4)
    );

    const scores: Record<string, number> = {};
    for (const job of jobs) {
      scores[job.id] = scoreJob(job, skills, cvWords, cvText);
    }

    return NextResponse.json({ scores });
  } catch (err) {
    console.error('[batch-match-score] error:', err);
    return NextResponse.json({ scores: {} });
  }
}

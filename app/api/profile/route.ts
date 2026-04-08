import { NextRequest, NextResponse } from 'next/server';
import { ProfileService } from '@/lib/services/profile-service';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Merge with existing
    const existing = ProfileService.getProfile() || { name: '', email: '', phone: '', skills: [], baseCvPath: '' };
    
    const updated = {
      ...existing,
      ...data,
      baseCvPath: data.baseCv || existing.baseCvPath // we map baseCv from UI to baseCvPath (or just overwrite)
    };
    
    // We'll also store baseCv explicitly so they match
    updated.baseCv = data.baseCv || updated.baseCv;

    ProfileService.saveProfile(updated);
    
    return NextResponse.json({ message: 'Profile saved' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
  }
}

export async function GET() {
  const profile = ProfileService.getProfile();
  return NextResponse.json(profile || {});
}

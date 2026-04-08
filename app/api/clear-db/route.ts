import { NextResponse } from 'next/server';
import { ProfileService } from '@/lib/services/profile-service';

export async function POST() {
  try {
    ProfileService.clearDatabase();
    return NextResponse.json({ message: 'Database cleared successfully.' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to clear database.' }, { status: 500 });
  }
}

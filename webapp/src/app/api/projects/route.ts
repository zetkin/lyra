import getProjects from '@/lib/getProjects';
import { NextResponse } from 'next/server';
import { ServerConfigReadingError } from '@/errors';

export async function GET() {
  try {
    const projects = await getProjects();
    return NextResponse.json(projects);
  } catch (e) {
    if (e instanceof ServerConfigReadingError) {
      return NextResponse.json({ message: e.message }, { status: 500 });
    }
    throw e;
  }
}

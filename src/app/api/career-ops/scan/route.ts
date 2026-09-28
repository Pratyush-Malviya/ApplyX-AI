import { NextRequest, NextResponse } from 'next/server';
import { scanJobs } from '@/lib/career-ops-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, location, limit, providers, output } = body;

    const result = await scanJobs({
      query,
      location,
      limit,
      providers,
      output,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, stderr: result.stderr },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: result.data, stdout: result.stdout });
  } catch (error) {
    console.error('Scan API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
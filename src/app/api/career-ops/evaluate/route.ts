import { NextRequest, NextResponse } from 'next/server';
import { evaluateOffer } from '@/lib/career-ops-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobDescription, model, cvPath, output } = body;

    if (!jobDescription) {
      return NextResponse.json(
        { error: 'jobDescription is required' },
        { status: 400 }
      );
    }

    const result = await evaluateOffer(jobDescription, { model, cvPath, output });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, stderr: result.stderr },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: result.data, stdout: result.stdout });
  } catch (error) {
    console.error('Evaluate API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { generateCV } from '@/lib/career-ops-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobDescription, cvPath, template, output, format } = body;

    const result = await generateCV({
      jobDescription,
      cvPath,
      template,
      output,
      format,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, stderr: result.stderr },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: result.data, stdout: result.stdout });
  } catch (error) {
    console.error('CV Generation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { listReports, getReportsDir } from '@/lib/career-ops-api';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const status = searchParams.get('status') || undefined;
    const id = searchParams.get('id');

    // If specific report ID requested, read the file directly
    if (id) {
      const reportsDir = getReportsDir();
      const reportPath = path.join(reportsDir, `${id}.md`);
      
      if (!fs.existsSync(reportPath)) {
        return NextResponse.json(
          { error: 'Report not found' },
          { status: 404 }
        );
      }

      const content = fs.readFileSync(reportPath, 'utf-8');
      return NextResponse.json({ data: { id, content } });
    }

    // Otherwise list reports
    const result = await listReports({ limit, status });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, stderr: result.stderr },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: result.data, stdout: result.stdout });
  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
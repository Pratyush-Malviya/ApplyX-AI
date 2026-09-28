import { NextRequest, NextResponse } from 'next/server';
import { trackApplication } from '@/lib/career-ops-api';

export async function GET(request: NextRequest) {
  try {
    const result = await trackApplication({ action: 'list' });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, stderr: result.stderr },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: result.data, stdout: result.stdout });
  } catch (error) {
    console.error('List Applications API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id, company, role, status, url, notes } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'action is required' },
        { status: 400 }
      );
    }

    const result = await trackApplication({ action, id, company, role, status, url, notes });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, stderr: result.stderr },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: result.data, stdout: result.stdout });
  } catch (error) {
    console.error('Track Application API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const result = await trackApplication({ action: 'remove', id });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, stderr: result.stderr },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: result.data, stdout: result.stdout });
  } catch (error) {
    console.error('Delete Application API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
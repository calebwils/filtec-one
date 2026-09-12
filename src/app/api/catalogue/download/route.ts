import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const filePath = path.join(process.cwd(), 'public', 'catalogues', 'FILTEC_CATALOGUE_01.07.2026.pdf');

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Catalogue file not found' }, { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="FILTEC_CATALOGUE_01.07.2026.pdf"',
      'Content-Length': fileBuffer.length.toString(),
    },
  });
}

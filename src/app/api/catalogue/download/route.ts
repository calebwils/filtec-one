import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const filePath = path.join(process.cwd(), 'public', 'catalogues', 'FILTEC_CATALOGUE_01.07.2026.pdf');

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Catalogue file not found' }, { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const nodeStream = fs.createReadStream(filePath);

  const webStream = new ReadableStream({
    start(controller) {
      nodeStream.on('data', (chunk) => controller.enqueue(chunk));
      nodeStream.on('end', () => controller.close());
      nodeStream.on('error', (err) => controller.error(err));
    },
    cancel() {
      nodeStream.destroy();
    }
  });

  return new NextResponse(webStream as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="FILTEC_CATALOGUE_01.07.2026.pdf"',
      'Content-Length': stat.size.toString(),
    },
  });
}


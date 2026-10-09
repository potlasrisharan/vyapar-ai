// app/api/ai/ocr/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sarvamExtractInvoice } from '@/lib/services/sarvam';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let textToParse = '';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      textToParse = body.text || '';
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file');
      const text = formData.get('text');

      if (typeof text === 'string' && text) {
        textToParse = text;
      } else if (file && file instanceof Blob) {
        // Read text content if available or file details
        textToParse = await file.text();
      }
    }

    if (!textToParse.trim()) {
      return NextResponse.json(
        { error: 'Document text or valid file required' },
        { status: 400 }
      );
    }

    const extraction = await sarvamExtractInvoice(textToParse);

    return NextResponse.json({
      success: true,
      extraction: extraction,
    });
  } catch (error: unknown) {
    console.error('OCR API Error:', error);
    const message = error instanceof Error ? error.message : 'OCR processing failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

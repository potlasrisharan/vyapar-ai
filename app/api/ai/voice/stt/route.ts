// app/api/ai/voice/stt/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sarvamSTT } from '@/lib/services/sarvam';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const languageCode = (formData.get('language_code') as string) || 'hi-IN';

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'Audio file is required in formData under key "file"' },
        { status: 400 }
      );
    }

    const transcript = await sarvamSTT(file, 'recording.wav', languageCode);

    return NextResponse.json({
      transcript: transcript || '',
      languageCode: languageCode,
    });
  } catch (error: unknown) {
    console.error('STT API Error:', error);
    return NextResponse.json({ transcript: '', error: 'Transcription unavailable' }, { status: 200 });
  }
}

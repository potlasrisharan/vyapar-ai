// app/api/ai/voice/tts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sarvamTTS } from '@/lib/services/sarvam';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = body.text;
    const languageCode = body.languageCode || 'hi-IN';
    const speaker = body.speaker || 'aditya';

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text string is required' },
        { status: 400 }
      );
    }

    const audioBase64 = await sarvamTTS(text, languageCode, speaker);

    return NextResponse.json({
      audio: audioBase64,
      mimeType: 'audio/wav',
      speaker: speaker,
    });
  } catch (error: unknown) {
    console.error('TTS API Error:', error);
    const message = error instanceof Error ? error.message : 'TTS generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

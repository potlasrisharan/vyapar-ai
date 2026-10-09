// lib/core/services/api_service.dart
// Hits the same Next.js API routes as the web app

import 'package:dio/dio.dart';
import '../domain/entities.dart';

// Production URL — same backend, same API keys via server-side env vars
// Use --dart-define=API_BASE_URL=https://your-amplify-url.aws.amplifyapp.com
const String _defaultBaseUrl = 'http://localhost:3000';

class ApiService {
  ApiService({String? baseUrl}) {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl ?? const String.fromEnvironment('API_BASE_URL', defaultValue: _defaultBaseUrl),
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
    ));

    _dio.interceptors.add(LogInterceptor(
      requestBody: false,
      responseBody: false,
    ));
  }

  late final Dio _dio;

  /// POST /api/ai/chat — Sarvam 105B + Groq fallback
  Future<String> chat({
    required String question,
    required Language language,
    String? promptId,
    Map<String, dynamic>? context,
  }) async {
    final res = await _dio.post('/api/ai/chat', data: {
      'messages': [
        {'role': 'user', 'content': question}
      ],
      'language': language.name,
      if (promptId != null) 'promptId': promptId,
      if (context != null) 'context': context,
    });
    final data = res.data as Map<String, dynamic>;
    return ((data['content'] ?? data['text'] ?? '') as String).trim();
  }

  /// POST /api/ai/voice/stt — Sarvam Saaras STT
  Future<String> transcribe(List<int> audioBytes, {String languageCode = 'hi-IN'}) async {
    final formData = FormData.fromMap({
      'file': MultipartFile.fromBytes(audioBytes, filename: 'recording.wav'),
      'language_code': languageCode,
    });
    final res = await _dio.post('/api/ai/voice/stt', data: formData);
    return (res.data as Map<String, dynamic>)['transcript'] as String? ?? '';
  }

  /// POST /api/ai/voice/tts — Sarvam Bulbul TTS → returns base64 audio
  Future<String> synthesize(String text, {String languageCode = 'hi-IN', String speaker = 'aditya'}) async {
    final res = await _dio.post('/api/ai/voice/tts', data: {
      'text': text,
      'languageCode': languageCode,
      'speaker': speaker,
    });
    return (res.data as Map<String, dynamic>)['audio'] as String? ?? '';
  }

  /// POST /api/ai/document — OCR extraction
  Future<Map<String, dynamic>> extractDocument(List<int> imageBytes, String filename) async {
    final formData = FormData.fromMap({
      'file': MultipartFile.fromBytes(imageBytes, filename: filename),
    });
    final res = await _dio.post('/api/ai/ocr', data: formData);
    return res.data as Map<String, dynamic>;
  }
}

// Singleton — use via Riverpod provider, not directly
final _apiService = ApiService();
ApiService get apiService => _apiService;

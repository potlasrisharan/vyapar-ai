// lib/core/services/api_service.dart
// Hits the same Next.js API routes as the web app

import 'package:dio/dio.dart';
import '../domain/entities.dart';

// Production URL — same backend, same API keys via server-side env vars
// Use --dart-define=API_BASE_URL=http://172.26.40.186:3000 or your cloud backend
const String _defaultBaseUrl = 'http://172.26.40.186:3000';

class AiChatResult {
  const AiChatResult({
    required this.content,
    this.evidenceIds = const [],
    this.provider,
    this.isGrounded = false,
  });

  final String content;
  final List<String> evidenceIds;
  final String? provider;
  final bool isGrounded;
}

class ApiService {
  ApiService({String? baseUrl}) {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl ?? const String.fromEnvironment('API_BASE_URL', defaultValue: _defaultBaseUrl),
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
    ));

    _dio.interceptors.add(LogInterceptor(
      requestBody: false,
      responseBody: false,
    ));
  }

  late final Dio _dio;

  String get baseUrl => _dio.options.baseUrl;

  void updateBaseUrl(String newUrl) {
    _dio.options.baseUrl = newUrl.trim();
  }

  /// POST /api/ai/chat — Sarvam 105B + Groq fallback + Rigid RAG grounding
  Future<AiChatResult> chatDetailed({
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
    final content = ((data['content'] ?? data['text'] ?? '') as String).trim();
    final rawEvidence = data['evidenceIds'];
    final evidenceIds = rawEvidence is List
        ? rawEvidence.map((e) => e.toString()).toList()
        : const <String>[];
    final provider = data['provider'] as String?;
    final isGrounded = data['isGrounded'] == true;

    return AiChatResult(
      content: content,
      evidenceIds: evidenceIds,
      provider: provider,
      isGrounded: isGrounded,
    );
  }

  /// Convenience wrapper returning plain text
  Future<String> chat({
    required String question,
    required Language language,
    String? promptId,
    Map<String, dynamic>? context,
  }) async {
    final res = await chatDetailed(
      question: question,
      language: language,
      promptId: promptId,
      context: context,
    );
    return res.content;
  }

  /// POST /api/ai/voice/stt — Sarvam Saaras STT
  Future<String> transcribe(List<int> audioBytes, {String languageCode = 'hi-IN'}) async {
    final formData = FormData.fromMap({
      'file': MultipartFile.fromBytes(audioBytes, filename: 'recording.wav'),
      'language_code': languageCode,
    });
    final res = await _dio.post(
      '/api/ai/voice/stt',
      data: formData,
      options: Options(contentType: 'multipart/form-data'),
    );
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
    final res = await _dio.post(
      '/api/ai/ocr',
      data: formData,
      options: Options(contentType: 'multipart/form-data'),
    );
    return res.data as Map<String, dynamic>;
  }
}

// Singleton — use via Riverpod provider, not directly
final _apiService = ApiService();
ApiService get apiService => _apiService;

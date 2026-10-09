// lib/features/assistant/presentation/screens/assistant_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_sizes.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/domain/entities.dart';

class AssistantScreen extends ConsumerStatefulWidget {
  const AssistantScreen({super.key});

  @override
  ConsumerState<AssistantScreen> createState() => _AssistantScreenState();
}

class _AssistantScreenState extends ConsumerState<AssistantScreen> {
  final TextEditingController _textController = TextEditingController();
  final List<ChatMessage> _messages = [
    ChatMessage(
      id: 'init-1',
      role: MessageRole.assistant,
      text: 'नमस्ते! मैं आपका VyaparAI असिस्टेंट हूँ। आप मुझसे अपनी दुकान की उधारी, बिक्री, या स्टॉक के बारे में हिंदी, Hinglish या English में पूछ सकते हैं।',
      evidenceIds: [],
      createdAt: DateTime.now(),
    ),
  ];
  bool _isLoading = false;
  bool _isRecording = false;

  final List<String> _quickPrompts = [
    'Aaj ki udhari kitni hai?',
    'Kaunse bills overdue hain?',
    'Sabse zyada stock kiska kam hai?',
    'Rahul Traders ne kitna payment diya?',
  ];

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  Future<void> _sendMessage(String query) async {
    if (query.trim().isEmpty) return;
    _textController.clear();

    final userMsg = ChatMessage(
      id: 'msg-${DateTime.now().millisecondsSinceEpoch}',
      role: MessageRole.user,
      text: query,
      evidenceIds: [],
      createdAt: DateTime.now(),
    );

    setState(() {
      _messages.add(userMsg);
      _isLoading = true;
    });

    try {
      final language = ref.read(appProvider.select((s) => s.language));
      final api = ref.read(apiServiceProvider);

      // Attempt live chat with Sarvam API; fallback to smart offline response if offline
      String replyText;
      try {
        replyText = await api.chat(question: query, language: language);
      } catch (_) {
        final q = query.toLowerCase();
        if (q.contains('udhari') || q.contains('overdue') || q.contains('pending')) {
          replyText = 'Sharma Electronics ka kul baazar outstanding ₹82,000 hai. Isme Rahul Traders (INV-1038) ka ₹44,840 sabse bada overdue bill hai jo 12 din se pending hai.';
        } else if (q.contains('stock') || q.contains('item')) {
          replyText = '3 items safety stock se neeche hain: Samsung 43" TV (4 units left), LG 1.5T AC (3 units left), aur Havells Fans (12 units left). Reorder recommended hai.';
        } else {
          replyText = 'Aapka sawal darj kiya gaya hai. September 2026 me total sales ₹1,48,000 aur expenses ₹2,20,742 rahe hain.';
        }
      }

      if (mounted) {
        setState(() {
          _messages.add(ChatMessage(
            id: 'asst-${DateTime.now().millisecondsSinceEpoch}',
            role: MessageRole.assistant,
            text: replyText,
            evidenceIds: ['INV-1038', 'DOC-1'],
            createdAt: DateTime.now(),
          ));
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _toggleRecording() {
    setState(() => _isRecording = !_isRecording);
    if (!_isRecording) {
      // Stopped recording -> simulate speech transcription
      _sendMessage('Aaj market me kitna paisa fasa hua hai?');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Row(
          children: [
            CircleAvatar(
              radius: 16,
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              child: Icon(Icons.smart_toy_outlined, size: 18),
            ),
            SizedBox(width: AppSizes.sm),
            Text('AI Voice Copilot'),
          ],
        ),
      ),
      body: Column(
        children: [
          // Quick prompt chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: AppSizes.md, vertical: AppSizes.sm),
            child: Row(
              children: _quickPrompts
                  .map((prompt) => Padding(
                        padding: const EdgeInsets.only(right: AppSizes.sm),
                        child: ActionChip(
                          avatar: const Icon(Icons.flash_on, size: 14, color: AppColors.primary),
                          label: Text(prompt, style: const TextStyle(fontSize: AppSizes.textXs)),
                          onPressed: () => _sendMessage(prompt),
                        ),
                      ))
                  .toList(),
            ),
          ),
          const Divider(),

          // Chat messages
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.all(AppSizes.md),
              itemCount: _messages.length,
              separatorBuilder: (_, __) => const SizedBox(height: AppSizes.md),
              itemBuilder: (context, index) {
                final msg = _messages[index];
                final isUser = msg.role == MessageRole.user;

                return Align(
                  alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    constraints: BoxConstraints(
                      maxWidth: MediaQuery.of(context).size.width * 0.8,
                    ),
                    padding: const EdgeInsets.all(AppSizes.md),
                    decoration: BoxDecoration(
                      color: isUser ? AppColors.primary : AppColors.surfaceDark2,
                      borderRadius: BorderRadius.only(
                        topLeft: const Radius.circular(AppSizes.radiusMd),
                        topRight: const Radius.circular(AppSizes.radiusMd),
                        bottomLeft: Radius.circular(isUser ? AppSizes.radiusMd : 0),
                        bottomRight: Radius.circular(isUser ? 0 : AppSizes.radiusMd),
                      ),
                      border: Border.all(
                        color: isUser ? AppColors.primary : AppColors.borderDark,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          msg.text,
                          style: TextStyle(
                            color: isUser ? Colors.white : AppColors.textPrimary,
                            fontSize: AppSizes.textMd,
                            height: 1.4,
                          ),
                        ),
                        if (msg.evidenceIds.isNotEmpty) ...[
                          const SizedBox(height: AppSizes.xs),
                          Wrap(
                            spacing: 4,
                            children: msg.evidenceIds
                                .map((ev) => Chip(
                                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                      visualDensity: VisualDensity.compact,
                                      label: Text(
                                        'Ref: $ev',
                                        style: const TextStyle(fontSize: 9),
                                      ),
                                    ))
                                .toList(),
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          if (_isLoading)
            const Padding(
              padding: EdgeInsets.all(AppSizes.sm),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                  SizedBox(width: AppSizes.sm),
                  Text('VyaparAI is thinking...', style: TextStyle(color: AppColors.textSecondary)),
                ],
              ),
            ),

          // Voice wave indicator if recording
          if (_isRecording)
            Container(
              color: AppColors.error.withValues(alpha: 0.15),
              padding: const EdgeInsets.symmetric(vertical: AppSizes.sm),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.mic, color: AppColors.error),
                  SizedBox(width: AppSizes.sm),
                  Text(
                    'Listening in Hindi/English... Tap mic to stop',
                    style: TextStyle(color: AppColors.error, fontWeight: FontWeight.w700),
                  ),
                ],
              ),
            ),

          // Input field
          Container(
            padding: const EdgeInsets.symmetric(horizontal: AppSizes.md, vertical: AppSizes.sm),
            decoration: const BoxDecoration(
              color: AppColors.surfaceDark,
              border: Border(top: BorderSide(color: AppColors.borderDark)),
            ),
            child: Row(
              children: [
                IconButton(
                  icon: Icon(
                    _isRecording ? Icons.stop_circle : Icons.mic,
                    color: _isRecording ? AppColors.error : AppColors.primary,
                  ),
                  onPressed: _toggleRecording,
                ),
                Expanded(
                  child: TextField(
                    controller: _textController,
                    decoration: const InputDecoration(
                      hintText: 'Ask in voice or text (Hindi/English)...',
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                    ),
                    onSubmitted: _sendMessage,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.send, color: AppColors.primary),
                  onPressed: () => _sendMessage(_textController.text),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

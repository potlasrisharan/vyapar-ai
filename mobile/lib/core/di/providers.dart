// lib/core/di/providers.dart
// Global Riverpod providers

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../domain/entities.dart';
import '../services/mock_data.dart';
import '../services/api_service.dart';

// ── App State ─────────────────────────────────────────────────────────────────

class AppState {
  const AppState({
    this.language = Language.hinglish,
    this.theme = AppThemeMode.light,
    this.insightStatuses = const {},
    this.conversations = const [],
  });

  final Language language;
  final AppThemeMode theme;
  final Map<String, InsightStatus> insightStatuses;
  final List<Conversation> conversations;

  AppState copyWith({
    Language? language,
    AppThemeMode? theme,
    Map<String, InsightStatus>? insightStatuses,
    List<Conversation>? conversations,
  }) =>
      AppState(
        language: language ?? this.language,
        theme: theme ?? this.theme,
        insightStatuses: insightStatuses ?? this.insightStatuses,
        conversations: conversations ?? this.conversations,
      );
}

enum AppThemeMode { dark, light }

class AppNotifier extends Notifier<AppState> {
  @override
  AppState build() => const AppState();

  void setLanguage(Language lang) => state = state.copyWith(language: lang);

  void toggleTheme() => state = state.copyWith(
        theme: state.theme == AppThemeMode.dark ? AppThemeMode.light : AppThemeMode.dark,
      );

  void setInsightStatus(String insightId, InsightStatus status) {
    final updated = Map<String, InsightStatus>.from(state.insightStatuses)
      ..[insightId] = status;
    state = state.copyWith(insightStatuses: updated);
  }

  void addConversation(Conversation conversation) {
    state = state.copyWith(conversations: [...state.conversations, conversation]);
  }

  void updateConversation(Conversation updated) {
    final list = state.conversations
        .map((c) => c.id == updated.id ? updated : c)
        .toList();
    state = state.copyWith(conversations: list);
  }
}

final appProvider = NotifierProvider<AppNotifier, AppState>(AppNotifier.new);

// ── Business Data ─────────────────────────────────────────────────────────────

class BusinessDataNotifier extends Notifier<BusinessData> {
  @override
  BusinessData build() => mockBusinessData;

  void addDocument(AppDocument doc) {
    state = state.copyWith(
      documents: [doc, ...state.documents],
    );
  }

  void addInvoice(Invoice invoice) {
    state = state.copyWith(
      invoices: [invoice, ...state.invoices],
    );
  }

  void addPayment(Payment payment) {
    state = state.copyWith(
      payments: [payment, ...state.payments],
    );
  }

  void reset() {
    state = mockBusinessData;
  }
}

final businessDataProvider =
    NotifierProvider<BusinessDataNotifier, BusinessData>(BusinessDataNotifier.new);

// ── API Service ───────────────────────────────────────────────────────────────

final apiServiceProvider = Provider<ApiService>((ref) => apiService);

// ── Derived / Computed ────────────────────────────────────────────────────────

final openInsightsProvider = Provider<List<Insight>>((ref) {
  final data = ref.watch(businessDataProvider);
  final statuses = ref.watch(appProvider.select((s) => s.insightStatuses));
  return data.insights
      .where((i) => (statuses[i.id] ?? InsightStatus.open) == InsightStatus.open)
      .toList();
});

final lowStockProductsProvider = Provider<List<Product>>((ref) {
  final data = ref.watch(businessDataProvider);
  return data.products.where((p) => p.isLowStock).toList();
});

final overdueInvoicesProvider = Provider<List<Invoice>>((ref) {
  final data = ref.watch(businessDataProvider);
  return data.invoices.where((i) => i.status == InvoiceStatus.overdue).toList();
});

final currentConversationProvider = Provider<Conversation?>((ref) {
  final conversations = ref.watch(appProvider.select((s) => s.conversations));
  if (conversations.isEmpty) return null;
  return conversations.last;
});

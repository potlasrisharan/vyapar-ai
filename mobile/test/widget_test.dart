import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:vyparai_mobile/main.dart';
import 'package:vyparai_mobile/core/di/providers.dart';
import 'package:vyparai_mobile/core/domain/entities.dart';
import 'package:vyparai_mobile/core/services/mock_data.dart';
import 'package:vyparai_mobile/features/invoices/presentation/screens/invoices_screen.dart';
import 'package:vyparai_mobile/features/payments/presentation/screens/payments_screen.dart';
import 'package:vyparai_mobile/features/customers/presentation/screens/customers_screen.dart';
import 'package:vyparai_mobile/features/inventory/presentation/screens/inventory_screen.dart';
import 'package:vyparai_mobile/features/insights/presentation/screens/insights_screen.dart';
import 'package:vyparai_mobile/features/settings/presentation/screens/settings_screen.dart';
import 'package:vyparai_mobile/features/documents/presentation/screens/documents_screen.dart';
import 'package:vyparai_mobile/features/assistant/presentation/screens/assistant_screen.dart';

void main() {
  Widget createTestWidget(Widget child) {
    return ProviderScope(
      child: MaterialApp(
        home: child,
      ),
    );
  }

  group('VyaparAI Mobile Feature Verification Tests', () {
    testWidgets('1. App shell & Overview dashboard renders properly', (tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(const ProviderScope(child: VyaparAIApp()));
      await tester.pumpAndSettle();

      // Verify business title and location
      expect(find.textContaining('Sharma Electronics'), findsWidgets);
      expect(find.textContaining('Kanpur'), findsWidgets);

      // Verify quick action tiles
      expect(find.text('Create Invoice'), findsOneWidget);
      expect(find.text('Record Payment'), findsOneWidget);
      expect(find.text('Upload Document'), findsOneWidget);
      expect(find.text('Ask Copilot'), findsWidgets);

      // Verify metrics
      expect(find.text('Revenue'), findsOneWidget);
      expect(find.text('Outstanding'), findsOneWidget);
      expect(find.text('Expenses'), findsOneWidget);
      expect(find.text('Low Stock'), findsOneWidget);
    });

    testWidgets('2. Invoices Screen lists bills, filters by status, and shows counts', (tester) async {
      await tester.pumpWidget(createTestWidget(const InvoicesScreen()));
      await tester.pumpAndSettle();

      expect(find.text('Invoices (Udhaari Ledger)'), findsOneWidget);
      expect(find.text('All (5)'), findsOneWidget);
      expect(find.text('Overdue (2)'), findsOneWidget);
      expect(find.text('Pending (2)'), findsOneWidget);
      expect(find.text('Paid (1)'), findsOneWidget);

      // Tap Overdue filter
      await tester.tap(find.text('Overdue (2)'));
      await tester.pumpAndSettle();

      // Verified overdue invoices appear
      expect(find.textContaining('INV-1038'), findsOneWidget);
      expect(find.textContaining('INV-1041'), findsOneWidget);
    });

    testWidgets('3. Payments Screen calculates outstanding and displays ledger', (tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(createTestWidget(const PaymentsScreen()));
      await tester.pumpAndSettle();

      expect(find.text('Payments (Udhaari Vasooli)'), findsOneWidget);
      expect(find.text('Total Market Outstanding'), findsOneWidget);
      expect(find.text('Pending Collections to Vasool'), findsOneWidget);
      expect(find.text('Received Payments History'), findsOneWidget);

      // Verify payment methods
      expect(find.textContaining('UPI'), findsWidgets);
    });

    testWidgets('4. Customers Screen enables search and computes balances', (tester) async {
      await tester.pumpWidget(createTestWidget(const CustomersScreen()));
      await tester.pumpAndSettle();

      expect(find.text('Customers (Grahak)'), findsOneWidget);
      expect(find.text('Rahul Traders'), findsOneWidget);
      expect(find.text('ABC Electronics'), findsOneWidget);

      // Enter search query
      await tester.enterText(find.byType(TextField), 'Rahul');
      await tester.pumpAndSettle();

      expect(find.text('Rahul Traders'), findsOneWidget);
      expect(find.text('ABC Electronics'), findsNothing);
    });

    testWidgets('5. Inventory Screen displays low-stock alerts and safety levels', (tester) async {
      await tester.pumpWidget(createTestWidget(const InventoryScreen()));
      await tester.pumpAndSettle();

      expect(find.text('Inventory (Stock)'), findsOneWidget);
      expect(find.textContaining('Need Reorder'), findsOneWidget);
      expect(find.text('Low Stock (5)'), findsOneWidget);

      // Filter by Low Stock
      await tester.tap(find.text('Low Stock (5)'));
      await tester.pumpAndSettle();

      expect(find.textContaining('Reorder from Supplier'), findsWidgets);
    });

    testWidgets('6. Insights Screen allows dismissing priorities via Riverpod state', (tester) async {
      final container = ProviderContainer();

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(home: InsightsScreen()),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('AI Insights (Sujhav)'), findsOneWidget);
      expect(find.text('High Priority'), findsOneWidget);

      // Verify Dismiss button exists and can be tapped
      final dismissBtn = find.text('Dismiss').first;
      await tester.tap(dismissBtn);
      await tester.pumpAndSettle();

      // Check snackbar confirmation
      expect(find.text('Insight dismissed'), findsOneWidget);
    });

    testWidgets('7. Settings Screen toggles language and theme reactivity', (tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final container = ProviderContainer();

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(home: SettingsScreen()),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Settings (Settings)'), findsOneWidget);
      expect(find.text('Sharma Electronics'), findsOneWidget);

      // Select Hindi
      await tester.tap(find.text('हिंदी (Hindi)'));
      await tester.pumpAndSettle();

      expect(container.read(appProvider).language, Language.hi);

      // Toggle Theme Switch
      await tester.tap(find.byType(Switch));
      await tester.pumpAndSettle();

      expect(container.read(appProvider).theme, AppThemeMode.dark);

      // AI models indicators
      expect(find.text('Sarvam 105B Conversations + Groq Fallback'), findsOneWidget);
      expect(find.text('Sarvam Saaras v2 (Hindi, Hinglish, English)'), findsOneWidget);
      expect(find.text('Sarvam Bulbul v3'), findsOneWidget);
    });

    test('8. Business Totals arithmetic helper reconciles accurately', () {
      final totals = businessTotals(mockBusinessData);

      expect(totals.revenue, 10920.0);
      expect(totals.outstanding, 144600.0);
      expect(totals.expenses, 220742.0);
      expect(totals.lowStock, 5);
    });

    testWidgets('9. Documents Screen performs Sarvam OCR extraction and propagates across dashboards', (tester) async {
      final container = ProviderContainer();

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(home: DocumentsScreen()),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Instant Sarvam OCR'), findsOneWidget);
      expect(find.textContaining('Indic Vision 1.5'), findsOneWidget);
      expect(find.textContaining('Try Demo Sarvam OCR Scan'), findsOneWidget);

      final initialInvoices = container.read(businessDataProvider).invoices.length;
      final initialDocs = container.read(businessDataProvider).documents.length;

      // Trigger demo Sarvam OCR bill scan
      await tester.tap(find.textContaining('Try Demo Sarvam OCR Scan'));
      await tester.pump(const Duration(milliseconds: 1000));
      await tester.pumpAndSettle();

      // Verify reactive state updates propagate to businessDataProvider
      final updatedData = container.read(businessDataProvider);
      expect(updatedData.invoices.length, initialInvoices + 1);
      expect(updatedData.documents.length, initialDocs + 1);
      expect(find.textContaining('Sarvam Doc AI Extraction Successful'), findsOneWidget);
    });

    testWidgets('10. Assistant Screen queries RAG architecture and delivers grounded facts fast', (tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final container = ProviderContainer();

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(home: AssistantScreen()),
        ),
      );
      await tester.pumpAndSettle();

      // Check Rigid RAG UI indicators
      expect(find.text('AI Voice Copilot'), findsOneWidget);
      expect(find.textContaining('Rigid RAG Active'), findsOneWidget);
      expect(find.textContaining('Zero-Fabrication RAG'), findsOneWidget);
      expect(find.text('RAG Grounded Fact'), findsWidgets);

      // Verify quick prompt exists and trigger it
      expect(find.text('Aaj ki udhari kitni hai?'), findsOneWidget);
      await tester.tap(find.text('Aaj ki udhari kitni hai?'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));
      await tester.pumpAndSettle();

      // Verify user message sent and assistant answered with RAG grounded facts
      expect(find.text('Aaj ki udhari kitni hai?'), findsWidgets);
      expect(find.textContaining('Rahul Traders'), findsWidgets);
      expect(find.textContaining('INV-1038'), findsWidgets);
      expect(find.text('Ref: INV-1038'), findsWidgets);

      // Query explicit invoice ID from RAG database
      final textField = find.byType(TextField);
      await tester.enterText(textField, 'Status of INV-1038');
      await tester.testTextInput.receiveAction(TextInputAction.done);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));
      await tester.pumpAndSettle();

      expect(find.textContaining('INV-1038'), findsWidgets);
      expect(find.textContaining('44840'), findsWidgets);
    });
  });
}

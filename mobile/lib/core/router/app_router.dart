import 'package:go_router/go_router.dart';
import '../../features/overview/presentation/screens/overview_screen.dart';
import '../../features/invoices/presentation/screens/invoices_screen.dart';
import '../../features/payments/presentation/screens/payments_screen.dart';
import '../../features/customers/presentation/screens/customers_screen.dart';
import '../../features/vendors/presentation/screens/vendors_screen.dart';
import '../../features/inventory/presentation/screens/inventory_screen.dart';
import '../../features/expenses/presentation/screens/expenses_screen.dart';
import '../../features/documents/presentation/screens/documents_screen.dart';
import '../../features/insights/presentation/screens/insights_screen.dart';
import '../../features/assistant/presentation/screens/assistant_screen.dart';
import '../../features/settings/presentation/screens/settings_screen.dart';
import '../presentation/shell_screen.dart';

final appRouter = GoRouter(
  initialLocation: '/',
  routes: [
    ShellRoute(
      builder: (context, state, child) => ShellScreen(child: child),
      routes: [
        GoRoute(path: '/', builder: (_, __) => const OverviewScreen()),
        GoRoute(path: '/invoices', builder: (_, __) => const InvoicesScreen()),
        GoRoute(path: '/payments', builder: (_, __) => const PaymentsScreen()),
        GoRoute(path: '/customers', builder: (_, __) => const CustomersScreen()),
        GoRoute(path: '/vendors', builder: (_, __) => const VendorsScreen()),
        GoRoute(path: '/inventory', builder: (_, __) => const InventoryScreen()),
        GoRoute(path: '/expenses', builder: (_, __) => const ExpensesScreen()),
        GoRoute(path: '/documents', builder: (_, __) => const DocumentsScreen()),
        GoRoute(path: '/insights', builder: (_, __) => const InsightsScreen()),
        GoRoute(path: '/assistant', builder: (_, __) => const AssistantScreen()),
        GoRoute(path: '/settings', builder: (_, __) => const SettingsScreen()),
      ],
    ),
  ],
);

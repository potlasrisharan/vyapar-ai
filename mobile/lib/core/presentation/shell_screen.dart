// lib/core/presentation/shell_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../constants/app_strings.dart';
import '../constants/app_sizes.dart';
import '../constants/app_colors.dart';

class ShellScreen extends ConsumerWidget {
  const ShellScreen({super.key, required this.child});

  final Widget child;

  static const _navItems = [
    (icon: Icons.home_outlined, activeIcon: Icons.home, label: AppStrings.navOverview, path: '/'),
    (icon: Icons.receipt_long_outlined, activeIcon: Icons.receipt_long, label: AppStrings.navInvoices, path: '/invoices'),
    (icon: Icons.payments_outlined, activeIcon: Icons.payments, label: AppStrings.navPayments, path: '/payments'),
    (icon: Icons.people_outline, activeIcon: Icons.people, label: AppStrings.navCustomers, path: '/customers'),
    (icon: Icons.lightbulb_outline, activeIcon: Icons.lightbulb, label: AppStrings.navInsights, path: '/insights'),
    (icon: Icons.chat_bubble_outline, activeIcon: Icons.chat_bubble, label: AppStrings.navAssistant, path: '/assistant'),
  ];

  // Routes accessible via drawer (not bottom nav due to space)
  static const _drawerRoutes = [
    (icon: Icons.storefront_outlined, label: AppStrings.navVendors, path: '/vendors'),
    (icon: Icons.inventory_2_outlined, label: AppStrings.navInventory, path: '/inventory'),
    (icon: Icons.account_balance_wallet_outlined, label: AppStrings.navExpenses, path: '/expenses'),
    (icon: Icons.folder_outlined, label: AppStrings.navDocuments, path: '/documents'),
    (icon: Icons.settings_outlined, label: AppStrings.navSettings, path: '/settings'),
  ];

  int _selectedIndex(String location) {
    for (var i = _navItems.length - 1; i >= 0; i--) {
      if (location.startsWith(_navItems[i].path)) return i;
    }
    return 0;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final location = GoRouterState.of(context).uri.toString();
    final selectedIndex = _selectedIndex(location);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(
            top: BorderSide(
              color: isDark ? AppColors.borderDark : AppColors.borderLight,
              width: 1,
            ),
          ),
        ),
        child: NavigationBar(
          height: AppSizes.bottomNavHeight,
          selectedIndex: selectedIndex,
          onDestinationSelected: (i) => context.go(_navItems[i].path),
          destinations: _navItems.map((item) {
            final isAssistant = item.path == '/assistant';
            return NavigationDestination(
              icon: Badge(
                isLabelVisible: isAssistant,
                backgroundColor: AppColors.primary,
                smallSize: 6,
                child: Icon(item.icon, size: AppSizes.iconMd),
              ),
              selectedIcon: Badge(
                isLabelVisible: isAssistant,
                backgroundColor: AppColors.primary,
                smallSize: 6,
                child: Icon(item.activeIcon, size: AppSizes.iconMd),
              ),
              label: item.label,
            );
          }).toList(),
        ),
      ),
      drawer: const _AppDrawer(drawerRoutes: _drawerRoutes),
    );
  }
}

class _AppDrawer extends StatelessWidget {
  const _AppDrawer({required this.drawerRoutes});

  final List<({IconData icon, String label, String path})> drawerRoutes;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final drawerBg = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;

    return Drawer(
      backgroundColor: drawerBg,
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.all(AppSizes.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: AppSizes.iconXl,
                    height: AppSizes.iconXl,
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(AppSizes.radiusSm),
                    ),
                    child: const Icon(Icons.store, color: Colors.white, size: AppSizes.iconLg),
                  ),
                  const SizedBox(height: AppSizes.sm),
                  Text(AppStrings.appName, style: Theme.of(context).textTheme.titleLarge),
                  Text(AppStrings.tagline, style: Theme.of(context).textTheme.bodyMedium),
                ],
              ),
            ),
            const Divider(),
            ...drawerRoutes.map((route) => ListTile(
              leading: Icon(route.icon, size: AppSizes.iconMd, color: AppColors.primary),
              title: Text(route.label, style: Theme.of(context).textTheme.bodyLarge),
              onTap: () {
                Navigator.pop(context);
                context.go(route.path);
              },
            )),
          ],
        ),
      ),
    );
  }
}

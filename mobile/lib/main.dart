// lib/main.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'core/di/providers.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  // AdMob init goes here in production:
  // await MobileAds.instance.initialize();
  runApp(const ProviderScope(child: VyaparAIApp()));
}

class VyaparAIApp extends ConsumerWidget {
  const VyaparAIApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(appProvider.select((s) => s.theme));

    return MaterialApp.router(
      title: 'VyaparAI',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: themeMode == AppThemeMode.dark ? ThemeMode.dark : ThemeMode.light,
      routerConfig: appRouter,
    );
  }
}

// lib/features/settings/presentation/screens/settings_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_sizes.dart';
import '../../../../core/constants/app_strings.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/domain/entities.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final language = ref.watch(appProvider.select((s) => s.language));
    final theme = ref.watch(appProvider.select((s) => s.theme));
    final business = ref.watch(businessDataProvider).business;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings (Settings)'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppSizes.md),
        children: [
          // Business Profile Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(AppSizes.md),
              child: Row(
                children: [
                  Container(
                    width: 52,
                    height: 52,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(AppSizes.radiusSm),
                    ),
                    child: const Icon(Icons.store, color: AppColors.primary, size: 28),
                  ),
                  const SizedBox(width: AppSizes.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          business.name,
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                        Text(
                          'Owner: ${business.owner} · ${business.city}, ${business.state}',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: AppColors.textSecondary,
                              ),
                        ),
                        if (business.gstin != null)
                          Text(
                            'GSTIN: ${business.gstin}',
                            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w600,
                                ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: AppSizes.lg),

          // Language Selection
          Text('Language / भाषा', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: AppSizes.sm),
          Card(
            child: Column(
              children: [
                ListTile(
                  title: const Text('Hinglish (Hindi in English Script)'),
                  subtitle: const Text('Default for Indian Retailers'),
                  trailing: language == Language.hinglish ? const Icon(Icons.check_circle, color: AppColors.primary) : null,
                  onTap: () => ref.read(appProvider.notifier).setLanguage(Language.hinglish),
                ),
                const Divider(),
                ListTile(
                  title: const Text('हिंदी (Hindi)'),
                  subtitle: const Text('पूर्ण हिंदी इंटरफेस'),
                  trailing: language == Language.hi ? const Icon(Icons.check_circle, color: AppColors.primary) : null,
                  onTap: () => ref.read(appProvider.notifier).setLanguage(Language.hi),
                ),
                const Divider(),
                ListTile(
                  title: const Text('English'),
                  subtitle: const Text('Standard English'),
                  trailing: language == Language.en ? const Icon(Icons.check_circle, color: AppColors.primary) : null,
                  onTap: () => ref.read(appProvider.notifier).setLanguage(Language.en),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSizes.lg),

          // Appearance
          Text('Appearance', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: AppSizes.sm),
          Card(
            child: SwitchListTile(
              title: const Text('Dark Mode'),
              subtitle: Text(theme == AppThemeMode.dark ? 'Active' : 'Disabled (Light theme active)'),
              value: theme == AppThemeMode.dark,
              onChanged: (_) => ref.read(appProvider.notifier).toggleTheme(),
            ),
          ),
          const SizedBox(height: AppSizes.lg),

          // AI Engine Status
          Text('AI Engine & Models', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: AppSizes.sm),
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.bolt, color: AppColors.success),
                  title: const Text('Chat & Copilot'),
                  subtitle: const Text('Sarvam 105B Conversations + Groq Fallback'),
                  trailing: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.success.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text('LIVE', style: TextStyle(color: AppColors.success, fontSize: 11, fontWeight: FontWeight.w700)),
                  ),
                ),
                const Divider(),
                ListTile(
                  leading: const Icon(Icons.mic, color: AppColors.success),
                  title: const Text('Voice STT'),
                  subtitle: const Text('Sarvam Saaras v2 (Hindi, Hinglish, English)'),
                  trailing: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.success.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text('LIVE', style: TextStyle(color: AppColors.success, fontSize: 11, fontWeight: FontWeight.w700)),
                  ),
                ),
                const Divider(),
                ListTile(
                  leading: const Icon(Icons.volume_up, color: AppColors.success),
                  title: const Text('Voice TTS'),
                  subtitle: const Text('Sarvam Bulbul v3'),
                  trailing: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.success.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text('LIVE', style: TextStyle(color: AppColors.success, fontSize: 11, fontWeight: FontWeight.w700)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSizes.lg),

          // About
          const Center(
            child: Text(
              '${AppStrings.appName} v1.0.0 (Build 1)\nDesigned for Indian MSMEs & Retailers 🇮🇳',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.textSecondary, fontSize: AppSizes.textXs),
            ),
          ),
        ],
      ),
    );
  }
}

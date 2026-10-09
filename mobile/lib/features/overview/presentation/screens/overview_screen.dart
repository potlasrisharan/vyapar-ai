// lib/features/overview/presentation/screens/overview_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_sizes.dart';
import '../../../../core/constants/app_strings.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/domain/entities.dart';
import '../../../../core/services/mock_data.dart';
import '../../../../core/utils/format.dart';

class OverviewScreen extends ConsumerWidget {
  const OverviewScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final data = ref.watch(businessDataProvider);
    final language = ref.watch(appProvider.select((s) => s.language));
    final priorities = ref.watch(openInsightsProvider).take(3).toList();
    final totals = businessTotals(data);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final cardBg = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    final cardBorder = isDark ? AppColors.borderDark : AppColors.borderLight;
    final textMain = isDark ? AppColors.textDark : AppColors.textLight;
    final textSub = isDark ? AppColors.textSecondary : const Color(0xFF64748B);

    final briefingTitle = switch (language) {
      Language.hi =>
        'बाज़ार में ₹${formatMoney(totals.outstanding, compact: true)} उधारी बाकी है और ${totals.lowStock} सामान का स्टॉक कम है',
      Language.hinglish =>
        'Market me ₹${formatMoney(totals.outstanding, compact: true)} udhari baaki hai aur ${totals.lowStock} items low stock hain',
      Language.en =>
        '₹${formatMoney(totals.outstanding, compact: true)} market balance pending; ${totals.lowStock} products need reorder',
    };

    final briefingDesc = switch (language) {
      Language.hi => 'समय पर तगादा भेजकर उधारी वसूल करें और ज़रूरत का सामान तुरंत मंगवाएं।',
      Language.hinglish => 'Samay par reminder bhejkar udhari vasool karein aur zaroori samaan mangwayein.',
      Language.en => 'Send payment reminders to collect pending balance faster and maintain stock.',
    };

    final badgeLabel = switch (language) {
      Language.hi => 'दुकान की आज की स्थिति',
      Language.hinglish => 'Dukaan Ki Aaj Ki Sthiti',
      Language.en => 'DAILY SHOP BRIEFING',
    };

    final reminderBtnText = switch (language) {
      Language.hi => 'उधारी तगादा भेजें',
      Language.hinglish => 'Udhari Reminder Bhejein',
      Language.en => 'Send Due Reminder',
    };

    return Scaffold(
      backgroundColor: isDark ? AppColors.bgDark : AppColors.bgLight,
      appBar: AppBar(
        backgroundColor: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.wb_sunny_outlined, size: 13, color: AppColors.primary),
                const SizedBox(width: 4),
                Text(
                  'DEMO · 5 OCT 2026',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.8,
                        color: AppColors.primary,
                      ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.mintBg,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text(
                    '✦ Sarvam 105B Indic AI',
                    style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 2),
            Text(
              'Namaste, ${data.business.name}',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                    fontSize: 18,
                    color: textMain,
                  ),
            ),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 12),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: isDark ? AppColors.surfaceDark2 : const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: cardBorder),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.calendar_today_outlined, size: 12, color: AppColors.textSecondary),
                const SizedBox(width: 4),
                Text(
                  '${data.business.city} · ${data.business.reportingMonth}',
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
                ),
              ],
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.read(businessDataProvider.notifier).reset();
        },
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: AppSizes.md, vertical: AppSizes.sm),
          children: [
            // Daily Shopkeeper Briefing Card
            Container(
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(AppSizes.radiusLg),
                border: Border.all(color: cardBorder),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              padding: const EdgeInsets.all(AppSizes.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: AppColors.actionEmerald,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        badgeLabel,
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.6,
                          color: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSizes.sm),
                  Text(
                    briefingTitle,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      height: 1.3,
                      color: textMain,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    briefingDesc,
                    style: TextStyle(
                      fontSize: 13,
                      color: textSub,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: AppSizes.md),
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      minimumSize: const Size.fromHeight(42),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(AppSizes.radiusMd),
                      ),
                    ),
                    onPressed: () => context.go('/payments'),
                    icon: const Icon(Icons.check_circle_outline, size: 16),
                    label: Text(
                      reminderBtnText,
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSizes.md),

            // 4 Colored Left-Border Quick Action Cards (Emerald, Blue, Amber, Purple)
            Row(
              children: [
                Expanded(
                  child: _QuickActionButton(
                    icon: Icons.receipt_long,
                    label: AppStrings.createInvoice,
                    subLabel: language == Language.hi
                        ? 'नया बिल 10s में'
                        : language == Language.hinglish
                            ? 'Naya bill turant'
                            : 'New bill in 10s',
                    borderColor: AppColors.actionEmerald,
                    iconBg: const Color(0xFFD1FAE5),
                    iconColor: const Color(0xFF047857),
                    cardBg: cardBg,
                    borderLight: cardBorder,
                    onTap: () => context.go('/invoices'),
                  ),
                ),
                const SizedBox(width: AppSizes.sm),
                Expanded(
                  child: _QuickActionButton(
                    icon: Icons.currency_rupee,
                    label: AppStrings.recordPayment,
                    subLabel: language == Language.hi
                        ? 'पैसा आने पर एंट्री'
                        : language == Language.hinglish
                            ? 'Payment entry'
                            : 'Record received',
                    borderColor: AppColors.actionBlue,
                    iconBg: const Color(0xFFDBEAFE),
                    iconColor: const Color(0xFF1D4ED8),
                    cardBg: cardBg,
                    borderLight: cardBorder,
                    onTap: () => context.go('/payments'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSizes.sm),
            Row(
              children: [
                Expanded(
                  child: _QuickActionButton(
                    icon: Icons.document_scanner,
                    label: AppStrings.uploadDocument,
                    subLabel: language == Language.hi
                        ? 'बिल या फोटो स्कैन'
                        : language == Language.hinglish
                            ? 'Scan bill / PDF'
                            : 'Scan paper bill',
                    borderColor: AppColors.actionAmber,
                    iconBg: const Color(0xFFFEF3C7),
                    iconColor: const Color(0xFFB45309),
                    cardBg: cardBg,
                    borderLight: cardBorder,
                    onTap: () => context.go('/documents'),
                  ),
                ),
                const SizedBox(width: AppSizes.sm),
                Expanded(
                  child: _QuickActionButton(
                    icon: Icons.chat_bubble_outline,
                    label: AppStrings.askCopilot,
                    subLabel: language == Language.hi
                        ? 'बोलकर या लिखकर'
                        : language == Language.hinglish
                            ? 'Voice & text AI'
                            : 'Ask voice / text',
                    borderColor: AppColors.actionPurple,
                    iconBg: const Color(0xFFEDE9FE),
                    iconColor: const Color(0xFF6D28D9),
                    cardBg: cardBg,
                    borderLight: cardBorder,
                    onTap: () => context.go('/assistant'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSizes.lg),

            // "What should I do today?" Section
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(5),
                      decoration: BoxDecoration(
                        color: AppColors.mintBg,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Icon(Icons.check_circle_outline, size: 16, color: AppColors.primary),
                    ),
                    const SizedBox(width: 8),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'What should I do today?',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: textMain,
                          ),
                        ),
                        Text(
                          'High-priority actions generated by AI',
                          style: TextStyle(
                            fontSize: 11,
                            color: textSub,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                TextButton(
                  onPressed: () => context.go('/insights'),
                  style: TextButton.styleFrom(
                    padding: EdgeInsets.zero,
                    visualDensity: VisualDensity.compact,
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'View insights',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppColors.primary,
                        ),
                      ),
                      Icon(Icons.chevron_right, size: 14, color: AppColors.primary),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSizes.sm),

            // Priority Action Cards (01, 02, 03)
            if (priorities.isEmpty)
              Container(
                padding: const EdgeInsets.all(AppSizes.md),
                decoration: BoxDecoration(
                  color: cardBg,
                  borderRadius: BorderRadius.circular(AppSizes.radiusMd),
                  border: Border.all(color: cardBorder),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle, color: AppColors.actionEmerald, size: 20),
                    const SizedBox(width: AppSizes.sm),
                    Text(
                      'All caught up! No open priorities right now.',
                      style: TextStyle(fontSize: 13, color: textMain),
                    ),
                  ],
                ),
              )
            else
              ...priorities.asMap().entries.map((entry) {
                final idx = entry.key + 1;
                final insight = entry.value;
                final isUrgent = insight.priority == InsightPriority.high;

                final badgeBg = isUrgent ? const Color(0xFFFEF2F2) : const Color(0xFFFEF3C7);
                final badgeText = isUrgent ? const Color(0xFFB91C1C) : const Color(0xFF92400E);
                final badgeLabel = isUrgent ? '● High priority' : '● Needs attention';

                final actionLabel = switch (insight.action) {
                  InsightAction.followup => 'Create follow-up ->',
                  InsightAction.purchase => 'Create purchase reminder ->',
                  InsightAction.review => 'Review expenses ->',
                  InsightAction.upload => 'Upload document ->',
                };

                return Container(
                  margin: const EdgeInsets.only(bottom: AppSizes.sm),
                  decoration: BoxDecoration(
                    color: cardBg,
                    borderRadius: BorderRadius.circular(AppSizes.radiusMd),
                    border: Border.all(color: cardBorder),
                  ),
                  padding: const EdgeInsets.all(AppSizes.md),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Text(
                                '0$idx',
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                decoration: BoxDecoration(
                                  color: badgeBg,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  badgeLabel,
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: badgeText,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          InkWell(
                            onTap: () => context.go('/insights'),
                            child: const Row(
                              children: [
                                Text(
                                  'View evidence',
                                  style: TextStyle(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.w600),
                                ),
                                SizedBox(width: 2),
                                Icon(Icons.north_east, size: 10, color: AppColors.primary),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        insight.title.get(language),
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: textMain,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        insight.summary.get(language),
                        style: TextStyle(
                          fontSize: 12,
                          color: textSub,
                          height: 1.3,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: isUrgent
                            ? ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.primary,
                                  foregroundColor: Colors.white,
                                  elevation: 0,
                                  minimumSize: const Size(0, 32),
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(AppSizes.radiusSm),
                                  ),
                                ),
                                onPressed: () => context.go('/payments'),
                                child: Text(
                                  actionLabel,
                                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                                ),
                              )
                            : OutlinedButton(
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: AppColors.primary,
                                  side: const BorderSide(color: AppColors.borderLight, width: 1.2),
                                  minimumSize: const Size(0, 32),
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(AppSizes.radiusSm),
                                  ),
                                ),
                                onPressed: () {
                                  if (insight.action == InsightAction.purchase) {
                                    context.go('/inventory');
                                  } else if (insight.action == InsightAction.review) {
                                    context.go('/expenses');
                                  } else {
                                    context.go('/insights');
                                  }
                                },
                                child: Text(
                                  actionLabel,
                                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                                ),
                              ),
                      ),
                    ],
                  ),
                );
              }),
            const SizedBox(height: AppSizes.md),

            // Performance Metrics Strip
            Text(
              'Performance Summary',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: textMain,
              ),
            ),
            const SizedBox(height: AppSizes.sm),
            SizedBox(
              height: 96,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  _MetricCard(
                    label: 'Revenue',
                    value: '₹${formatMoney(totals.revenue, compact: true)}',
                    detail: '+12.4% vs last mo',
                    color: AppColors.actionEmerald,
                    icon: Icons.trending_up,
                    cardBg: cardBg,
                    cardBorder: cardBorder,
                  ),
                  _MetricCard(
                    label: 'Outstanding',
                    value: '₹${formatMoney(totals.outstanding, compact: true)}',
                    detail: 'Awaiting payment',
                    color: AppColors.actionAmber,
                    icon: Icons.account_balance_wallet_outlined,
                    cardBg: cardBg,
                    cardBorder: cardBorder,
                  ),
                  _MetricCard(
                    label: 'Expenses',
                    value: '₹${formatMoney(totals.expenses, compact: true)}',
                    detail: 'Billed this month',
                    color: const Color(0xFFEF4444),
                    icon: Icons.receipt_outlined,
                    cardBg: cardBg,
                    cardBorder: cardBorder,
                  ),
                  _MetricCard(
                    label: 'Low Stock',
                    value: '${totals.lowStock} products',
                    detail: 'Needs attention',
                    color: const Color(0xFFF97316),
                    icon: Icons.inventory_2_outlined,
                    cardBg: cardBg,
                    cardBorder: cardBorder,
                  ),
                  _MetricCard(
                    label: 'Overdue Invoices',
                    value: '${data.invoices.where((i) => i.status == InvoiceStatus.overdue).length} bills',
                    detail: 'High priority',
                    color: const Color(0xFFEF4444),
                    icon: Icons.warning_amber_rounded,
                    cardBg: cardBg,
                    cardBorder: cardBorder,
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSizes.md),

            // Ask Copilot Banner Strip
            InkWell(
              onTap: () => context.go('/assistant'),
              borderRadius: BorderRadius.circular(AppSizes.radiusMd),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: AppSizes.md, vertical: 12),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.surfaceDark : AppColors.mintBg,
                  borderRadius: BorderRadius.circular(AppSizes.radiusMd),
                  border: Border.all(color: const Color(0xFFB4E3DC)),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(7),
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.chat_bubble_outline, color: Colors.white, size: 16),
                    ),
                    const SizedBox(width: AppSizes.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            '✦ Ask Copilot',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: AppColors.primary,
                            ),
                          ),
                          Text(
                            'Ask questions in Hindi, Hinglish, Tamil, Telugu, or English',
                            style: TextStyle(
                              fontSize: 11,
                              color: isDark ? AppColors.textSecondary : const Color(0xFF0F5B51),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.north_east, size: 16, color: AppColors.primary),
                  ],
                ),
              ),
            ),
            const SizedBox(height: AppSizes.md),
          ],
        ),
      ),
    );
  }
}

class _QuickActionButton extends StatelessWidget {
  const _QuickActionButton({
    required this.icon,
    required this.label,
    required this.subLabel,
    required this.borderColor,
    required this.iconBg,
    required this.iconColor,
    required this.cardBg,
    required this.borderLight,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final String subLabel;
  final Color borderColor;
  final Color iconBg;
  final Color iconColor;
  final Color cardBg;
  final Color borderLight;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textMain = isDark ? AppColors.textDark : AppColors.textLight;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppSizes.radiusMd),
        child: Container(
          height: 74,
          clipBehavior: Clip.antiAlias,
          decoration: BoxDecoration(
            color: cardBg,
            borderRadius: BorderRadius.circular(AppSizes.radiusMd),
            border: Border.all(color: borderLight),
          ),
          child: Row(
            children: [
              Container(
                width: 4,
                color: borderColor,
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  child: Row(
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: isDark ? borderColor.withValues(alpha: 0.2) : iconBg,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(icon, color: isDark ? borderColor : iconColor, size: 20),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              label,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: textMain,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              subLabel,
                              style: const TextStyle(
                                fontSize: 10,
                                color: AppColors.textSecondary,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.label,
    required this.value,
    required this.detail,
    required this.color,
    required this.icon,
    required this.cardBg,
    required this.cardBorder,
  });

  final String label;
  final String value;
  final String detail;
  final Color color;
  final IconData icon;
  final Color cardBg;
  final Color cardBorder;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textMain = isDark ? AppColors.textDark : AppColors.textLight;

    return Container(
      width: 140,
      margin: const EdgeInsets.only(right: AppSizes.sm),
      padding: const EdgeInsets.all(AppSizes.sm + 2),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(AppSizes.radiusMd),
        border: Border.all(color: cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  label,
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Icon(icon, size: 14, color: color),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: textMain,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 2),
          Text(
            detail,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w500,
              color: color,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}


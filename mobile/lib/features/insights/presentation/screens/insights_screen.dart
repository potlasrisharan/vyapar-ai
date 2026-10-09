// lib/features/insights/presentation/screens/insights_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_sizes.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/domain/entities.dart';
import '../../../../core/utils/format.dart';

class InsightsScreen extends ConsumerStatefulWidget {
  const InsightsScreen({super.key});

  @override
  ConsumerState<InsightsScreen> createState() => _InsightsScreenState();
}

class _InsightsScreenState extends ConsumerState<InsightsScreen> {
  InsightPriority? _priorityFilter;

  @override
  Widget build(BuildContext context) {
    final data = ref.watch(businessDataProvider);
    final language = ref.watch(appProvider.select((s) => s.language));
    final statuses = ref.watch(appProvider.select((s) => s.insightStatuses));

    final openInsights = data.insights.where((i) {
      final status = statuses[i.id] ?? InsightStatus.open;
      if (status != InsightStatus.open) return false;
      if (_priorityFilter != null && i.priority != _priorityFilter) return false;
      return true;
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Insights (Sujhav)'),
      ),
      body: Column(
        children: [
          // Filter Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: AppSizes.md, vertical: AppSizes.sm),
            child: Row(
              children: [
                ChoiceChip(
                  label: const Text('All Priorities'),
                  selected: _priorityFilter == null,
                  onSelected: (_) => setState(() => _priorityFilter = null),
                ),
                const SizedBox(width: AppSizes.sm),
                ChoiceChip(
                  label: const Text('High Priority'),
                  selected: _priorityFilter == InsightPriority.high,
                  selectedColor: AppColors.error.withValues(alpha: 0.2),
                  onSelected: (_) => setState(() => _priorityFilter = InsightPriority.high),
                ),
                const SizedBox(width: AppSizes.sm),
                ChoiceChip(
                  label: const Text('Medium Priority'),
                  selected: _priorityFilter == InsightPriority.medium,
                  selectedColor: AppColors.warning.withValues(alpha: 0.2),
                  onSelected: (_) => setState(() => _priorityFilter = InsightPriority.medium),
                ),
              ],
            ),
          ),
          const Divider(),

          Expanded(
            child: openInsights.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.check_circle_outline, size: 56, color: AppColors.success),
                        const SizedBox(height: AppSizes.md),
                        Text(
                          'No active priorities!',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                        const Text(
                          'All recommendations have been acted on.',
                          style: TextStyle(color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.all(AppSizes.md),
                    itemCount: openInsights.length,
                    separatorBuilder: (_, __) => const SizedBox(height: AppSizes.md),
                    itemBuilder: (context, index) {
                      final insight = openInsights[index];

                      final priorityColor = switch (insight.priority) {
                        InsightPriority.high => AppColors.error,
                        InsightPriority.medium => AppColors.warning,
                        InsightPriority.low => AppColors.info,
                      };

                      return Card(
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(AppSizes.radiusMd),
                          side: BorderSide(color: priorityColor.withValues(alpha: 0.5), width: 1.2),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(AppSizes.md),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: priorityColor.withValues(alpha: 0.15),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      '${insight.priority.name.toUpperCase()} PRIORITY',
                                      style: TextStyle(
                                        color: priorityColor,
                                        fontSize: AppSizes.textXs,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ),
                                  const Spacer(),
                                  if (insight.impactAmount != null)
                                    Text(
                                      'Impact: ${formatMoney(insight.impactAmount!)}',
                                      style: TextStyle(
                                        color: priorityColor,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                ],
                              ),
                              const SizedBox(height: AppSizes.sm),
                              Text(
                                insight.title.get(language),
                                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                      fontWeight: FontWeight.w700,
                                    ),
                              ),
                              const SizedBox(height: AppSizes.xs),
                              Text(
                                insight.summary.get(language),
                                style: Theme.of(context).textTheme.bodyMedium,
                              ),
                              const SizedBox(height: AppSizes.sm),
                              Container(
                                padding: const EdgeInsets.all(AppSizes.sm),
                                decoration: BoxDecoration(
                                  color: AppColors.surfaceDark2,
                                  borderRadius: BorderRadius.circular(AppSizes.radiusSm),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(Icons.lightbulb_outline, size: 18, color: AppColors.primary),
                                    const SizedBox(width: AppSizes.sm),
                                    Expanded(
                                      child: Text(
                                        insight.recommendation.get(language),
                                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                              color: AppColors.primary,
                                              fontWeight: FontWeight.w600,
                                            ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: AppSizes.md),
                              Row(
                                children: [
                                  Expanded(
                                    child: ElevatedButton(
                                      onPressed: () {
                                        switch (insight.action) {
                                          case InsightAction.followup:
                                            context.go('/payments');
                                            break;
                                          case InsightAction.purchase:
                                            context.go('/inventory');
                                            break;
                                          case InsightAction.review:
                                            context.go('/expenses');
                                            break;
                                          case InsightAction.upload:
                                            context.go('/documents');
                                            break;
                                        }
                                      },
                                      child: Text(switch (insight.action) {
                                        InsightAction.followup => 'Take Action (Remind)',
                                        InsightAction.purchase => 'Reorder Inventory',
                                        InsightAction.review => 'Review Expense',
                                        InsightAction.upload => 'Upload Document',
                                      }),
                                    ),
                                  ),
                                  const SizedBox(width: AppSizes.sm),
                                  OutlinedButton(
                                    onPressed: () {
                                      ref.read(appProvider.notifier).setInsightStatus(
                                            insight.id,
                                            InsightStatus.dismissed,
                                          );
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(content: Text('Insight dismissed')),
                                      );
                                    },
                                    child: const Text('Dismiss'),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

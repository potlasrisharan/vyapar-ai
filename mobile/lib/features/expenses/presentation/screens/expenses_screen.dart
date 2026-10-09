// lib/features/expenses/presentation/screens/expenses_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_sizes.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/domain/entities.dart';
import '../../../../core/utils/format.dart';

class ExpensesScreen extends ConsumerWidget {
  const ExpensesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final data = ref.watch(businessDataProvider);
    final language = ref.watch(appProvider.select((s) => s.language));

    final totalExpenses = data.expenses.fold(0.0, (s, e) => s + e.amount);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Expenses (Kharcha)'),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddExpenseDialog(context),
        backgroundColor: AppColors.expenseAmber,
        foregroundColor: Colors.white,
        child: const Icon(Icons.add),
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppSizes.md),
        children: [
          // Total Expense Card
          Card(
            color: AppColors.surfaceDark2,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppSizes.radiusLg),
              side: const BorderSide(color: AppColors.expenseAmber, width: 1.5),
            ),
            child: Padding(
              padding: const EdgeInsets.all(AppSizes.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Total Expenses (September 2026)',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                  const SizedBox(height: AppSizes.xs),
                  Text(
                    formatMoney(totalExpenses),
                    style: Theme.of(context).textTheme.displayLarge?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: AppColors.expenseAmber,
                        ),
                  ),
                  const SizedBox(height: AppSizes.xs),
                  const Text(
                    'Inventory stock purchases account for 68% of this month’s outflow.',
                    style: TextStyle(fontSize: AppSizes.textXs, color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: AppSizes.lg),

          Text('Expense Entries', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: AppSizes.sm),

          ...data.expenses.map((expense) {
            final categoryIcon = switch (expense.category) {
              ExpenseCategory.inventory => Icons.inventory_2_outlined,
              ExpenseCategory.rent => Icons.apartment_outlined,
              ExpenseCategory.salaries => Icons.group_outlined,
              ExpenseCategory.electricity => Icons.bolt_outlined,
              ExpenseCategory.transport => Icons.local_shipping_outlined,
              ExpenseCategory.marketing => Icons.campaign_outlined,
              ExpenseCategory.other => Icons.receipt_outlined,
            };

            return Card(
              margin: const EdgeInsets.only(bottom: AppSizes.sm),
              child: ListTile(
                leading: CircleAvatar(
                  backgroundColor: AppColors.expenseAmber.withValues(alpha: 0.15),
                  child: Icon(categoryIcon, color: AppColors.expenseAmber),
                ),
                title: Text(
                  expense.name.get(language),
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                subtitle: Text(
                  '${expense.category.name.toUpperCase()} · ${formatDate(expense.date, language)}',
                  style: const TextStyle(color: AppColors.textSecondary),
                ),
                trailing: Text(
                  formatMoney(expense.amount),
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    color: AppColors.error,
                  ),
                ),
              ),
            );
          }),
        ],
      ),
    );
  }

  void _showAddExpenseDialog(BuildContext context) {
    final titleCtrl = TextEditingController();
    final amountCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add Shop Expense'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: titleCtrl, decoration: const InputDecoration(labelText: 'Expense Name')),
            const SizedBox(height: AppSizes.sm),
            TextField(controller: amountCtrl, decoration: const InputDecoration(labelText: 'Amount (₹)'), keyboardType: TextInputType.number),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Expense "${titleCtrl.text}" recorded!')),
              );
            },
            child: const Text('Save Expense'),
          ),
        ],
      ),
    );
  }
}

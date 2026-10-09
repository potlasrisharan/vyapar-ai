// lib/features/payments/presentation/screens/payments_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_sizes.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/domain/entities.dart';
import '../../../../core/services/mock_data.dart';
import '../../../../core/utils/format.dart';

class PaymentsScreen extends ConsumerWidget {
  const PaymentsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final data = ref.watch(businessDataProvider);
    final language = ref.watch(appProvider.select((s) => s.language));
    final totals = businessTotals(data);

    final unpaidInvoices = data.invoices.where((i) => i.status != InvoiceStatus.paid).toList()
      ..sort((a, b) {
        if (a.status == InvoiceStatus.overdue && b.status != InvoiceStatus.overdue) return -1;
        if (a.status != InvoiceStatus.overdue && b.status == InvoiceStatus.overdue) return 1;
        return a.dueDate.compareTo(b.dueDate);
      });

    return Scaffold(
      appBar: AppBar(
        title: const Text('Payments (Udhaari Vasooli)'),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showRecordPaymentSheet(context, data),
        backgroundColor: AppColors.info,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('Record Payment'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppSizes.md),
        children: [
          // Outstanding Summary Card
          Card(
            color: AppColors.surfaceDark2,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppSizes.radiusLg),
              side: const BorderSide(color: AppColors.warning, width: 1.5),
            ),
            child: Padding(
              padding: const EdgeInsets.all(AppSizes.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Total Market Outstanding',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: AppColors.textSecondary,
                            ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.warning.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          '${unpaidInvoices.length} Bills Pending',
                          style: const TextStyle(
                            color: AppColors.warning,
                            fontSize: AppSizes.textXs,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSizes.xs),
                  Text(
                    formatMoney(totals.outstanding),
                    style: Theme.of(context).textTheme.displayLarge?.copyWith(
                          color: AppColors.warning,
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  const SizedBox(height: AppSizes.xs),
                  Text(
                    'Regular reminders speed up merchant payment cycles by 40%.',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: AppSizes.lg),

          // Pending Collections (Urgent Udhaari)
          Text(
            'Pending Collections to Vasool',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: AppSizes.sm),
          if (unpaidInvoices.isEmpty)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(AppSizes.md),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle, color: AppColors.success),
                    const SizedBox(width: AppSizes.sm),
                    Text(
                      'All customer bills are paid up!',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
            )
          else
            ...unpaidInvoices.map((inv) {
              final customer = data.customers.firstWhere(
                (c) => c.id == inv.customerId,
                orElse: () => Customer(
                  id: inv.customerId,
                  name: 'Customer',
                  contact: '',
                  phone: '',
                  city: '',
                ),
              );

              final isOverdue = inv.status == InvoiceStatus.overdue;

              return Card(
                margin: const EdgeInsets.only(bottom: AppSizes.sm),
                child: ListTile(
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: AppSizes.md,
                    vertical: AppSizes.xs,
                  ),
                  leading: CircleAvatar(
                    backgroundColor: (isOverdue ? AppColors.error : AppColors.warning).withValues(alpha: 0.15),
                    child: Icon(
                      Icons.person_outline,
                      color: isOverdue ? AppColors.error : AppColors.warning,
                    ),
                  ),
                  title: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(customer.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                      Text(
                        formatMoney(inv.total),
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          color: isOverdue ? AppColors.error : AppColors.warning,
                        ),
                      ),
                    ],
                  ),
                  subtitle: Text(
                    '${inv.id} · Due: ${formatDate(inv.dueDate, language)}',
                    style: const TextStyle(color: AppColors.textSecondary),
                  ),
                  trailing: IconButton(
                    icon: const Icon(Icons.send_outlined, color: AppColors.success),
                    tooltip: 'Send WhatsApp Reminder',
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('WhatsApp reminder sent to ${customer.name} for ${formatMoney(inv.total)}'),
                        ),
                      );
                    },
                  ),
                ),
              );
            }),
          const SizedBox(height: AppSizes.lg),

          // Payment History Ledger
          Text(
            'Received Payments History',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: AppSizes.sm),
          ...data.payments.map((p) {
            final customer = data.customers.firstWhere(
              (c) => c.id == p.customerId,
              orElse: () => Customer(
                id: p.customerId,
                name: 'Customer',
                contact: '',
                phone: '',
                city: '',
              ),
            );

            return Card(
              margin: const EdgeInsets.only(bottom: AppSizes.sm),
              child: ListTile(
                leading: Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: AppColors.success.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(AppSizes.radiusSm),
                  ),
                  child: const Icon(Icons.check_circle_outline, color: AppColors.success),
                ),
                title: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(customer.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                    Text(
                      '+ ${formatMoney(p.amount)}',
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        color: AppColors.success,
                      ),
                    ),
                  ],
                ),
                subtitle: Text(
                  '${formatDate(p.date, language)} · ${paymentMethodLabel(p.method)} (${p.referenceNumber ?? p.invoiceId})',
                  style: const TextStyle(color: AppColors.textSecondary),
                ),
              ),
            );
          }),
        ],
      ),
    );
  }

  void _showRecordPaymentSheet(BuildContext context, BusinessData data) {
    Invoice selectedInvoice = data.invoices.firstWhere(
      (i) => i.status != InvoiceStatus.paid,
      orElse: () => data.invoices.first,
    );
    PaymentMethod selectedMethod = PaymentMethod.upi;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surfaceDark,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppSizes.radiusLg)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            final customer = data.customers.firstWhere(
              (c) => c.id == selectedInvoice.customerId,
              orElse: () => const Customer(id: '', name: 'Customer', contact: '', phone: '', city: ''),
            );

            return Padding(
              padding: EdgeInsets.only(
                left: AppSizes.lg,
                right: AppSizes.lg,
                top: AppSizes.lg,
                bottom: MediaQuery.of(context).viewInsets.bottom + AppSizes.lg,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Record Payment (Paisa Aaya)',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  const SizedBox(height: AppSizes.md),
                  DropdownButtonFormField<Invoice>(
                    initialValue: selectedInvoice,
                    decoration: const InputDecoration(labelText: 'Select Invoice / Customer'),
                    items: data.invoices
                        .map((inv) => DropdownMenuItem(
                              value: inv,
                              child: Text('${inv.id} - ₹${inv.total.toInt()}'),
                            ))
                        .toList(),
                    onChanged: (val) {
                      if (val != null) setSheetState(() => selectedInvoice = val);
                    },
                  ),
                  const SizedBox(height: AppSizes.md),
                  Text('Customer: ${customer.name}', style: Theme.of(context).textTheme.bodyMedium),
                  const SizedBox(height: AppSizes.md),
                  DropdownButtonFormField<PaymentMethod>(
                    initialValue: selectedMethod,
                    decoration: const InputDecoration(labelText: 'Payment Method'),
                    items: PaymentMethod.values
                        .map((m) => DropdownMenuItem(value: m, child: Text(paymentMethodLabel(m))))
                        .toList(),
                    onChanged: (val) {
                      if (val != null) setSheetState(() => selectedMethod = val);
                    },
                  ),
                  const SizedBox(height: AppSizes.lg),
                  ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Payment of ${formatMoney(selectedInvoice.total)} recorded for ${customer.name}')),
                      );
                    },
                    child: const Text('Save Payment & Settle Invoice'),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}

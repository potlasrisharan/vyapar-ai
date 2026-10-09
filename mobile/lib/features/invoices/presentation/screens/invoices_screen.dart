// lib/features/invoices/presentation/screens/invoices_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_sizes.dart';
import '../../../../core/constants/app_strings.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/domain/entities.dart';
import '../../../../core/utils/format.dart';

class InvoicesScreen extends ConsumerStatefulWidget {
  const InvoicesScreen({super.key});

  @override
  ConsumerState<InvoicesScreen> createState() => _InvoicesScreenState();
}

class _InvoicesScreenState extends ConsumerState<InvoicesScreen> {
  InvoiceStatus? _statusFilter;

  @override
  Widget build(BuildContext context) {
    final data = ref.watch(businessDataProvider);
    final language = ref.watch(appProvider.select((s) => s.language));

    final filtered = _statusFilter == null
        ? data.invoices
        : data.invoices.where((i) => i.status == _statusFilter).toList();

    final paidCount = data.invoices.where((i) => i.status == InvoiceStatus.paid).length;
    final pendingCount = data.invoices.where((i) => i.status == InvoiceStatus.pending).length;
    final overdueCount = data.invoices.where((i) => i.status == InvoiceStatus.overdue).length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Invoices (Udhaari Ledger)'),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showCreateInvoiceSheet(context, data),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text(AppStrings.createInvoice),
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
                  label: Text('All (${data.invoices.length})'),
                  selected: _statusFilter == null,
                  onSelected: (_) => setState(() => _statusFilter = null),
                ),
                const SizedBox(width: AppSizes.sm),
                ChoiceChip(
                  label: Text('Overdue ($overdueCount)'),
                  selected: _statusFilter == InvoiceStatus.overdue,
                  selectedColor: AppColors.error.withValues(alpha: 0.2),
                  onSelected: (_) => setState(() => _statusFilter = InvoiceStatus.overdue),
                ),
                const SizedBox(width: AppSizes.sm),
                ChoiceChip(
                  label: Text('Pending ($pendingCount)'),
                  selected: _statusFilter == InvoiceStatus.pending,
                  selectedColor: AppColors.warning.withValues(alpha: 0.2),
                  onSelected: (_) => setState(() => _statusFilter = InvoiceStatus.pending),
                ),
                const SizedBox(width: AppSizes.sm),
                ChoiceChip(
                  label: Text('Paid ($paidCount)'),
                  selected: _statusFilter == InvoiceStatus.paid,
                  selectedColor: AppColors.success.withValues(alpha: 0.2),
                  onSelected: (_) => setState(() => _statusFilter = InvoiceStatus.paid),
                ),
              ],
            ),
          ),
          const Divider(),

          // Invoices List
          Expanded(
            child: filtered.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.receipt_long_outlined, size: 48, color: AppColors.textSecondary),
                        const SizedBox(height: AppSizes.sm),
                        Text(
                          'No invoices in this view',
                          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                color: AppColors.textSecondary,
                              ),
                        ),
                      ],
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.all(AppSizes.md),
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const SizedBox(height: AppSizes.sm),
                    itemBuilder: (context, index) {
                      final invoice = filtered[index];
                      final customer = data.customers.firstWhere(
                        (c) => c.id == invoice.customerId,
                        orElse: () => Customer(
                          id: invoice.customerId,
                          name: 'Unknown Customer',
                          contact: '',
                          phone: '',
                          city: '',
                        ),
                      );

                      final statusColor = switch (invoice.status) {
                        InvoiceStatus.paid => AppColors.success,
                        InvoiceStatus.overdue => AppColors.error,
                        InvoiceStatus.pending || null => AppColors.warning,
                      };

                      return Card(
                        child: InkWell(
                          onTap: () => _showInvoiceDetails(context, invoice, customer, language),
                          borderRadius: BorderRadius.circular(AppSizes.radiusMd),
                          child: Padding(
                            padding: const EdgeInsets.all(AppSizes.md),
                            child: Row(
                              children: [
                                Container(
                                  width: 48,
                                  height: 48,
                                  decoration: BoxDecoration(
                                    color: statusColor.withValues(alpha: 0.12),
                                    borderRadius: BorderRadius.circular(AppSizes.radiusSm),
                                  ),
                                  child: Icon(Icons.receipt_outlined, color: statusColor),
                                ),
                                const SizedBox(width: AppSizes.md),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            customer.name,
                                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                                  fontWeight: FontWeight.w600,
                                                ),
                                          ),
                                          Text(
                                            formatMoney(invoice.total),
                                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                                  fontWeight: FontWeight.w700,
                                                ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: AppSizes.xs),
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            '${invoice.id} · ${formatDate(invoice.date, language)}',
                                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                                  color: AppColors.textSecondary,
                                                ),
                                          ),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: statusColor.withValues(alpha: 0.15),
                                              borderRadius: BorderRadius.circular(4),
                                            ),
                                            child: Text(
                                              invoiceStatusLabel(invoice.status, language),
                                              style: TextStyle(
                                                fontSize: AppSizes.textXs,
                                                fontWeight: FontWeight.w600,
                                                color: statusColor,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
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

  void _showInvoiceDetails(
    BuildContext context,
    Invoice invoice,
    Customer customer,
    Language language,
  ) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surfaceDark,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppSizes.radiusLg)),
      ),
      builder: (context) {
        return DraggableScrollableSheet(
          initialChildSize: 0.7,
          minChildSize: 0.4,
          maxChildSize: 0.9,
          expand: false,
          builder: (context, scrollController) {
            return ListView(
              controller: scrollController,
              padding: const EdgeInsets.all(AppSizes.lg),
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppColors.borderDark,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: AppSizes.md),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          invoice.id,
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                        Text(
                          'Billed to ${customer.name}',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: AppColors.textSecondary,
                              ),
                        ),
                      ],
                    ),
                    Text(
                      formatMoney(invoice.total),
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSizes.md),
                const Divider(),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.phone_outlined),
                  title: Text(customer.contact),
                  subtitle: Text(customer.phone),
                ),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.calendar_today_outlined),
                  title: const Text('Invoice Date & Due Date'),
                  subtitle: Text('${invoice.date} → Due: ${invoice.dueDate}'),
                ),
                const SizedBox(height: AppSizes.md),
                Text('Items', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: AppSizes.sm),
                ...invoice.items.map((item) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('${item.productId} × ${item.quantity}'),
                          Text(formatMoney(item.subtotal)),
                        ],
                      ),
                    )),
                const Divider(),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Subtotal'),
                    Text(formatMoney(invoice.subtotal)),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('GST (CGST + SGST)'),
                    Text(formatMoney(invoice.tax)),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Total Amount', style: Theme.of(context).textTheme.titleMedium),
                    Text(
                      formatMoney(invoice.total),
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSizes.lg),
                ElevatedButton.icon(
                  onPressed: () {
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Payment reminder dispatched for ${invoice.id}')),
                    );
                  },
                  icon: const Icon(Icons.send),
                  label: const Text('Send WhatsApp Reminder'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _showCreateInvoiceSheet(BuildContext context, BusinessData data) {
    Customer selectedCustomer = data.customers.first;
    Product selectedProduct = data.products.first;
    int quantity = 1;

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
            final subtotal = selectedProduct.price * quantity;
            final tax = subtotal * 0.18;
            final total = subtotal + tax;

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
                    'Quick 10-Second GST Invoice',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  const SizedBox(height: AppSizes.md),
                  DropdownButtonFormField<Customer>(
                    initialValue: selectedCustomer,
                    decoration: const InputDecoration(labelText: 'Customer'),
                    items: data.customers
                        .map((c) => DropdownMenuItem(value: c, child: Text(c.name)))
                        .toList(),
                    onChanged: (val) {
                      if (val != null) setSheetState(() => selectedCustomer = val);
                    },
                  ),
                  const SizedBox(height: AppSizes.md),
                  DropdownButtonFormField<Product>(
                    initialValue: selectedProduct,
                    decoration: const InputDecoration(labelText: 'Product'),
                    items: data.products
                        .map((p) => DropdownMenuItem(value: p, child: Text('${p.name} (₹${p.price.toInt()})')))
                        .toList(),
                    onChanged: (val) {
                      if (val != null) setSheetState(() => selectedProduct = val);
                    },
                  ),
                  const SizedBox(height: AppSizes.md),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Quantity:'),
                      Row(
                        children: [
                          IconButton(
                            icon: const Icon(Icons.remove_circle_outline),
                            onPressed: quantity > 1
                                ? () => setSheetState(() => quantity--)
                                : null,
                          ),
                          Text(
                            '$quantity',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          IconButton(
                            icon: const Icon(Icons.add_circle_outline),
                            onPressed: () => setSheetState(() => quantity++),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSizes.sm),
                  Container(
                    padding: const EdgeInsets.all(AppSizes.md),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceDark2,
                      borderRadius: BorderRadius.circular(AppSizes.radiusMd),
                    ),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Subtotal:'),
                            Text(formatMoney(subtotal)),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('GST (18%):'),
                            Text(formatMoney(tax)),
                          ],
                        ),
                        const Divider(),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Total Bill:', style: Theme.of(context).textTheme.titleMedium),
                            Text(
                              formatMoney(total),
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                    color: AppColors.success,
                                    fontWeight: FontWeight.w700,
                                  ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppSizes.md),
                  ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Invoice generated for ${selectedCustomer.name} (Total: ${formatMoney(total)})')),
                      );
                    },
                    child: const Text('Generate & Save Invoice'),
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

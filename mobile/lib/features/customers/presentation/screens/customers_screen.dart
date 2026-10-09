// lib/features/customers/presentation/screens/customers_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_sizes.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/domain/entities.dart';
import '../../../../core/utils/format.dart';

class CustomersScreen extends ConsumerStatefulWidget {
  const CustomersScreen({super.key});

  @override
  ConsumerState<CustomersScreen> createState() => _CustomersScreenState();
}

class _CustomersScreenState extends ConsumerState<CustomersScreen> {
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final data = ref.watch(businessDataProvider);
    final language = ref.watch(appProvider.select((s) => s.language));

    final filteredCustomers = data.customers.where((c) {
      final q = _searchQuery.toLowerCase();
      return c.name.toLowerCase().contains(q) ||
          c.city.toLowerCase().contains(q) ||
          c.contact.toLowerCase().contains(q);
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Customers (Grahak)'),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddCustomerDialog(context),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        child: const Icon(Icons.person_add),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(AppSizes.md),
            child: TextField(
              decoration: const InputDecoration(
                hintText: 'Search customers by name, city, contact...',
                prefixIcon: Icon(Icons.search),
              ),
              onChanged: (val) => setState(() => _searchQuery = val),
            ),
          ),
          Expanded(
            child: filteredCustomers.isEmpty
                ? const Center(child: Text('No customers found'))
                : ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: AppSizes.md),
                    itemCount: filteredCustomers.length,
                    separatorBuilder: (_, __) => const SizedBox(height: AppSizes.sm),
                    itemBuilder: (context, index) {
                      final customer = filteredCustomers[index];
                      final customerInvoices = data.invoices.where((i) => i.customerId == customer.id).toList();
                      final outstanding = customerInvoices
                          .where((i) => i.status != InvoiceStatus.paid)
                          .fold(0.0, (s, i) => s + i.total);

                      return Card(
                        child: InkWell(
                          onTap: () => _showCustomerSheet(context, customer, customerInvoices, language),
                          borderRadius: BorderRadius.circular(AppSizes.radiusMd),
                          child: Padding(
                            padding: const EdgeInsets.all(AppSizes.md),
                            child: Row(
                              children: [
                                CircleAvatar(
                                  backgroundColor: AppColors.primary.withValues(alpha: 0.15),
                                  foregroundColor: AppColors.primary,
                                  child: Text(
                                    customer.name.substring(0, 1).toUpperCase(),
                                    style: const TextStyle(fontWeight: FontWeight.w700),
                                  ),
                                ),
                                const SizedBox(width: AppSizes.md),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        customer.name,
                                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                              fontWeight: FontWeight.w600,
                                            ),
                                      ),
                                      Text(
                                        '${customer.contact} · ${customer.city} · ${customer.phone}',
                                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                              color: AppColors.textSecondary,
                                            ),
                                      ),
                                    ],
                                  ),
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text(
                                      outstanding > 0 ? formatMoney(outstanding) : 'Cleared',
                                      style: TextStyle(
                                        fontWeight: FontWeight.w700,
                                        color: outstanding > 0 ? AppColors.error : AppColors.success,
                                      ),
                                    ),
                                    Text(
                                      '${customerInvoices.length} Bills',
                                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                            color: AppColors.textSecondary,
                                          ),
                                    ),
                                  ],
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

  void _showCustomerSheet(
    BuildContext context,
    Customer customer,
    List<Invoice> invoices,
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
        return Padding(
          padding: const EdgeInsets.all(AppSizes.lg),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(customer.name, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
              Text('${customer.contact} · ${customer.city} · ${customer.phone}', style: const TextStyle(color: AppColors.textSecondary)),
              if (customer.gstin != null) Text('GSTIN: ${customer.gstin}'),
              const SizedBox(height: AppSizes.md),
              const Divider(),
              Text('Invoices (${invoices.length})', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: AppSizes.sm),
              ...invoices.map((inv) => ListTile(
                    dense: true,
                    contentPadding: EdgeInsets.zero,
                    title: Text('${inv.id} (${inv.date})'),
                    subtitle: Text(invoiceStatusLabel(inv.status, language)),
                    trailing: Text(formatMoney(inv.total), style: const TextStyle(fontWeight: FontWeight.w700)),
                  )),
              const SizedBox(height: AppSizes.md),
              ElevatedButton.icon(
                onPressed: () {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('WhatsApp message opened for ${customer.name}')),
                  );
                },
                icon: const Icon(Icons.chat),
                label: const Text('Send WhatsApp Message / Reminder'),
              ),
            ],
          ),
        );
      },
    );
  }

  void _showAddCustomerDialog(BuildContext context) {
    final nameCtrl = TextEditingController();
    final contactCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final cityCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add New Customer'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Business Name')),
            const SizedBox(height: AppSizes.sm),
            TextField(controller: contactCtrl, decoration: const InputDecoration(labelText: 'Contact Person')),
            const SizedBox(height: AppSizes.sm),
            TextField(controller: phoneCtrl, decoration: const InputDecoration(labelText: 'Phone Number')),
            const SizedBox(height: AppSizes.sm),
            TextField(controller: cityCtrl, decoration: const InputDecoration(labelText: 'City')),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Customer ${nameCtrl.text} added!')),
              );
            },
            child: const Text('Save Customer'),
          ),
        ],
      ),
    );
  }
}

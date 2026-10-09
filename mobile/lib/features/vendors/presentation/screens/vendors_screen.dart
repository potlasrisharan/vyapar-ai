// lib/features/vendors/presentation/screens/vendors_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_sizes.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/utils/format.dart';

class VendorsScreen extends ConsumerStatefulWidget {
  const VendorsScreen({super.key});

  @override
  ConsumerState<VendorsScreen> createState() => _VendorsScreenState();
}

class _VendorsScreenState extends ConsumerState<VendorsScreen> {
  String? _selectedCategory;

  @override
  Widget build(BuildContext context) {
    final data = ref.watch(businessDataProvider);

    final categories = ['All', 'Electronics', 'Electrical', 'Utility'];

    final filteredVendors = _selectedCategory == null || _selectedCategory == 'All'
        ? data.vendors
        : data.vendors.where((v) => v.category.toLowerCase() == _selectedCategory!.toLowerCase()).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Vendors (Suppliers)'),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddVendorDialog(context),
        backgroundColor: AppColors.accent,
        foregroundColor: Colors.white,
        child: const Icon(Icons.add_business),
      ),
      body: Column(
        children: [
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: AppSizes.md, vertical: AppSizes.sm),
            child: Row(
              children: categories
                  .map((cat) => Padding(
                        padding: const EdgeInsets.only(right: AppSizes.sm),
                        child: ChoiceChip(
                          label: Text(cat),
                          selected: (_selectedCategory == null && cat == 'All') || _selectedCategory == cat,
                          onSelected: (_) => setState(() => _selectedCategory = cat == 'All' ? null : cat),
                        ),
                      ))
                  .toList(),
            ),
          ),
          const Divider(),
          Expanded(
            child: filteredVendors.isEmpty
                ? const Center(child: Text('No vendors found'))
                : ListView.separated(
                    padding: const EdgeInsets.all(AppSizes.md),
                    itemCount: filteredVendors.length,
                    separatorBuilder: (_, __) => const SizedBox(height: AppSizes.sm),
                    itemBuilder: (context, index) {
                      final vendor = filteredVendors[index];
                      final productsSupplied = data.products.where((p) => p.vendorId == vendor.id).length;
                      final totalBilled = data.expenses
                          .where((e) => e.vendorId == vendor.id)
                          .fold(0.0, (s, e) => s + e.amount);

                      return Card(
                        child: Padding(
                          padding: const EdgeInsets.all(AppSizes.md),
                          child: Row(
                            children: [
                              Container(
                                width: 48,
                                height: 48,
                                decoration: BoxDecoration(
                                  color: AppColors.accent.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(AppSizes.radiusSm),
                                ),
                                child: const Icon(Icons.storefront, color: AppColors.accent),
                              ),
                              const SizedBox(width: AppSizes.md),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      vendor.name,
                                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                            fontWeight: FontWeight.w600,
                                          ),
                                    ),
                                    Text(
                                      '${vendor.category} · ${vendor.city}',
                                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                            color: AppColors.textSecondary,
                                          ),
                                    ),
                                    if (vendor.gstin != null)
                                      Text(
                                        'GSTIN: ${vendor.gstin}',
                                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
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
                                    totalBilled > 0 ? formatMoney(totalBilled) : 'Active',
                                    style: const TextStyle(fontWeight: FontWeight.w700),
                                  ),
                                  Text(
                                    '$productsSupplied Items',
                                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                          color: AppColors.textSecondary,
                                        ),
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

  void _showAddVendorDialog(BuildContext context) {
    final nameCtrl = TextEditingController();
    final catCtrl = TextEditingController();
    final cityCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add Vendor Supplier'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Vendor Name')),
            const SizedBox(height: AppSizes.sm),
            TextField(controller: catCtrl, decoration: const InputDecoration(labelText: 'Category (e.g. Electronics)')),
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
                SnackBar(content: Text('Vendor ${nameCtrl.text} added!')),
              );
            },
            child: const Text('Save Vendor'),
          ),
        ],
      ),
    );
  }
}

// lib/features/inventory/presentation/screens/inventory_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_sizes.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/domain/entities.dart';
import '../../../../core/utils/format.dart';

class InventoryScreen extends ConsumerStatefulWidget {
  const InventoryScreen({super.key});

  @override
  ConsumerState<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends ConsumerState<InventoryScreen> {
  bool _onlyLowStock = false;

  @override
  Widget build(BuildContext context) {
    final data = ref.watch(businessDataProvider);
    final lowStockItems = ref.watch(lowStockProductsProvider);

    final displayProducts = _onlyLowStock ? lowStockItems : data.products;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Inventory (Stock)'),
      ),
      body: Column(
        children: [
          // Low stock alert warning
          if (lowStockItems.isNotEmpty)
            Container(
              margin: const EdgeInsets.all(AppSizes.md),
              padding: const EdgeInsets.all(AppSizes.md),
              decoration: BoxDecoration(
                color: AppColors.stockOrange.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(AppSizes.radiusMd),
                border: Border.all(color: AppColors.stockOrange),
              ),
              child: Row(
                children: [
                  const Icon(Icons.warning_amber_rounded, color: AppColors.stockOrange),
                  const SizedBox(width: AppSizes.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${lowStockItems.length} Products Need Reorder',
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            color: AppColors.stockOrange,
                          ),
                        ),
                        const Text(
                          'Items are at or below safety stock levels.',
                          style: TextStyle(
                            fontSize: AppSizes.textXs,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  TextButton(
                    onPressed: () => setState(() => _onlyLowStock = true),
                    child: const Text('View Low Stock'),
                  ),
                ],
              ),
            ),

          // Filters
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSizes.md),
            child: Row(
              children: [
                ChoiceChip(
                  label: Text('All Items (${data.products.length})'),
                  selected: !_onlyLowStock,
                  onSelected: (_) => setState(() => _onlyLowStock = false),
                ),
                const SizedBox(width: AppSizes.sm),
                ChoiceChip(
                  label: Text('Low Stock (${lowStockItems.length})'),
                  selected: _onlyLowStock,
                  selectedColor: AppColors.stockOrange.withValues(alpha: 0.2),
                  onSelected: (_) => setState(() => _onlyLowStock = true),
                ),
              ],
            ),
          ),
          const Divider(),

          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.all(AppSizes.md),
              itemCount: displayProducts.length,
              separatorBuilder: (_, __) => const SizedBox(height: AppSizes.sm),
              itemBuilder: (context, index) {
                final product = displayProducts[index];
                final vendor = data.vendors.firstWhere(
                  (v) => v.id == product.vendorId,
                  orElse: () => const Vendor(id: '', name: 'Supplier', category: '', city: ''),
                );

                final daysRemaining = product.dailySales > 0
                    ? (product.stock / product.dailySales).round()
                    : 99;

                final stockColor = product.isLowStock ? AppColors.error : AppColors.success;

                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(AppSizes.md),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                product.name,
                                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                      fontWeight: FontWeight.w600,
                                    ),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: stockColor.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                product.isLowStock ? 'Low: ${product.stock} left' : '${product.stock} in stock',
                                style: TextStyle(
                                  color: stockColor,
                                  fontSize: AppSizes.textXs,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: AppSizes.xs),
                        Text(
                          'SKU: ${product.sku} · ${product.category} · Supplier: ${vendor.name}',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: AppColors.textSecondary,
                              ),
                        ),
                        const SizedBox(height: AppSizes.sm),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Price: ${formatMoney(product.price)}', style: const TextStyle(fontWeight: FontWeight.w700)),
                                Text('Reorder Level: ${product.reorderLevel} units', style: const TextStyle(fontSize: AppSizes.textXs, color: AppColors.textSecondary)),
                              ],
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text('~${daysRemaining}d run-rate', style: TextStyle(fontWeight: FontWeight.w600, color: daysRemaining < 7 ? AppColors.error : AppColors.textSecondary)),
                                Text('${product.dailySales}/day sales', style: const TextStyle(fontSize: AppSizes.textXs, color: AppColors.textSecondary)),
                              ],
                            ),
                          ],
                        ),
                        if (product.isLowStock) ...[
                          const SizedBox(height: AppSizes.sm),
                          ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.stockOrange,
                              foregroundColor: Colors.white,
                              minimumSize: const Size.fromHeight(40),
                            ),
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('Reorder request generated for ${vendor.name}: 10 units of ${product.name}')),
                              );
                            },
                            icon: const Icon(Icons.shopping_cart_checkout, size: AppSizes.iconSm),
                            label: const Text('Reorder from Supplier'),
                          ),
                        ],
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

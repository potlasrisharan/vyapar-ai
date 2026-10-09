// lib/core/utils/format.dart
import 'package:intl/intl.dart';
import '../domain/entities.dart';

/// Format number as Indian currency string e.g. ₹1,23,456
String formatMoney(double amount, {bool compact = false}) {
  if (compact) {
    if (amount >= 100000) return '₹${(amount / 100000).toStringAsFixed(1)}L';
    if (amount >= 1000) return '₹${(amount / 1000).toStringAsFixed(1)}K';
  }
  final formatter = NumberFormat.currency(
    locale: 'en_IN',
    symbol: '₹',
    decimalDigits: 0,
  );
  return formatter.format(amount);
}

/// Format date string (ISO) to human-readable
String formatDate(String isoDate, Language lang) {
  try {
    final dt = DateTime.parse(isoDate);
    final formatter = DateFormat('d MMM yyyy', lang == Language.hi ? 'hi' : 'en');
    return formatter.format(dt);
  } catch (_) {
    return isoDate;
  }
}

/// Days until/since a date
int daysDiff(String isoDate) {
  try {
    final target = DateTime.parse(isoDate);
    return target.difference(DateTime.now()).inDays;
  } catch (_) {
    return 0;
  }
}

String invoiceStatusLabel(InvoiceStatus? status, Language lang) {
  switch (status) {
    case InvoiceStatus.paid:
      return lang == Language.hi ? 'भुगतान हो गया' : 'Paid';
    case InvoiceStatus.overdue:
      return lang == Language.hi ? 'बकाया' : 'Overdue';
    case InvoiceStatus.pending:
    default:
      return lang == Language.hi ? 'बाकी है' : 'Pending';
  }
}

String paymentMethodLabel(PaymentMethod method) {
  switch (method) {
    case PaymentMethod.upi:
      return 'UPI';
    case PaymentMethod.bank:
      return 'Bank Transfer';
    case PaymentMethod.cash:
      return 'Cash';
  }
}

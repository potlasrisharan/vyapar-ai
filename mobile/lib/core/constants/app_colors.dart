// lib/core/constants/app_colors.dart
import 'package:flutter/material.dart';

abstract final class AppColors {
  // Brand - Deep Forest Green & Mint from original dashboard
  static const Color primary = Color(0xFF0D7063);       // Forest Teal
  static const Color primaryDark = Color(0xFF085248);   // Deep Forest Teal
  static const Color primaryLight = Color(0xFF159C8B);  // Medium Teal
  static const Color accent = Color(0xFF10B981);        // Mint / Emerald
  static const Color mintBg = Color(0xFFE6F4F1);        // Light Mint Pill / Badge Background
  static const Color mintSurface = Color(0xFFEFF8F5);   // Soft Mint Tinted Surface

  // Quick Action card left borders (from screenshot)
  static const Color actionEmerald = Color(0xFF10B981); // Emerald left-border
  static const Color actionBlue = Color(0xFF3B82F6);    // Blue left-border
  static const Color actionAmber = Color(0xFFF59E0B);   // Amber left-border
  static const Color actionPurple = Color(0xFF8B5CF6);  // Purple left-border

  // Light theme (Default)
  static const Color bgLight = Color(0xFFF8FAFC);       // Soft Slate 50 background
  static const Color surfaceLight = Color(0xFFFFFFFF);  // Pure white cards
  static const Color surfaceMuted = Color(0xFFF1F5F9);  // Subtle gray
  static const Color borderLight = Color(0xFFE2E8F0);   // Crisp light border

  // Dark theme
  static const Color bgDark = Color(0xFF0F172A);
  static const Color surfaceDark = Color(0xFF1E293B);
  static const Color surfaceDark2 = Color(0xFF334155);
  static const Color borderDark = Color(0xFF334155);

  // Text
  static const Color textPrimary = Color(0xFF0F172A);   // Slate 900
  static const Color textSecondary = Color(0xFF64748B); // Slate 500
  static const Color textMuted = Color(0xFF94A3B8);     // Slate 400
  static const Color textLight = Color(0xFF0F172A);     // For light mode text
  static const Color textDark = Color(0xFFF8FAFC);      // For dark mode text

  // Status & Priority Badges
  static const Color success = Color(0xFF10B981);       // Emerald
  static const Color warning = Color(0xFFF59E0B);       // Amber
  static const Color error = Color(0xFFEF4444);         // Red
  static const Color info = Color(0xFF3B82F6);          // Blue

  static const Color priorityHighText = Color(0xFFB91C1C);
  static const Color priorityHighBg = Color(0xFFFEF2F2);
  static const Color priorityHighBorder = Color(0xFFFECACA);

  static const Color priorityAttentionText = Color(0xFF92400E);
  static const Color priorityAttentionBg = Color(0xFFFEF3C7);
  static const Color priorityAttentionBorder = Color(0xFFFDE68A);

  // Feature colors
  static const Color invoiceBlue = Color(0xFF3B82F6);
  static const Color paymentTeal = Color(0xFF0D7063);
  static const Color expenseAmber = Color(0xFFF59E0B);
  static const Color insightPurple = Color(0xFF8B5CF6);
  static const Color stockOrange = Color(0xFFF97316);
}

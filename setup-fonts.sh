#!/bin/bash

# Font Installation Script for MCQ Exam Platform
# This script helps download and setup Satoshi and Clash Display fonts

echo "🎨 MCQ Platform - Font Setup Script"
echo "===================================="
echo ""

FONTS_DIR="public/fonts"

# Create fonts directory if it doesn't exist
mkdir -p "$FONTS_DIR"

echo "📥 Font Download Instructions:"
echo ""
echo "1. SATOSHI FONT (Primary UI Font)"
echo "   → Visit: https://www.fontshare.com/fonts/satoshi"
echo "   → Click 'Download font family'"
echo "   → Extract the ZIP file"
echo "   → Copy these files to $FONTS_DIR/:"
echo "     • Satoshi-Regular.woff2"
echo "     • Satoshi-Medium.woff2"
echo "     • Satoshi-Bold.woff2"
echo ""
echo "2. CLASH DISPLAY FONT (Marketing Headings)"
echo "   → Visit: https://www.fontshare.com/fonts/clash-display"
echo "   → Click 'Download font family'"
echo "   → Extract the ZIP file"
echo "   → Copy these files to $FONTS_DIR/:"
echo "     • ClashDisplay-Semibold.woff2"
echo "     • ClashDisplay-Bold.woff2"
echo ""
echo "📋 Required Files Checklist:"
echo "----------------------------"

# Check if fonts exist
check_font() {
    if [ -f "$FONTS_DIR/$1" ]; then
        echo "✅ $1"
        return 0
    else
        echo "❌ $1 (MISSING)"
        return 1
    fi
}

check_font "Satoshi-Regular.woff2"
check_font "Satoshi-Medium.woff2"
check_font "Satoshi-Bold.woff2"
check_font "ClashDisplay-Semibold.woff2"
check_font "ClashDisplay-Bold.woff2"

echo ""
echo "📝 Note: Both fonts are FREE from Fontshare"
echo "   License: Fontshare EULA (free for personal & commercial use)"
echo ""
echo "🚀 After adding fonts, run: npm run dev"
echo ""

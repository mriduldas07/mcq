@echo off
REM Font Installation Script for MCQ Exam Platform
REM This script helps download and setup Satoshi and Clash Display fonts

echo.
echo 🎨 MCQ Platform - Font Setup Script
echo ====================================
echo.

set FONTS_DIR=public\fonts

REM Create fonts directory if it doesn't exist
if not exist "%FONTS_DIR%" mkdir "%FONTS_DIR%"

echo 📥 Font Download Instructions:
echo.
echo 1. SATOSHI FONT (Primary UI Font)
echo    → Visit: https://www.fontshare.com/fonts/satoshi
echo    → Click 'Download font family'
echo    → Extract the ZIP file
echo    → Copy these files to %FONTS_DIR%\:
echo      • Satoshi-Regular.woff2
echo      • Satoshi-Medium.woff2
echo      • Satoshi-Bold.woff2
echo.
echo 2. CLASH DISPLAY FONT (Marketing Headings)
echo    → Visit: https://www.fontshare.com/fonts/clash-display
echo    → Click 'Download font family'
echo    → Extract the ZIP file
echo    → Copy these files to %FONTS_DIR%\:
echo      • ClashDisplay-Semibold.woff2
echo      • ClashDisplay-Bold.woff2
echo.
echo 📋 Required Files Checklist:
echo ----------------------------

REM Check if fonts exist
if exist "%FONTS_DIR%\Satoshi-Regular.woff2" (
    echo ✅ Satoshi-Regular.woff2
) else (
    echo ❌ Satoshi-Regular.woff2 ^(MISSING^)
)

if exist "%FONTS_DIR%\Satoshi-Medium.woff2" (
    echo ✅ Satoshi-Medium.woff2
) else (
    echo ❌ Satoshi-Medium.woff2 ^(MISSING^)
)

if exist "%FONTS_DIR%\Satoshi-Bold.woff2" (
    echo ✅ Satoshi-Bold.woff2
) else (
    echo ❌ Satoshi-Bold.woff2 ^(MISSING^)
)

if exist "%FONTS_DIR%\ClashDisplay-Semibold.woff2" (
    echo ✅ ClashDisplay-Semibold.woff2
) else (
    echo ❌ ClashDisplay-Semibold.woff2 ^(MISSING^)
)

if exist "%FONTS_DIR%\ClashDisplay-Bold.woff2" (
    echo ✅ ClashDisplay-Bold.woff2
) else (
    echo ❌ ClashDisplay-Bold.woff2 ^(MISSING^)
)

echo.
echo 📝 Note: Both fonts are FREE from Fontshare
echo    License: Fontshare EULA (free for personal ^& commercial use)
echo.
echo 🚀 After adding fonts, run: npm run dev
echo.
pause

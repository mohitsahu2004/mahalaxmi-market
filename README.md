# Mahalaxmi Market - Commercial Shop Rental Management App

Mahalaxmi Market is a modern, responsive web and mobile application designed for commercial complex landlords and shop tenants.

## Features
- **Shop & Tenant Management**: Track occupied, vacant, and notice-period commercial shops.
- **Rent & Electricity Billing**: Automated meter reading calculations, fixed charges, late fees, and dual billing.
- **Instant Digital Receipts**: Print, export to PDF, and share WhatsApp billing receipts with GST and breakdown.
- **Tenant Self-Service Portal**: Direct shop view, pay with UPI QR code, download past receipts, submit complaints.
- **Admin Dashboard**: Revenue charts, collection percentage, outstanding dues, and cashbook records.
- **PWA & Android Support**: 1-Tap installable home screen app with offline caching and standalone display.

---

## 🚀 How to Run Locally

1. Make sure you have **Node.js 18+** installed on your computer.
2. Open your terminal in this project directory.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## 📱 How to Build a Native Android APK

### Method A: Microsoft PWABuilder (Fastest, No Coding Required)
1. Deploy or host this app on any web server (Vercel, Netlify, Cloud Run, or GitHub Pages).
2. Go to **[https://www.pwabuilder.com](https://www.pwabuilder.com)**.
3. Enter your web app URL.
4. Click **Package for Android** and download your signed `.apk` file!

### Method B: Capacitor / Android Studio (Full Native APK)
1. Install Capacitor:
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap init "Mahalaxmi Market" "com.mahalaxmimarket.app" --web-dir dist
   ```
2. Build the web app:
   ```bash
   npm run build
   ```
3. Add the Android platform:
   ```bash
   npx cap add android
   npx cap copy android
   ```
4. Open in Android Studio to build APK:
   ```bash
   npx cap open android
   ```
   In Android Studio, click **Build > Build Bundle(s) / APK(s) > Build APK(s)** to get your `.apk` file!

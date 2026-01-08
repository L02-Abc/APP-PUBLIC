# Lofy 🛍️

Lofy is an app helping student in HCMUT finding their lost items. Developed using **React Native** and **Expo**, it features a modern architecture with **File-based Routing**

##  Tech Stack

* **Framework:** React Native (via Expo SDK)
* **Language:** TypeScript
* **Routing:** Expo Router
* **Styling:** NativeWind (Tailwind CSS)
* **State Management:** Custom Stores (Zustand/Context pattern in `/store`)
* **Backend Integration:** Axios (API Services)
* **Services:** Firebase (Analytics & Notifications), Sentry (Error Monitoring)

##  Key Features
* **Authentication:** Secure Login and Welcome flows.
* **Post Management:** Create, edit, and manage item listings (`/post`).
* **Claim System:** Unique transactional flow allowing users to submit and view claims on items.
* **Reporting:** Robust reporting system for posts (`/report`).
* **Notifications:** Real-time updates for user interactions.
* **Dashboard:** Tab-based navigation for easy access to Home, Archives, and Settings.

##  Project Structure

```
Lofy/
├── app/                  # Expo Router (Pages & Navigation)
│   ├── (tabs)/           # Main App Tabs (Home, Settings, Archived)
│   ├── auth/             # Authentication Screens
│   ├── post/             # Post Details & Claim Logic
│   └── report/           # Reporting Logic
├── components/           # Reusable UI Components
├── store/                # State Management (User & Notification Stores)
├── styles/               # Global Styles & Theme Config
├── schema/               # Data Validation & Types
└── services/             # API Integration (Axios)
```

## Getting Started
# **Prerequisites**
Node.js (LTS)
Expo CLI

# Installation
Clone the repository


```
git clone [https://github.com/L02-Abc/APP-PUBLIC.git](https://github.com/L02-Abc/APP-PUBLIC.git)
cd APP-PUBLIC
```
# Install dependencies
```
npm install
```
# Start the application
```
npx expo start
```
# Run on Device
Scan the QR code with the Expo Go app (Android/iOS).
Or press a for Android Emulator / i for iOS Simulator.


npm run test

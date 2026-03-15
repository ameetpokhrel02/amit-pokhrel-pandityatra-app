<div align="center">
  <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="PanditYatra Logo" width="120" />
  <h1>🕉️ Pandit Yatra App</h1>
  <p><strong>A Next-Generation Spiritual Booking & E-commerce Platform</strong></p>

  <p>
    <img src="https://img.shields.io/badge/React_Native-0.81.5-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native Version" />
    <img src="https://img.shields.io/badge/Expo-~54.0.30-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo Version" />
    <img src="https://img.shields.io/badge/TypeScript-~5.9.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript Version" />
    <img src="https://img.shields.io/badge/Zustand-^5.0.9-423535?style=for-the-badge&logo=react&logoColor=white" alt="Zustand Version" />
    <img src="https://img.shields.io/badge/TailwindCSS-^3.4.19-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind Version" />
  </p>
</div>

---

## ✨ Features

- 👳 **Pandit Booking:** Discover top-rated pandits near you, view their experience, ratings, and book personalized rituals or pujas.
- 🛒 **Samagri Shop:** A fully-featured e-commerce store to buy authentic spiritual items, complete with a persistent cart and wishlist.
- 🤖 **AI Spiritual Guide:** Ask questions about rituals, kundali matching, or recommendations utilizing our integrated AI bot.
- 📱 **Premium UI/UX:** A stunning, animated, and highly responsive interface designed with NativeWind and built on Expo Router.
- 🔔 **Real-Time Notifications:** Stay updated with your booking statuses, messages, and platform updates.
- 💬 **Live Chat & Video:** Seamlessly communicate with pandits directly from the app via text or integrated Daily.co video calling.
- 💳 **Secure Payments:** Integrated with Khalti, eSewa, and Stripe for reliable transacting.

---

## 🛠️ Technology Stack

| Category | Technology | Version |
| :--- | :--- | :--- |
| **Framework** | Expo Router / React Native | Expo 54, React Native 0.81 |
| **Language** | TypeScript | 5.9.x |
| **State Management** | Zustand (with Persist Middleware) | 5.0.9 |
| **Styling** | NativeWind (TailwindCSS) | 4.2.1 |
| **Storage & Caching** | AsyncStorage / SecureStore | - |
| **Package Manager** | PNPM | Recommended |

---

## 🚀 Getting Started

Follow these instructions to get the project running on your local machine.

### Prerequisites

Ensure you have the following installed on your system:
- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [Git](https://git-scm.com/)
- [PNPM](https://pnpm.io/installation) (`npm install -g pnpm`)
- Expo Go app on your [iOS](https://apps.apple.com/us/app/expo-go/id982107779) or [Android](https://play.google.com/store/apps/details?id=host.exp.exponent) device (or set up Android Studio/Xcode emulators).

### 🐧 Setup for Linux / 🍏 macOS

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ameetpokhrel02/amit-pokhrel-pandityatra-app.git
   cd amit-pokhrel-pandityatra-app
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory based on the provided configuration variables in the codebase (e.g., API Base URLs, Google Client IDs).

4. **Start the Development Server:**
   ```bash
   # Starts the standard local development server
   pnpm run start
   
   # OR, if testing on a physical device over a different network (highly recommended):
   pnpm run start:tunnel
   ```

### 🪟 Setup for Windows

1. **Clone the repository** (Using Git Bash or PowerShell):
   ```powershell
   git clone https://github.com/ameetpokhrel02/amit-pokhrel-pandityatra-app.git
   cd amit-pokhrel-pandityatra-app
   ```

2. **Install dependencies:**
   ```powershell
   pnpm install
   ```

3. **Start the Development Server:**
   ```powershell
   pnpm run start
   ```
   *Note: If you have firewall issues accessing the local server from your phone, use the tunnel command:* `pnpm run start:tunnel`

---

## 👨‍💻 Development Guides

### Running on Emulators
Once the server is running, press the corresponding key in the terminal output:
- Press `a` to open the app in an Android Emulator.
- Press `i` to open the app in an iOS Simulator (macOS only).

### Project Structure (src/)
- `/app` - Expo Router file-based navigation screens.
- `/components` - Reusable UI components.
- `/services` - API client configurations and endpoint functions.
- `/store` - Global state management utilizing Zustand.
- `/constants` & `/utils` - Theming, configuration, and helper functions.

---

## 🤝 Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---
<p align="center">Made with ❤️ by Amit Pokhrel</p>

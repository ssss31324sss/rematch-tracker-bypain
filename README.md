# Rematch Tracker by PAIN

**Современный дашборд для TRIPLE SIX** — удобный инструмент для отслеживания scrims и турниров.

![Dashboard Preview](https://github.com/ssss31324sss/rematch-tracker-bypain/blob/main/preview.jpg)

## ✨ Возможности

- Красивый тёмный glass-морфизм интерфейс
- Полная поддержка Firebase (команды, серии, игроки)
- Тактическая доска
- История матчей
- Анимированный фон
- **Автообновление** приложения
- Работает как удобное desktop-приложение (.exe)

## 🚀 Быстрый старт

### 1. Скачай приложение
Перейди в [Releases](https://github.com/ssss31324sss/rematch-tracker-bypain/releases) и скачай последнюю версию.

### 2. Настрой Firebase

1. Скопируй файл `.env.example` → переименуй в `.env`
2. Открой `.env` и вставь свои данные из Firebase:

```env
FIREBASE_API_KEY=твой_api_key
FIREBASE_AUTH_DOMAIN=твой_project.firebaseapp.com
FIREBASE_PROJECT_ID=твой_project
FIREBASE_MESSAGING_SENDER_ID=...
FIREBASE_APP_ID=...
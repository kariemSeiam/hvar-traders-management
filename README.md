# HVAR Traders Management System

Governorates and Cities Trader Management System with real-time JSON sync for HVAR Company.

## 🚀 Quick Start

### Requirements

- Node.js (version 14 or higher)

### Installation & Running

#### 1. Install Dependencies

Open terminal in project folder and run:

```bash
npm install
```

#### 2. Start the Server

```bash
npm start
```

You'll see confirmation that the server is running:

```
🚀 Traders Manager Server running on port 3000
📁 Syncing with traders.json
✨ Real-time updates enabled
```

#### 3. Open the Application

Open your browser and go to:

```
http://localhost:3000
```

## ✨ Features

### Real-time JSON Synchronization

- ✅ **All changes save instantly** to `traders.json` file
- ✅ **Add new trader** → saves directly to JSON
- ✅ **Edit data** → saves directly to JSON
- ✅ **Delete trader** → saves directly to JSON
- ✅ **Add/Remove columns** → saves directly to JSON
- ✅ **Edit status & order columns** → saves directly to JSON

### Editable Columns

All columns are editable **except**:

- ❌ Governorate (read-only)
- ❌ City (read-only)

### Available Columns:

- ✏️ Revenue (number)
- ✏️ Order Status (dropdown: completed, pending, cancelled, processing)
- ✏️ Status (dropdown: active, inactive, suspended)
- ✏️ Phone Number (phone)
- ✏️ Trader Name (text)

## 🔧 How It Works

1. **On app startup**: loads data from `traders.json`
2. **On any change**: saves data instantly to `traders.json`
3. **No localStorage needed**: everything saves directly to JSON

## 📝 Notes

- **Server must be running** before opening the app in browser
- If you see "Failed to connect to server", make sure `npm start` is running
- Data automatically saves to `traders.json` with every change

## 🛠️ Troubleshooting

### Issue: "Failed to connect to server"

**Solution**: Make sure server is running:

```bash
npm start
```

### Issue: "Cannot find module 'express'"

**Solution**: Install packages:

```bash
npm install
```

### Issue: Port 3000 already in use

**Solution**: Close any app using port 3000 or change port in `server.js`

## 📂 File Structure

```
.
├── server.js          # Node.js server (API)
├── index.html         # Application interface
├── script.js          # Application logic
├── styles.css         # Styling
├── traders.json       # Traders database (real-time sync)
├── govs.json          # Governorates and cities data
├── package.json       # Node.js configuration
└── README.md          # This file
```

## 🎯 Development

For development with auto-restart:

```bash
npm run dev
```

---

Made with ❤️ for efficient trader management - HVAR Company

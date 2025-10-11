# 🌟 City Traders - HVAR Company

A comprehensive web-based trader management system designed for managing traders across different governorates and cities with real-time synchronization and bilingual support (Arabic/English).

## ✨ Features

- **🏛️ Multi-Governorate Support**: Manage traders across different governorates and cities
- **👥 Trader Management**: Add, edit, and organize trader information
- **📊 Revenue Tracking**: Monitor trader revenues and performance metrics
- **📱 Contact Management**: Store and manage trader contact information
- **🔄 Real-time Sync**: Automatic data synchronization across the platform
- **🌍 Bilingual Interface**: Full Arabic and English language support
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices
- **⚡ Fast Performance**: Optimized for quick loading and smooth user experience

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- Flask web framework
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/city-traders.git
   cd city-traders
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**
   ```bash
   python run.py
   ```

4. **Open your browser**
   Navigate to `http://localhost:5000`

## 🛠️ Technology Stack

- **Backend**: Python Flask
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Data Storage**: JSON files with real-time synchronization
- **Styling**: Custom CSS with RTL support for Arabic
- **Fonts**: Google Fonts (Cairo for Arabic text)

## 📋 Usage

1. **Select Governorate**: Choose a governorate from the sidebar
2. **Choose City**: Select a specific city within the governorate
3. **View Traders**: See all traders in the selected city
4. **Add/Edit Traders**: Use the management interface to add new traders or edit existing ones
5. **Search & Filter**: Use the search functionality to find specific traders

## 🌍 Supported Regions

The system supports comprehensive coverage of Egyptian governorates and cities, including:
- Cairo Governorate
- Alexandria Governorate
- Giza Governorate
- All major Egyptian cities and districts

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 Data Structure

The system uses a hierarchical data structure:
```
Governorate → City → Traders
```

Each trader record includes:
- Trader name (اسم التاجر)
- Revenue information (الإيرادات)
- Phone number (رقم الهاتف)
- Status flags

## 🔒 Security & Privacy

- All data is stored locally in JSON format
- No external API dependencies for core functionality
- Secure file handling with proper error management
- Backup creation before data updates

## 📞 Support

For support and inquiries, please contact:
- **Company**: HVAR Company
- **Email**: support@hvar-company.com
- **Website**: https://hvar-company.com

## 📜 License

This project is proprietary software developed for HVAR Company. All rights reserved.

---

**Built with ❤️ for efficient trader management**

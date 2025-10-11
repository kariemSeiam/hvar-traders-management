#!/usr/bin/env python3
"""
Flask application runner for PythonAnywhere deployment
"""

from app import app

if __name__ == '__main__':
    print("""
╔════════════════════════════════════════════╗
║  🚀 Flask server starting...               ║
║  📁 Syncing with traders.json              ║
║  ✨ Real-time updates enabled              ║
╚════════════════════════════════════════════╝
""")
    app.run(debug=False, host='0.0.0.0', port=5000)

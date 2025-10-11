from flask import Flask, jsonify, request, send_from_directory
import json
import os
from datetime import datetime

app = Flask(__name__)
TRADERS_FILE = "traders.json"

@app.route('/api/traders', methods=['GET'])
def get_traders():
    """Read traders data"""
    try:
        with open(TRADERS_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return jsonify(data)
    except FileNotFoundError:
        return jsonify({"error": "Traders file not found"}), 404
    except json.JSONDecodeError:
        return jsonify({"error": "Invalid JSON format in traders file"}), 500
    except Exception as e:
        print(f"Error reading traders.json: {e}")
        return jsonify({"error": "Failed to read traders data"}), 500

@app.route('/api/traders', methods=['POST'])
def update_traders():
    """Write traders data (real-time sync)"""
    try:
        data = request.get_json()
        if data is None:
            return jsonify({"error": "No JSON data provided"}), 400

        # Create backup before updating
        if os.path.exists(TRADERS_FILE):
            backup_name = f"traders_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(TRADERS_FILE, 'r', encoding='utf-8') as original:
                with open(backup_name, 'w', encoding='utf-8') as backup:
                    backup.write(original.read())

        with open(TRADERS_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        print("✓ traders.json updated successfully")
        return jsonify({"success": True, "message": "Data saved successfully"})
    except Exception as e:
        print(f"Error writing traders.json: {e}")
        return jsonify({"error": "Failed to save traders data"}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "ok", "message": "Server is running"})

@app.route('/')
def serve_index():
    """Serve the main HTML file"""
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files"""
    return send_from_directory('.', filename)

if __name__ == '__main__':
    print("""
╔════════════════════════════════════════════╗
║  🚀 Flask server running on http://localhost:5000  ║
║  📁 Syncing with traders.json              ║
║  ✨ Real-time updates enabled              ║
╚════════════════════════════════════════════╝
""")
    app.run(debug=True, host='0.0.0.0', port=5000)

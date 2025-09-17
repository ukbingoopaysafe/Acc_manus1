import os
import sys
# DON\'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from src.models import db
from src.routes.user import user_bp
from src.routes.auth import auth_bp
from src.routes.units import units_bp
from src.routes.sales import sales_bp
from src.routes.expenses import expenses_bp
from src.routes.rentals import rentals_bp
from src.routes.finishing_works import finishing_works_bp
from src.routes.settings import settings_bp
from src.routes.reports import reports_bp
from src.routes.print_export import print_export_bp
from src.routes.dynamic_calculations import dynamic_calculations_bp
from src.routes.dynamic_print_export import dynamic_print_export_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'
app.config['JWT_SECRET_KEY'] = 'jwt-secret-string-change-this-in-production'

# Enable CORS for all routes
CORS(app)

# Initialize JWT
jwt = JWTManager(app)

app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(units_bp, url_prefix='/api/units')
app.register_blueprint(sales_bp, url_prefix='/api/sales')
app.register_blueprint(expenses_bp, url_prefix='/api/expenses')
app.register_blueprint(rentals_bp, url_prefix='/api/rentals')
app.register_blueprint(finishing_works_bp, url_prefix='/api/finishing_works')
app.register_blueprint(settings_bp, url_prefix='/api/settings')
app.register_blueprint(reports_bp, url_prefix='/api/reports')
app.register_blueprint(print_export_bp, url_prefix='/api/print_export')
app.register_blueprint(dynamic_calculations_bp, url_prefix='/api/dynamic')
app.register_blueprint(dynamic_print_export_bp, url_prefix='/api/print')

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

with app.app_context():
    db.create_all()
    
    # Initialize default data
    from src.services.init_service import initialize_default_data
    initialize_default_data()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)



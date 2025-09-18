import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.models.auth import db, User
from flask import Flask

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'mysql+pymysql://acc_user:acc_pass@db:3306/acc_db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

def reset_password(username, new_password):
    with app.app_context():
        user = User.query.filter_by(username=username).first()
        if not user:
            print(f"User '{username}' not found.")
            return
        user.set_password(new_password)
        db.session.commit()
        print(f"Password for user '{username}' has been reset.")

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("Usage: python reset_password.py <username> <new_password>")
    else:
        reset_password(sys.argv[1], sys.argv[2])

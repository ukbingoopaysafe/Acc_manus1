import requests

def test_login():
    url = "http://localhost:5000/api/auth/login"
    payload = {
        "username": "admin",
        "password": "admin123"
    }
    headers = {
        "Content-Type": "application/json"
    }
    response = requests.post(url, json=payload, headers=headers)
    print("Status Code:", response.status_code)
    print("Response JSON:", response.json())

if __name__ == "__main__":
    test_login()

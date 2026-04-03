import requests
import json
import time

url = "http://localhost:8000/api/auth/register"
email = f"test_{int(time.time())}@example.com"
payload = {
    "name": "Test User",
    "email": email,
    "password": "password123",
    "role": "employee"
}
headers = {
    "Content-Type": "application/json"
}

try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    print("Response Body:")
    print(response.text)
except Exception as e:
    print(f"Error: {e}")

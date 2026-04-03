import urllib.request
import urllib.error
import time
import json

URL = "http://127.0.0.1:8000/"

print(f"Testing backend connectivity at {URL}...")
try:
    start_time = time.time()
    with urllib.request.urlopen(URL, timeout=5) as response:
        end_time = time.time()
        print(f"Response Status Code: {response.status}")
        print(f"Response Body: {response.read().decode('utf-8')}")
        print(f"Response Time: {end_time - start_time:.4f} seconds")
except urllib.error.URLError as e:
    print(f"ERROR: {e}")
except Exception as e:
    print(f"ERROR: {e}")

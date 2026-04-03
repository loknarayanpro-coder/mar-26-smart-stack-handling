import os

cfg_path = r'C:\Program Files\MongoDB\Server\8.2\bin\mongod.cfg'
try:
    with open(cfg_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'cacheSizeGB:' not in content and 'wiredTiger:' not in content:
        new_content = content.replace(
            "  dbPath: C:\\Program Files\\MongoDB\\Server\\8.2\\data", 
            "  dbPath: C:\\Program Files\\MongoDB\\Server\\8.2\\data\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 0.25"
        )
        
        with open(cfg_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Successfully updated mongod.cfg")
    else:
        print("Config already contains wiredTiger cache settings")
        print(content)
        
except PermissionError:
    print("Permission Denied: Could not write to mongod.cfg")
except Exception as e:
    print(f"Error: {e}")

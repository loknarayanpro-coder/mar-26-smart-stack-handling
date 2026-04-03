import json

try:
    with open(r'C:\Program Files\MongoDB\Server\8.2\log\mongod.log', 'r', encoding='utf-8') as f:
        lines = f.readlines()[-30:]
    for l in lines:
        try:
            data = json.loads(l)
            if data.get('s') == 'F':
                print(f"FATAL: {data.get('msg')}")
                if 'attr' in data and 'error' in data['attr']:
                    print(f"ERROR ATTR: {data['attr']['error']}")
                elif 'attr' in data and 'message' in data['attr']:
                    print(f"MESSAGE ATTR: {data['attr']['message']}")
                else:
                    print(f"ATTRS: {data.get('attr')}")
        except Exception:
            pass
except Exception as e:
    print(f"Script Error: {e}")

from pathlib import Path
path = Path('src/features/auth/profile/Profile.tsx')
raw = path.read_bytes()
print('bad count before', raw.count(bytes([92, 33])))
raw = raw.replace(bytes([92, 33]), b'\!')
path.write_bytes(raw)
print('bad count after', path.read_bytes().count(bytes([92, 33])))
text = path.read_text()
for i, line in enumerate(text.splitlines(), 1):
    if 'if (\!userId)' in line or 'if (\!profileData)' in line:
        print(i, repr(line))

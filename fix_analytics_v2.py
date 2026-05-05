import sys

path = r'd:\antigravity\BB-Revised\bb-revised-app\src\app\owner\analytics\page.tsx'

with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

updated = False
for i, line in enumerate(lines):
    if "{ key: 'tenants'," in line:
        lines[i] = "                    { key: 'tenants', label: 'Leaderboard', icon: Award },\n"
        updated = True
        break

if updated:
    with open(path, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print("Leaderboard tab updated successfully")
else:
    print("Could not find the tenants tab line")

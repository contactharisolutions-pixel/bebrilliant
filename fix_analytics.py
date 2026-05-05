import sys
import os

path = r'd:\antigravity\BB-Revised\bb-revised-app\src\app\owner\analytics\page.tsx'

try:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix the remaining garbled tab
    content = content.replace(
        "{ key: 'tenants', label: 'ðŸ « Tenant Leaderboard' },",
        "{ key: 'tenants', label: 'Leaderboard', icon: Award },"
    )
    
    # Fix the button rendering to show icons
    old_button = 'onClick={() => setActiveTab(t.key)} style={tabSt(t.key)}>{t.label}</button>'
    new_button = 'onClick={() => setActiveTab(t.key)} style={tabSt(t.key)}><div style={{ display: \'flex\', alignItems: \'center\', gap: 8 }}><t.icon size={16} />{t.label}</div></button>'
    
    if old_button in content:
        content = content.replace(old_button, new_button)
        print("Updated button rendering")
    else:
        print("Could not find button rendering")
        
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("File updated successfully")

except Exception as e:
    print(f"Error: {e}")

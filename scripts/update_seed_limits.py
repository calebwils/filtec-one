import re

path = '/Users/mac/Desktop/filtec-One/src/data/initialSeed.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. In INITIAL_DEALERS, replace creditLimit: 300000 with creditLimit: 0
content = content.replace("creditLimit: 300000,", "creditLimit: 0,")

# 2. In INITIAL_EMPLOYEES, clear any preassigned dealer IDs
content = re.sub(r"assignedDealerIds:\s*\[[^\]]*\]", "assignedDealerIds: []", content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Successfully updated initialSeed.ts: creditLimit set to 0, assignedDealerIds cleared!")

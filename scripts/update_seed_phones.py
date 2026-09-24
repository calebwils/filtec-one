import re

path = '/Users/mac/Desktop/filtec-One/src/data/initialSeed.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = "export const INITIAL_DEALERS: Dealer[] = ["
end_marker = "export const INITIAL_PLUMBERS: Plumber[] = [];"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker, start_idx)

if start_idx == -1 or end_idx == -1:
    print(f"Could not find boundaries! start={start_idx}, end={end_idx}")
    exit(1)

dealers_chunk = content[start_idx:end_idx]

def replace_phone(match):
    prefix = match.group(1)
    val = match.group(2).strip()
    val = re.sub(r'^\+91[\s-]*', '', val)
    val = re.sub(r'^91(?=\d{10})', '', val).strip()
    if val and val != '-':
        new_val = f"+91 {val}"
    else:
        new_val = val
    return f"{prefix}'{new_val}'"

updated_dealers_chunk = re.sub(r"(phone:\s*)['\"]([^'\"]*)['\"]", replace_phone, dealers_chunk)

new_content = content[:start_idx] + updated_dealers_chunk + content[end_idx:]

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("✅ Successfully updated INITIAL_DEALERS in initialSeed.ts with +91 prefix!")

import re

with open('templates/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract styles
style_match = re.search(r'<style>(.*?)</style>', content, flags=re.DOTALL)
if style_match:
    with open('static/css/style.css', 'w', encoding='utf-8') as f:
        f.write(style_match.group(1).strip())
    # Replace style with link tag
    content = content.replace(style_match.group(0), '<link rel="stylesheet" href="{{ url_for(\'static\', filename=\'css/style.css\') }}">')

# Extract scripts
script_match = re.search(r'<script>(.*?)</script>', content, flags=re.DOTALL)
if script_match:
    with open('static/js/script.js', 'w', encoding='utf-8') as f:
        f.write(script_match.group(1).strip())
    # Replace script with script src tag
    content = content.replace(script_match.group(0), '<script src="{{ url_for(\'static\', filename=\'js/script.js\') }}"></script>')

with open('templates/index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Extraction complete.")

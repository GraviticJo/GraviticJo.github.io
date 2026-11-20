from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import re

html = Path('index.html').read_text(encoding='utf-8-sig')
files = ['index.html', '_redirects', 'robots.txt', 'sitemap.xml', 'public/css/editorial.css', 'public/js/editorial.js', 'package.json', 'scripts/preview.mjs', 'scripts/check-site.mjs', 'scripts/package.py', 'scripts/extract-brand.py', 'README.md']
files += re.findall(r'(?:src|href|srcset)="\./(public/[^"?#]+)(?:[?#][^"]*)?"', html)
Path('output').mkdir(exist_ok=True)
with ZipFile('output/GRAIVITIC-design-source.zip', 'w', ZIP_DEFLATED) as archive:
    for file in sorted(set(files)):
        archive.write(file, file)
print('Packaged', len(set(files)), 'website files')

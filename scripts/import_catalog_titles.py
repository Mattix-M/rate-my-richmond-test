"""Import title headings from Richmond's public two-column catalog PDF.

Run with the bundled Python (pdfplumber): PDF_PATH CSV_EXPORT_PATH.
The CSV validates exact code membership. Never infer subject-code aliases.
This snapshot feeds course search only; the published URdle pool stays frozen.
"""
import collections
import csv
import json
import pathlib
import re
import sys
import pdfplumber

ROOT = pathlib.Path(__file__).resolve().parents[1]
PDF_URL = 'https://coursedog-pdfs-public-prod.s3.us-east-2.amazonaws.com/richmond_ethos/catalog/3626346e-7b94-4d69-be30-04b13962e1fc-richmond_ethos-catalog-1786131180083.pdf'

def extract(pdf_path, csv_path):
    with open(csv_path, encoding='utf-8-sig', newline='') as source:
        codes = {r['Subject code'] + r['Course Number'] for r in csv.DictReader(source)}
    found = collections.defaultdict(list)
    with pdfplumber.open(pdf_path) as pdf:
        for number, page in enumerate(pdf.pages, 1):
            if number < 396:
                page.close()
                continue
            for right in [False, True]:
                # Heading font, rather than text reading order, separates titles
                # from descriptions and from the neighboring column.
                heading = page.filter(lambda c: c.get('object_type') == 'char'
                    and 12.1 < c.get('size', 0) < 12.4
                    and 'Bold' in c.get('fontname', '')
                    and ((c['x0'] >= page.width / 2) == right)).extract_text() or ''
                matches = list(re.finditer(r'\b([A-Z]{2,5}\d{3,4}[A-Z]?)\s*-\s*', heading))
                for i, match in enumerate(matches):
                    code = match.group(1)
                    title = ' '.join(heading[match.end():matches[i + 1].start() if i + 1 < len(matches) else None].split())
                    if code in codes and title:
                        assert len(title) <= 180 and 'Subject code' not in title, (code, title)
                        found[code].append({'title': title, 'pdfPage': number})
            page.close()
    entries = {}
    for code, versions in found.items():
        titles = sorted(set(v['title'] for v in versions))
        entries[code] = {'titles': titles, 'pdfPages': sorted(set(v['pdfPage'] for v in versions))}
    assert len(entries) >= 1500, 'Unexpectedly incomplete catalog extraction'
    return {'meta': {'sourceUrl': PDF_URL, 'catalogUrl': 'https://catalog.richmond.edu/courses/',
        'catalogPublished': '2026-08-07', 'importedAt': '2026-10-19', 'courseCount': len(entries),
        'note': 'Exact code matches only. Catalog names may differ from historical review labels.'}, 'courses': entries}

if __name__ == '__main__':
    result = extract(sys.argv[1], sys.argv[2])
    (ROOT / 'src/lib/catalog-titles.json').write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n')
    print(f"Imported {len(result['courses'])} catalog course codes; URdle pool unchanged.")

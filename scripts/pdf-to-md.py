"""Convert a study PDF into a Markdown topic for Study Hub.

Usage:  python scripts/pdf-to-md.py <file.pdf> <slug> "<title>" "<subtitle>" <emoji> <accent> "<category>"
Writes content/authored/<slug>.md and images to public/media/<slug>/.
Needs PyMuPDF (pip install pymupdf). Run it locally once; the site build only reads the .md.

Font roles are detected by size and family: the biggest serif text is the title, the next sizes are
parts (#) and sections (##), monospace runs are code, semibold runs are **bold**.
"""
import collections
import os
import re
import sys

import fitz  # PyMuPDF

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def is_mono(font):
    return 'mono' in font.lower() or 'courier' in font.lower() or 'consola' in font.lower()


def is_bold(span):
    return bool(span['flags'] & 16) or 'semib' in span['font'].lower() or 'bold' in span['font'].lower()


def main():
    pdf, slug, title, subtitle, emoji, accent, category = sys.argv[1:8]
    doc = fitz.open(pdf)
    media_dir = os.path.join(ROOT, 'public', 'media', slug)
    os.makedirs(media_dir, exist_ok=True)

    # --- learn the font roles from the whole document ---
    sizes = collections.Counter()
    for page in doc:
        for b in page.get_text('dict')['blocks']:
            for l in b.get('lines', []):
                for s in l['spans']:
                    if s['text'].strip():
                        sizes[(is_mono(s['font']), 'serif' in s['font'].lower(), round(s['size'], 1))] += len(s['text'])
    body_size = max((k for k in sizes if not k[0] and not k[1]), key=lambda k: sizes[k])[2]
    serif = sorted({k[2] for k in sizes if k[1]}, reverse=True)
    title_size, part_size, sec_size = (serif + [0, 0, 0])[:3]
    mono_sizes = sorted({k[2] for k in sizes if k[0]}, key=lambda z: -sizes[(True, False, z)])
    code_size = mono_sizes[0]
    small = min(k[2] for k in sizes)

    items = []  # (page, y, kind, payload)
    for pno, page in enumerate(doc):
        H = page.rect.height
        lines = []
        for b in page.get_text('dict')['blocks']:
            for l in b.get('lines', []):
                spans = [s for s in l['spans'] if s['text']]
                if not spans or not ''.join(s['text'] for s in spans).strip():
                    continue
                y0, y1 = l['bbox'][1], l['bbox'][3]
                if spans[0]['size'] <= small + 0.1 and (y0 < 40 or y1 > H - 40):
                    continue  # running header / footer
                lines.append({'spans': spans, 'x': l['bbox'][0], 'y': y0, 'yc': (y0 + y1) / 2, 'block': id(b)})
        # table cells: the body font at a slightly smaller size than paragraphs, laid out in columns
        table_sizes = {round(s['size'], 1) for ln in lines for s in ln['spans']} - {body_size, code_size, part_size, sec_size, title_size}
        cell_size = next((z for z in sorted(table_sizes, reverse=True) if abs(z - body_size) < 1.2 and z != body_size), None)
        cell_ys = [ln['yc'] for ln in lines if cell_size and abs(ln['spans'][0]['size'] - cell_size) < 0.05 and not is_mono(ln['spans'][0]['font'])]
        for ln in lines:
            s0 = ln['spans'][0]
            size = round(s0['size'], 1)
            text = ''.join(s['text'] for s in ln['spans'])
            serif_font = 'serif' in s0['font'].lower()
            if serif_font and abs(size - title_size) < 0.2:
                if pno > 0:
                    items.append((pno, ln['y'], 'h1', text.strip()))
                continue
            if serif_font and abs(size - part_size) < 0.2:
                items.append((pno, ln['y'], 'h1', text.strip()))
            elif serif_font and abs(size - sec_size) < 0.2:
                items.append((pno, ln['y'], 'h2', text.strip()))
            elif any(abs(ln['yc'] - y) < 3 for y in cell_ys):
                items.append((pno, ln['y'], 'cell', (ln['x'], pno * 10000 + ln['yc'], fmt_inline(ln['spans'], body_size, code_size))))
            elif all(is_mono(s['font']) for s in ln['spans']) and abs(size - code_size) < 0.15:
                items.append((pno, ln['y'], 'code', text.rstrip()))
            elif all(is_mono(s['font']) for s in ln['spans']):
                items.append((pno, ln['y'], 'pic', text.rstrip()))
            elif size < body_size - 1.5:
                items.append((pno, ln['y'], 'cap', text.strip()))
            else:
                items.append((pno, ln['y'], 'p', (ln['y'], size, fmt_inline(ln['spans'], body_size, code_size))))
        # images, placed where they sit on the page
        for i, info in enumerate(page.get_images(full=True)):
            xref = info[0]
            rects = page.get_image_rects(xref)
            pix = fitz.Pixmap(doc, xref)
            if pix.n - pix.alpha >= 4:
                pix = fitz.Pixmap(fitz.csRGB, pix)
            name = f'p{pno + 1}-{i + 1}.png'
            pix.save(os.path.join(media_dir, name))
            items.append((pno, rects[0].y0 if rects else 0, 'img', f'/media/{slug}/{name}'))
    items.sort(key=lambda t: (t[0], t[1]))

    # --- emit markdown ---
    out = [f'---\nslug: {slug}\ntitle: {title}\nsubtitle: {subtitle}\nemoji: {emoji}\naccent: {accent}\ncategory: {category}\ncards: all\n---\n']
    i = 0
    last_header = None
    while i < len(items):
        _, _, kind, val = items[i]
        if kind in ('h1', 'h2'):
            # headings can wrap onto two lines
            text = val
            while i + 1 < len(items) and items[i + 1][2] == kind and items[i + 1][0] == items[i][0] and items[i + 1][1] - items[i][1] < 22:
                i += 1
                text += ' ' + items[i][3]
            out.append(('# ' if kind == 'h1' else '## ') + re.sub(r'\s+', ' ', text) + '\n')
            i += 1
        elif kind in ('code', 'pic'):
            buf = []
            while i < len(items) and items[i][2] == kind:
                buf.append(items[i][3])
                i += 1
            lang = 'csharp' if kind == 'code' and re.search(r'[;{}]|=>', '\n'.join(buf)) else 'text'
            body = dedent(buf)
            out.append(f'```{lang}\n{body}\n```\n')
        elif kind == 'img':
            out.append(f'![diagram]({val})\n')
            i += 1
        elif kind == 'cell':
            cells = []
            while i < len(items) and items[i][2] == 'cell':
                cells.append(items[i][3])
                i += 1
            table, header = to_table(cells)
            if table:
                if header == last_header:
                    table = table.split('\n', 2)[2]  # repeated header on a new page: continue the previous table
                    if out and out[-1].startswith('|'):
                        out[-1] = out[-1].rstrip('\n') + '\n' + table + '\n'
                        continue
                last_header = header
                out.append(table + '\n')
        elif kind == 'cap':
            out.append(f'*{val}*\n')
            i += 1
        else:
            text = val[2]
            i += 1
            while i < len(items) and items[i][2] == 'p':
                prev, nxt = items[i - 1], items[i]
                same_page = nxt[0] == prev[0]
                gap = nxt[3][0] - prev[3][0]
                starts_new = re.match(r'^\s*(\d+\.\s|[•\-–]\s|\*\*[A-Z][^*]{0,40}:\*\*)', nxt[3][2])
                if starts_new and not text.rstrip().endswith(('the', 'a', 'and', 'of', ',')):
                    break
                if same_page and 0 < gap < prev[3][1] * 1.75:
                    pass
                elif not same_page and not re.search(r'[.:!?)]\s*$', text):
                    pass
                else:
                    break
                text = join_wrapped(text, nxt[3][2])
                i += 1
            if re.match(r'^\w{3} \d{1,2}, \d{4}', text):
                continue
            text = text.strip()
            if re.match(r'^[•\-–]\s', text):
                text = '- ' + text[2:].strip()
            out.append(text + '\n')
    md = '\n'.join(out)
    md = re.sub(r'\*\*\s*\*\*', '', md)
    md = re.sub(r'^\*?\w{3} \d{1,2}, \d{4}.*$', '', md, flags=re.M)   # date / author line
    md = re.sub(r'`\s+([.,;:)])', r'`\1', md)                          # "`x` ." -> "`x`."
    md = re.sub(r'`  \(', '` (', md)
    md = re.sub(r'\n{3,}', '\n\n', md)
    dest = os.path.join(ROOT, 'content', 'authored', f'{slug}.md')
    with open(dest, 'w', encoding='utf-8') as f:
        f.write(md)
    print('wrote', dest, len(md), 'chars;', sum(1 for l in md.splitlines() if l.startswith('## ')), 'sections')


def fmt_inline(spans, body_size, code_size):
    out = ''
    for s in spans:
        t = s['text']
        if not t.strip():
            out += t
            continue
        lead = t[: len(t) - len(t.lstrip())]
        trail = t[len(t.rstrip()):]
        core = t.strip()
        if is_mono(s['font']):
            core = '`' + core.replace('`', "'") + '`'
        elif is_bold(s):
            core = '**' + core + '**'
        out += lead + core + trail
    return out.replace('`` ', '').replace('****', '')


def join_wrapped(a, b):
    a = a.rstrip()
    if a.endswith('-') and not a.endswith(' -'):
        return a[:-1] + b.lstrip()
    return a + ' ' + b.lstrip()


def dedent(lines):
    ind = [len(l) - len(l.lstrip(' ')) for l in lines if l.strip()]
    m = min(ind) if ind else 0
    return '\n'.join(l[m:] for l in lines)


def to_table(cells):
    rows = []
    for x, yc, text in sorted(cells, key=lambda c: (round(c[1]), c[0])):
        if rows and abs(rows[-1]['y'] - yc) < 3:
            rows[-1]['cells'].append((x, text))
        else:
            rows.append({'y': yc, 'cells': [(x, text)]})
    if len(rows) < 2:
        return None, None
    cols = sorted(x for x, _ in rows[0]['cells'])
    grid = []
    for r in rows:
        line = [''] * len(cols)
        for x, text in r['cells']:
            k = max([j for j, cx in enumerate(cols) if cx <= x + 4] or [0])
            line[k] = (line[k] + ' ' + text).strip()
        if grid and not line[0] and any(line):  # wrapped cell text continues the previous row
            grid[-1] = [(a + ' ' + b).strip() for a, b in zip(grid[-1], line)]
        elif grid and line[0] and len(cols) > 1 and not any(line[1:]) and not re.match(r'^\d', line[0]) and re.match(r'^\d', grid[-1][0] or ''):
            grid[-1][1] = (grid[-1][1] + ' ' + line[0]).strip()
        else:
            grid.append(line)
    esc = lambda s: s.replace('|', '\\|')
    header = tuple(grid[0])
    md = '| ' + ' | '.join(esc(c) for c in grid[0]) + ' |\n|' + '---|' * len(cols) + '\n'
    md += '\n'.join('| ' + ' | '.join(esc(c) for c in r) + ' |' for r in grid[1:])
    return md, header


if __name__ == '__main__':
    main()

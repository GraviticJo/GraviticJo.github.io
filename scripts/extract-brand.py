"""Extract the unchanged vector signature from the supplied brand manual."""
from pathlib import Path
from pypdf import PdfReader
from pypdf.generic import ContentStream

reader = PdfReader(r'C:\Users\MCC\Downloads\GRAIVITIC_Editorial_Brand_Guidelines_v2.pdf')
form = reader.pages[6]['/Resources']['/XObject']['/x9']['/Resources']['/XObject']['/x14']
stream = ContentStream(form, reader)
paths, commands, color = [], [], '#ffffff'
for operands, op in stream.operations:
    values = ' '.join(str(v) for v in operands)
    if op == b'rg':
        color = '#' + ''.join(f'{round(float(v)*255):02x}' for v in operands)
    elif op in (b'm', b'l', b'c'):
        commands.append(op.decode().upper() + values)
    elif op == b'h':
        commands.append('Z')
    elif op in (b'f', b'f*'):
        paths.append(f'<path fill="{color}" d="{" ".join(commands)}"/>')
        commands = []
    elif op not in (b'q', b'Q', b'gs'):
        raise ValueError(f'Unsupported operator: {op}')
Path('public/brand/editorial-logo.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="138 279 904 214">'+''.join(paths)+'</svg>')
Path('public/brand/editorial-mark.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="138 279 211 214">'+''.join(paths)+'</svg>')

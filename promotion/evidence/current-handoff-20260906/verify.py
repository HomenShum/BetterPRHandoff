"""Verify this finite packet and optional effective source bytes; no runtime calls."""
from pathlib import Path, PurePosixPath
import argparse
import hashlib
import json
import re
import stat
import sys


def checked(root, relative):
    if not isinstance(relative, str) or '\\' in relative or ':' in relative:
        raise ValueError('Nonportable relative path')
    parts = relative.split('/')
    if any(not p or p in ('.', '..') or p.endswith((' ', '.')) or
           re.match(r'(?i)^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)', p) or
           any(ord(c) < 32 for c in p) for p in parts):
        raise ValueError('Unsafe path component')
    if PurePosixPath(relative).is_absolute():
        raise ValueError('Absolute path')
    target = root.joinpath(*parts)
    for node in [target, *target.parents]:
        info = node.lstat()
        if stat.S_ISLNK(info.st_mode) or getattr(info, 'st_file_attributes', 0) & 0x400:
            raise ValueError('Linked or reparse path')
    if not target.is_file():
        raise ValueError('Not a regular file')
    target.resolve().relative_to(root.resolve())
    return target


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def check_rows(root, rows, canonical_source=False):
    seen = set()
    for row in rows:
        name = row['path']
        if name.casefold() in seen:
            raise ValueError('Duplicate path')
        seen.add(name.casefold())
        raw = checked(root, name).read_bytes()
        expected = row
        if canonical_source:
            mode = row['canonicalization']
            if mode == 'crlf-to-lf':
                raw = raw.replace(b'\r\n', b'\n')
            elif mode != 'identity':
                raise ValueError('Unknown source canonicalization')
            expected = {'bytes': row['canonicalBytes'],
                        'sha256': row['canonicalSha256'],
                        'rawGitBlob': row['canonicalGitBlob']}
        if len(raw) != expected['bytes'] or digest(raw) != expected['sha256']:
            raise ValueError('Byte mismatch: ' + name)
        git_blob = hashlib.sha1(b'blob ' + str(len(raw)).encode('ascii') + b'\0' + raw).hexdigest()
        if git_blob != expected['rawGitBlob']:
            raise ValueError('Raw Git blob mismatch: ' + name)
    return len(seen)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-root', type=Path)
    args = parser.parse_args()
    packet = Path(__file__).absolute().parent
    manifest = json.loads(checked(packet, 'manifest.json').read_text(encoding='utf-8'))
    count = check_rows(packet, manifest['files'])
    physical = set()
    directories = [packet]
    while directories:
        directory = directories.pop()
        for path in directory.iterdir():
            info = path.lstat()
            if stat.S_ISLNK(info.st_mode) or getattr(info, 'st_file_attributes', 0) & 0x400:
                raise ValueError('Linked packet entry')
            if path.is_dir():
                directories.append(path)
            elif path.is_file():
                physical.add(path.relative_to(packet).as_posix())
    if physical != {x['path'] for x in manifest['files']} | {'manifest.json'}:
        raise ValueError('Packet file set differs from manifest')
    copies = json.loads(checked(packet, 'raw-copy-map.json').read_text(encoding='utf-8'))['files']
    check_rows(packet, [{**x, 'path': x['destination']} for x in copies])
    sources = 0
    if args.source_root is not None:
        bindings = json.loads(checked(packet, 'source-bindings.json').read_text(encoding='utf-8'))
        sources = check_rows(args.source_root.absolute(), bindings['files'], canonical_source=True)
    print(json.dumps({'status': 'PASS_RAW_BYTES', 'packetPayloads': count,
                      'exactRawCopies': len(copies), 'effectiveSourceFiles': sources,
                      'sourceNormalization': 'Proven per-row CRLF-to-LF or strict identity' if args.source_root else None,
                      'runtimeReplay': False, 'gitIndexOrFilterCheck': False}))


if __name__ == '__main__':
    try:
        main()
    except (OSError, ValueError, KeyError, TypeError) as error:
        print('FAIL: ' + str(error), file=sys.stderr)
        sys.exit(1)

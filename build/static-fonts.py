# Copyright (c) 2026 Sidero Labs, Inc.
#
# Cuts a variable font into one static, autohinted woff2 per weight and
# subset. Called by build/fetch-fonts.mjs for Manrope; it reads a job on stdin
# and prints what it wrote on stdout, both JSON.
#
# Google Fonts serves Manrope variable and unhinted. macOS ignores hinting, so
# on a Retina screen that costs nothing. On a 1x screen it costs a lot: Linux
# Chromium rounds the variable font's advances unevenly, so letter spacing
# wobbles and some word spaces close up, and on Windows the stems blur across
# two pixels. A static instance fixes the spacing and ttfautohint fixes the
# stems. The price is size, roughly 22 kB per weight for latin against 24 kB for
# all four weights in the variable file, of which a page fetches only the
# weights it uses.
#
# Maintainers only: pip install -r build/requirements.txt

import io
import json
import sys

import ttfautohint
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont


def codepoints(unicode_range):
    """`U+0000-00FF, U+0131` to the list of code points it covers."""
    out = []
    for part in unicode_range.split(','):
        lo, _, hi = part.strip().removeprefix('U+').partition('-')
        out.extend(range(int(lo, 16), int(hi or lo, 16) + 1))
    return out


def woff2(ttf, unicode_range):
    font = TTFont(io.BytesIO(ttf))
    options = subset.Options()
    options.flavor = 'woff2'
    # The point of the exercise. The subsetter drops instructions by default.
    options.hinting = True
    options.layout_features = ['*']
    options.name_IDs = ['*']
    options.notdef_outline = True
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=codepoints(unicode_range))
    subsetter.subset(font)
    out = io.BytesIO()
    subset.save_font(font, out, options)
    return out.getvalue()


def main():
    job = json.load(sys.stdin)
    written = []

    for weight in job['weights']:
        static = instantiateVariableFont(TTFont(job['source']), {'wght': weight}, updateFontNames=True)
        buf = io.BytesIO()
        static.save(buf)
        hinted = ttfautohint.ttfautohint(in_buffer=buf.getvalue())

        for face in job['subsets']:
            file = f"{job['slug']}-{face['subset']}-{weight}.woff2"
            data = woff2(hinted, face['unicodeRange'])
            with open(f"{job['out']}/{file}", 'wb') as fh:
                fh.write(data)
            written.append({'file': file, 'subset': face['subset'], 'weight': str(weight), 'bytes': len(data)})

    json.dump(written, sys.stdout)


if __name__ == '__main__':
    main()

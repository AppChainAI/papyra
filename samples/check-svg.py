"""Consumer-visible safety and preservation checks for the SVG generation helper."""
from pathlib import Path
import importlib.util
import unittest
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('papyra_svg', ROOT.parent / 'skills/papyra/scripts/prepare_svg.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class StaticSvg(unittest.TestCase):
    def test_two_figures_keep_local_references_and_text(self):
        source = (ROOT / 'assets/triangle.svg').read_text(encoding='utf-8')
        originals = ET.fromstring(source)
        copies = [ET.fromstring(module.prepare_svg(source, prefix)) for prefix in ('left', 'right')]
        identifiers = [{e.get('id') for e in copy.iter() if e.get('id')} for copy in copies]
        self.assertFalse(identifiers[0] & identifiers[1])
        for copy, ids in zip(copies, identifiers):
            self.assertEqual(list(copy.itertext()), list(originals.itertext()))
            self.assertEqual(copy.get('viewBox'), originals.get('viewBox'))
            self.assertTrue(set(copy.get('aria-labelledby').split()) <= ids)
            marker = next(e.get('marker-end') for e in copy.iter() if e.get('marker-end'))
            self.assertIn(marker[5:-1], ids)

    def test_rejects_active_external_and_ambiguous_input(self):
        bodies = [
            '<script>alert(1)</script>',
            '<rect width="1" onload="alert(1)"/>',
            '<foreignObject><div xmlns="http://www.w3.org/1999/xhtml">active</div></foreignObject>',
            '<use href="https://example.org/a.svg#x"/>',
            '<use href="data:image/svg+xml,evil"/>',
            '<rect style="fill:red"/>',
            '<rect fill="url(https://example.org/a.svg#x)"/>',
            '<rect fill="uRl(\\68ttps://example.org/x)"/>',
            '<animate attributeName="href"/>',
            '<rect id="same"/><circle id="same"/>',
            '<use href="#missing"/>',
            '<rect clip-path="url(#missing)"/>',
            '<html:script xmlns:html="http://www.w3.org/1999/xhtml"/>',
        ]
        for body in bodies:
            with self.subTest(body=body), self.assertRaises(ValueError):
                module.prepare_svg(f'<svg xmlns="{module.SVG}">{body}</svg>', 'figure')
        for source in [f'<!DOCTYPE svg [<!ENTITY a "text">]><svg xmlns="{module.SVG}">&a;</svg>',
                       f'<?xml-stylesheet href="https://example.org/x"?><svg xmlns="{module.SVG}"/>']:
            with self.subTest(source=source), self.assertRaises(ValueError):
                module.prepare_svg(source, 'figure')

    def test_preserves_internal_legacy_href(self):
        source = f'<svg xmlns="{module.SVG}" xmlns:xlink="{module.XLINK}"><defs><path id="shape" d="M0 0H10"/></defs><use xlink:href="#shape"/></svg>'
        output = ET.fromstring(module.prepare_svg(source, 'figure'))
        shape = output.find(f'.//{{{module.SVG}}}path')
        use = output.find(f'.//{{{module.SVG}}}use')
        self.assertEqual(use.get('href'), '#' + shape.get('id'))
        self.assertEqual(shape.get('d'), 'M0 0H10')


if __name__ == '__main__':
    unittest.main()

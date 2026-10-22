"""Prepare static SVG for inline embedding; reject unsupported input without data loss.

Host generation helper, not a document renderer. Uses only Python's standard library.
"""
import re
import xml.etree.ElementTree as ET

SVG = 'http://www.w3.org/2000/svg'
XLINK = 'http://www.w3.org/1999/xlink'
TAGS = frozenset('svg g defs title desc path rect circle ellipse line polyline polygon text tspan textPath clipPath mask linearGradient radialGradient stop marker pattern symbol use'.split())
ATTRS = frozenset(('id viewBox width height x y x1 y1 x2 y2 cx cy r rx ry d points dx dy '
    'fill fill-opacity fill-rule stroke stroke-width stroke-opacity stroke-linecap stroke-linejoin '
    'stroke-dasharray stroke-dashoffset stroke-miterlimit opacity transform '
    'font-family font-size font-weight font-style text-anchor dominant-baseline '
    'preserveAspectRatio clip-path clip-rule mask marker-start marker-mid marker-end '
    'gradientUnits gradientTransform spreadMethod offset stop-color stop-opacity '
    'patternUnits patternContentUnits patternTransform markerWidth markerHeight refX refY '
    'orient markerUnits href startOffset textLength lengthAdjust role aria-label aria-labelledby aria-describedby').split())
ID = re.compile(r'[A-Za-z_][A-Za-z0-9_.-]*\Z')
URL = re.compile(r'url\(\s*[\'\"]?#([A-Za-z_][A-Za-z0-9_.-]*)[\'\"]?\s*\)', re.I)


def prepare_svg(source, prefix):
    """Return namespaced static SVG with isolated IDs, or raise ValueError.

    Prefix must be unique in the output page. No stripping of rejected content:
    the caller must resolve/report unsupported input rather than silently lose it.
    """
    if not ID.fullmatch(prefix):
        raise ValueError('SVG prefix must be a valid XML ID')
    if re.search(r'<!\s*(?:DOCTYPE|ENTITY)|<\?', source, re.I):
        raise ValueError('SVG declarations, entities and processing instructions are unsupported')
    try:
        root = ET.fromstring(source)
    except ET.ParseError as error:
        raise ValueError(f'Invalid SVG XML: {error}') from error
    if root.tag != f'{{{SVG}}}svg':
        raise ValueError('Expected an SVG root with the SVG namespace')
    identifiers = {}
    for element in root.iter():
        if not isinstance(element.tag, str) or not element.tag.startswith(f'{{{SVG}}}') or element.tag[len(SVG) + 2:] not in TAGS:
            raise ValueError(f'Unsupported SVG element: {element.tag}')
        identifier = element.get('id')
        if identifier is not None:
            if not ID.fullmatch(identifier) or identifier in identifiers:
                raise ValueError(f'Invalid or duplicate SVG ID: {identifier}')
            identifiers[identifier] = f'{prefix}-{identifier}'
    def reference(identifier):
        if identifier not in identifiers:
            raise ValueError(f'Unresolved SVG reference: {identifier}')
        return identifiers[identifier]
    for element in root.iter():
        attributes = {}
        for key, value in element.attrib.items():
            if key == f'{{{XLINK}}}href':
                key = 'href'
            if key not in ATTRS or key in attributes:
                raise ValueError(f'Unsupported SVG attribute: {key}')
            if key == 'id':
                value = identifiers[value]
            elif key == 'href':
                if not value.startswith('#'):
                    raise ValueError('SVG links must reference an internal fragment')
                value = '#' + reference(value[1:])
            elif key in ('aria-labelledby', 'aria-describedby'):
                value = ' '.join(reference(part) for part in value.split())
            else:
                value = URL.sub(lambda match: f'url(#{reference(match[1])})', value)
                # Only local paint/clip references are accepted; no CSS escapes or active expressions.
                remainder = URL.sub('', value)
                if re.search(r'url\s*\(|[\\@<>]|(?:javascript|expression)\s*:', remainder, re.I):
                    raise ValueError(f'Unsupported SVG attribute value: {key}')
            attributes[key] = value
        element.attrib.clear()
        element.attrib.update(attributes)
    ET.register_namespace('', SVG)
    return ET.tostring(root, encoding='unicode')

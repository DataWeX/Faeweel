#!/usr/bin/env python3
"""Generate the browser-shell stylesheet from its structured XML source."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path
from xml.etree import ElementTree


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/workspace/xml/shell.xml"
OUTPUT = ROOT / "public/workspace/css/shell.css"
PROPERTY_NAME = re.compile(r"(?:--|-)?[a-z][a-z0-9-]*\Z")
MEDIA_QUERY = re.compile(r"[a-zA-Z0-9_(),:\s.-]+\Z")


class SourceError(ValueError):
    pass


def _only_attributes(element: ElementTree.Element, expected: set[str]) -> None:
    if set(element.attrib) != expected:
        raise SourceError(f"<{element.tag}> has invalid attributes")


def _no_text(element: ElementTree.Element) -> None:
    if element.text and element.text.strip():
        raise SourceError(f"<{element.tag}> does not allow text")
    for child in element:
        if child.tail and child.tail.strip():
            raise SourceError(f"<{element.tag}> does not allow text")


def _safe_field(value: str, label: str) -> None:
    if not value or any(ord(char) < 32 or char in "{};<>" for char in value):
        raise SourceError(f"invalid {label}")


def _read_rules(parent: ElementTree.Element) -> list[tuple[str, list[tuple[str, str]]]]:
    rules = []
    for rule in parent:
        if rule.tag != "rule":
            raise SourceError(f"unexpected <{rule.tag}> in stylesheet group")
        _only_attributes(rule, {"selector"})
        _no_text(rule)
        selector = rule.attrib["selector"]
        if not selector or any(ord(char) < 32 or char in "{};<>" for char in selector if char != ">"):
            raise SourceError("invalid selector")
        if not re.fullmatch(r'[a-zA-Z0-9_#.*+~>|=^$()\[\]"\' :,-]+', selector):
            raise SourceError("selector contains unsupported characters")
        declarations = []
        if len(rule) == 0:
            raise SourceError("rules must contain at least one property")
        for prop in rule:
            if prop.tag != "property":
                raise SourceError(f"unexpected <{prop.tag}> in rule")
            _only_attributes(prop, {"name", "value"})
            if len(prop) or (prop.text and prop.text.strip()):
                raise SourceError("<property> must be empty")
            name, value = prop.attrib["name"], prop.attrib["value"]
            if not PROPERTY_NAME.fullmatch(name):
                raise SourceError("invalid property name")
            _safe_field(value, "property value")
            declarations.append((name, value.strip()))
        rules.append((selector, declarations))
    return rules


def load_stylesheet(path: Path) -> list[tuple[str | None, list[tuple[str, list[tuple[str, str]]]]]]:
    try:
        data = path.read_bytes()
    except OSError as error:
        raise SourceError(f"cannot read source: {error}") from error
    try:
        text = data.decode("utf-8-sig")
    except UnicodeDecodeError as error:
        raise SourceError("source must be UTF-8 XML") from error
    if re.search(r"<!\s*(?:DOCTYPE|ENTITY)\b", text, re.IGNORECASE):
        raise SourceError("DOCTYPE and entity declarations are not allowed")
    try:
        root = ElementTree.fromstring(data)
    except ElementTree.ParseError as error:
        raise SourceError(f"invalid XML: {error}") from error
    if root.tag != "stylesheet":
        raise SourceError("root element must be <stylesheet>")
    _only_attributes(root, set())
    _no_text(root)
    groups = []
    for child in root:
        if child.tag == "rule":
            groups.append((None, _read_rules([child])))
        elif child.tag == "media":
            _only_attributes(child, {"query"})
            _no_text(child)
            query = child.attrib["query"]
            _safe_field(query, "media query")
            if not MEDIA_QUERY.fullmatch(query):
                raise SourceError("media query contains unsupported characters")
            rules = _read_rules(child)
            if not rules:
                raise SourceError("media groups must contain at least one rule")
            groups.append((query, rules))
        else:
            raise SourceError(f"unexpected <{child.tag}> in stylesheet")
    if not groups:
        raise SourceError("stylesheet must contain at least one rule")
    return groups


def render(groups: list[tuple[str | None, list[tuple[str, list[tuple[str, str]]]]]]) -> str:
    lines = []
    for query, rules in groups:
        if query is not None:
            lines.extend((f"@media {query} {{",))
        indent = "  " if query is not None else ""
        for selector, declarations in rules:
            lines.append(f"{indent}{selector} {{")
            lines.extend(f"{indent}  {name}: {value};" for name, value in declarations)
            lines.append(f"{indent}}}")
            lines.append("")
        if query is not None:
            lines.append("}")
            lines.append("")
    while lines and lines[-1] == "":
        lines.pop()
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="fail if generated CSS is stale")
    parser.add_argument("--input", type=Path, default=SOURCE, help="XML source path")
    parser.add_argument("--output", type=Path, default=OUTPUT, help="generated CSS path")
    args = parser.parse_args()
    try:
        css = render(load_stylesheet(args.input))
    except SourceError as error:
        print(f"shell stylesheet: {error}", file=sys.stderr)
        return 1
    if args.check:
        try:
            current = args.output.read_text(encoding="utf-8")
        except OSError as error:
            print(f"shell stylesheet: cannot read generated CSS: {error}", file=sys.stderr)
            return 1
        if current != css:
            print("shell stylesheet: generated CSS is out of date", file=sys.stderr)
            return 1
        return 0
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(css, encoding="utf-8", newline="\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

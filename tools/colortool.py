"""OKLCH <-> sRGB, WCAG contrast and APCA Lc, for designing a rung before it goes in.

Usage: python3 tools/colortool.py BACKGROUND HEX [HEX ...]
Prints each color's OKLCH, its WCAG ratio and its APCA Lc against the background.
OKLab matrices are Ottosson's; the APCA constants are APCA-W3 0.1.9 (SAPC).
"""

from __future__ import annotations

import argparse
import math
import sys
from typing import NamedTuple

Vec3 = tuple[float, float, float]

_GAMUT_SLACK = 0.0005  # how far outside [0, 1] a linear channel may sit and still count as in gamut
_GAMUT_STEPS = 30  # bisection steps when an out-of-gamut color is pulled in by its chroma


class Oklch(NamedTuple):
    lightness: float
    chroma: float
    hue: float  # degrees, 0 to 360


def srgb_to_linear(channel: float) -> float:
    return channel / 12.92 if channel <= 0.04045 else ((channel + 0.055) / 1.055) ** 2.4


def linear_to_srgb(channel: float) -> float:
    channel = max(0.0, min(1.0, channel))
    return 12.92 * channel if channel <= 0.0031308 else 1.055 * channel ** (1 / 2.4) - 0.055


def hex_to_rgb(hex_: str) -> Vec3:
    digits = hex_.lstrip("#")
    return (int(digits[0:2], 16) / 255, int(digits[2:4], 16) / 255, int(digits[4:6], 16) / 255)


def rgb_to_hex(rgb: Vec3) -> str:
    r, g, b = (round(max(0.0, min(1.0, channel)) * 255) for channel in rgb)
    return f"#{r:02X}{g:02X}{b:02X}"


def linear_to_oklab(rgb: Vec3) -> Vec3:
    r, g, b = rgb
    l_ = (0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b) ** (1 / 3)
    m_ = (0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b) ** (1 / 3)
    s_ = (0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b) ** (1 / 3)
    return (
        0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
        1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
        0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
    )


def oklab_to_linear(lab: Vec3) -> Vec3:
    lightness, a, b = lab
    l_ = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3
    m_ = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3
    s_ = (lightness - 0.0894841775 * a - 1.2914855480 * b) ** 3
    return (
        4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
        -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
        -0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_,
    )


def hex_to_oklch(hex_: str) -> Oklch:
    r, g, b = hex_to_rgb(hex_)
    lightness, a, b_ = linear_to_oklab((srgb_to_linear(r), srgb_to_linear(g), srgb_to_linear(b)))
    return Oklch(lightness, math.hypot(a, b_), (math.degrees(math.atan2(b_, a)) + 360) % 360)


def _in_gamut(rgb: Vec3) -> bool:
    return all(-_GAMUT_SLACK <= channel <= 1 + _GAMUT_SLACK for channel in rgb)


def _oklch_to_linear(color: Oklch) -> Vec3:
    angle = math.radians(color.hue)
    return oklab_to_linear((color.lightness, color.chroma * math.cos(angle), color.chroma * math.sin(angle)))


def oklch_to_hex(color: Oklch) -> str:
    """The sRGB hex of an OKLCH color; out of gamut, the chroma is lowered at the same lightness and hue until it fits."""
    rgb = _oklch_to_linear(color)
    if not _in_gamut(rgb):
        low, high = 0.0, color.chroma
        for _ in range(_GAMUT_STEPS):
            mid = (low + high) / 2
            if _in_gamut(_oklch_to_linear(color._replace(chroma=mid))):
                low = mid
            else:
                high = mid
        rgb = _oklch_to_linear(color._replace(chroma=low))
    r, g, b = rgb
    return rgb_to_hex((linear_to_srgb(r), linear_to_srgb(g), linear_to_srgb(b)))


def relative_luminance(hex_: str) -> float:
    r, g, b = (srgb_to_linear(channel) for channel in hex_to_rgb(hex_))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def wcag(fg: str, bg: str) -> float:
    lighter, darker = sorted((relative_luminance(fg), relative_luminance(bg)), reverse=True)
    return (lighter + 0.05) / (darker + 0.05)


def _apca_y(hex_: str) -> float:
    r, g, b = hex_to_rgb(hex_)
    y = 0.2126729 * r**2.4 + 0.7151522 * g**2.4 + 0.0721750 * b**2.4
    return y if y > 0.022 else y + (0.022 - y) ** 1.414  # the soft clamp near black


def apca(fg: str, bg: str) -> float:
    """APCA-W3 0.1.9 Lc: positive is dark text on light, negative is light text on dark."""
    y_text, y_ground = _apca_y(fg), _apca_y(bg)
    if abs(y_ground - y_text) < 0.0005:
        return 0.0
    if y_ground > y_text:
        sapc = (y_ground**0.56 - y_text**0.57) * 1.14
        return 0.0 if sapc < 0.1 else (sapc - 0.027) * 100
    sapc = (y_ground**0.65 - y_text**0.62) * 1.14
    return 0.0 if sapc > -0.1 else (sapc + 0.027) * 100


def main() -> int:
    parser = argparse.ArgumentParser(description="Each color's OKLCH, WCAG ratio and APCA Lc against a background.")
    parser.add_argument("background", help="the background hex, e.g. '#141414'")
    parser.add_argument("colors", nargs="+", metavar="hex", help="the colors to read against it")
    args = parser.parse_args()
    background: str = args.background
    colors: list[str] = args.colors
    for hex_ in colors:
        lightness, chroma, hue = hex_to_oklch(hex_)
        print(
            f"{hex_}  L={lightness:.3f} C={chroma:.3f} H={hue:5.1f}"
            f"  WCAG {wcag(hex_, background):4.1f}:1  APCA Lc {apca(hex_, background):6.1f}"
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())

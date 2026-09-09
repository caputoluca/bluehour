"""OKLCH <-> sRGB, WCAG contrast, APCA Lc. Ottosson's OKLab matrices; APCA 0.1.9 constants (SAPC-APCA)."""
import math

def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
def linear_to_srgb(c):
    c = max(0.0, min(1.0, c))
    return 12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055
def hex_to_rgb(h):
    h = h.lstrip('#'); return tuple(int(h[i:i+2], 16) / 255 for i in (0, 2, 4))
def rgb_to_hex(r, g, b):
    return '#%02X%02X%02X' % tuple(round(max(0, min(1, x)) * 255) for x in (r, g, b))

def linear_to_oklab(r, g, b):
    l = 0.4122214708*r + 0.5363325363*g + 0.0514459929*b
    m = 0.2119034982*r + 0.6806995451*g + 0.1073969566*b
    s = 0.0883024619*r + 0.2817188376*g + 0.6299787005*b
    l, m, s = l ** (1/3), m ** (1/3), s ** (1/3)
    return (0.2104542553*l + 0.7936177850*m - 0.0040720468*s,
            1.9779984951*l - 2.4285922050*m + 0.4505937099*s,
            0.0259040371*l + 0.7827717662*m - 0.8086757660*s)
def oklab_to_linear(L, a, b):
    l = L + 0.3963377774*a + 0.2158037573*b
    m = L - 0.1055613458*a - 0.0638541728*b
    s = L - 0.0894841775*a - 1.2914855480*b
    l, m, s = l**3, m**3, s**3
    return (4.0767416621*l - 3.3077115913*m + 0.2309699292*s,
            -1.2684380046*l + 2.6097574011*m - 0.3413193965*s,
            -0.0041960863*l - 0.7034186147*m + 1.7076147010*s)

def hex_to_oklch(h):
    L, a, b = linear_to_oklab(*(srgb_to_linear(c) for c in hex_to_rgb(h)))
    C = math.hypot(a, b); H = (math.degrees(math.atan2(b, a)) + 360) % 360
    return L, C, H
def oklch_to_hex(L, C, H):
    a = C * math.cos(math.radians(H)); b = C * math.sin(math.radians(H))
    lin = oklab_to_linear(L, a, b)
    if any(x < -0.0005 or x > 1.0005 for x in lin):  # out of gamut: reduce chroma until it fits
        lo, hi = 0.0, C
        for _ in range(30):
            mid = (lo + hi) / 2
            a = mid * math.cos(math.radians(H)); b = mid * math.sin(math.radians(H))
            lin = oklab_to_linear(L, a, b)
            if all(-0.0005 <= x <= 1.0005 for x in lin): lo = mid
            else: hi = mid
        a = lo * math.cos(math.radians(H)); b = lo * math.sin(math.radians(H)); lin = oklab_to_linear(L, a, b)
    return rgb_to_hex(*(linear_to_srgb(x) for x in lin))

def rel_lum(h):
    r, g, b = (srgb_to_linear(c) for c in hex_to_rgb(h))
    return 0.2126*r + 0.7152*g + 0.0722*b
def wcag(fg, bg):
    l1, l2 = sorted((rel_lum(fg), rel_lum(bg)), reverse=True)
    return (l1 + 0.05) / (l2 + 0.05)

def apca(fg, bg):
    """APCA-W3 0.1.9 (SAPC). Returns Lc; positive = dark text on light, negative = light text on dark."""
    def y(h):
        r, g, b = hex_to_rgb(h)
        return 0.2126729*r**2.4 + 0.7151522*g**2.4 + 0.0721750*b**2.4
    def clamp(v):
        return v if v > 0.022 else v + (0.022 - v) ** 1.414
    yt, yb = clamp(y(fg)), clamp(y(bg))
    if abs(yb - yt) < 0.0005: return 0.0
    if yb > yt:
        sapc = (yb ** 0.56 - yt ** 0.57) * 1.14
        return 0.0 if sapc < 0.1 else (sapc - 0.027) * 100
    sapc = (yb ** 0.65 - yt ** 0.62) * 1.14
    return 0.0 if sapc > -0.1 else (sapc + 0.027) * 100

if __name__ == "__main__":
    import sys
    bg = sys.argv[1]
    for h in sys.argv[2:]:
        L, C, H = hex_to_oklch(h)
        print(f"{h}  L={L:.3f} C={C:.3f} H={H:5.1f}  WCAG {wcag(h, bg):4.1f}:1  APCA Lc {apca(h, bg):6.1f}")

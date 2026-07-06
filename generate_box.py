#!/usr/bin/env python3
"""Генератор раскладки коробки TORN для лазерной резки фанеры заданной толщины.

Геометрия восстановлена из korobka.cdr (раскладки 3 мм и 3,4 мм).
Все размеры в миллиметрах. Стыки выполнены с натягом для компенсации
ширины лазерного реза: шип = номинал + OVERLAP/2, паз = номинал - OVERLAP/2
(суммарный натяг OVERLAP = 0.4 мм, по 0.2 мм на сторону, как в исходнике).

Использование:
    python3 generate_box.py 3.2
    python3 generate_box.py 3.3 -o mybox.svg
    python3 generate_box.py 3.2 --overlap 0.4
"""

import argparse

P = 99.4
BIG = 52.0
SMALL = 14.0
OVERLAP = 0.4

ENGRAVE_SIZE = 91.0
ENGRAVE_R = 1.6
RECT_W, RECT_H = 99.4, 44.4

TORN_W, TORN_H, TORN_R = 98.8, 103.0, 1.3891
TORN_STRIP_Y, TORN_STRIP_H = 74.4767, 22.0232
TORN_TEXT_X, TORN_TEXT_Y = 40.4065, 79.3576
TORN_TEXT_SCALE = 25.4 / 72
TORN_TEXT_D = "m 0,0 v 6.9707 h -5.4699 v 28.381 h -9.1995 v -28.381 h -5.4699 v -6.9707 z m 23.1231,20.6633 c 0,3.5601 -0.081,5.988 -0.2487,7.4687 -0.1676,1.4805 -0.6105,3.0069 -1.4919,4.2322 -0.8814,1.2253 -2.2289,2.082 -3.7294,2.7385 -1.6525,0.6916 -3.4308,1.0308 -5.2214,0.9958 -1.7075,0.01 -3.3992,-0.3315 -4.9727,-0.9958 -1.5077,-0.6199 -2.8116,-1.4988 -3.7294,-2.7385 -0.9178,-1.2397 -1.5665,-2.5246 -1.7404,-3.9834 -0.1741,-1.4585 -0.2487,-4.0709 -0.2487,-7.7175 v -5.975 c 0,-3.56 0.081,-6.2371 0.2487,-7.7176 0.1676,-1.4806 0.859,-2.7579 1.7404,-3.9833 0.8811,-1.2214 2.0871,-2.1704 3.4808,-2.7385 1.6524,-0.6916 3.4307,-1.0308 5.2213,-0.9959 1.894,0 3.7137,0.127 5.2214,0.747 1.5077,0.6198 2.5632,1.7476 3.4808,2.9874 0.9177,1.2398 1.5664,2.5247 1.7405,3.9833 0.1739,1.4586 0.2487,4.0709 0.2487,7.7176 z m -9.1996,-11.7009 c 0,-1.6484 -0.066,-2.528 -0.2485,-2.9875 -0.109,-0.2347 -0.2857,-0.4313 -0.5073,-0.5644 -0.2217,-0.1331 -0.4779,-0.1967 -0.736,-0.1825 -0.196,-0.021 -0.3938,0.015 -0.5699,0.1034 -0.1762,0.088 -0.3236,0.2251 -0.4245,0.3945 -0.255,0.3719 -0.4973,1.4131 -0.4973,3.2365 v 16.6799 c 0,2.057 0.081,3.2531 0.2486,3.7344 0.1676,0.4815 0.6312,0.747 1.2431,0.747 0.6267,0 1.0692,-0.1925 1.2433,-0.747 0.1739,-0.5544 0.2485,-1.8973 0.2485,-3.9832 z m 12.6804,-8.9624 h 6.4644 c 4.3415,0 7.1651,0.1622 8.7023,0.4978 1.537,0.3356 3.0084,1.1111 3.9781,2.4896 0.9697,1.3785 1.2431,3.7022 1.2431,6.7218 0,2.7569 -0.3097,4.5288 -0.9945,5.4771 -0.6847,0.9482 -1.9677,1.5529 -3.9782,1.7426 1.8211,0.4521 3.103,0.9841 3.7296,1.7427 0.6265,0.7586 1.0902,1.357 1.2431,1.9917 0.153,0.6346 0,2.369 0,5.2281 v 9.4603 h -8.4535 v -11.7008 c 0,-1.8965 -0.199,-3.0334 -0.4973,-3.4856 -0.2983,-0.452 -0.9697,-0.7468 -2.2377,-0.7468 v 15.9332 h -9.1994 z m 9.1994,5.9749 v 7.9666 c 1.0343,0 1.8225,-0.2134 2.2377,-0.4979 0.4152,-0.2846 0.4973,-1.1776 0.4973,-2.7385 v -1.9917 c 0,-1.1233 -0.097,-1.8906 -0.4973,-2.2406 -0.4004,-0.35 -1.1743,-0.4979 -2.2377,-0.4979 z m 35.306,-5.9749 v 35.3517 h -7.9563 l -4.7241,-16.1822 v 16.1822 h -7.7075 v -35.3517 h 7.7075 l 4.9727,15.9331 v -15.9331 z"

CUT = "#1b1918"
ENGRAVE = "#000000"
HAIRLINE = 0.0762


def joint_edges(overlap):
    c = P / 2
    tab = (BIG + overlap / 2) / 2
    slot = (BIG - overlap / 2) / 2
    return c - tab, c + tab, c - slot, c + slot


def bottom(t, o):
    bt0, bt1, _, _ = joint_edges(o)
    return [
        (0, bt1 + t), (0, bt0 + t), (t, bt0 + t), (t, t),
        (bt0 + t, t), (bt0 + t, 0), (bt1 + t, 0), (bt1 + t, t),
        (P + t, t), (P + t, bt0 + t), (P + 2 * t, bt0 + t), (P + 2 * t, bt1 + t),
        (P + t, bt1 + t), (P + t, P + t), (bt1 + t, P + t), (bt1 + t, P + 2 * t),
        (bt0 + t, P + 2 * t), (bt0 + t, P + t), (t, P + t), (t, bt1 + t),
    ]


def lid(t, o):
    _, _, bs0, bs1 = joint_edges(o)
    return [
        (P + 2 * t, bs0 + t), (P + t, bs0 + t), (P + t, bs1 + t), (P + 2 * t, bs1 + t),
        (P + 2 * t, P + 2 * t), (bs1 + t, P + 2 * t), (bs1 + t, P + t), (bs0 + t, P + t),
        (bs0 + t, P + 2 * t), (0, P + 2 * t), (0, bs1 + t), (t, bs1 + t),
        (t, bs0 + t), (0, bs0 + t), (0, 0), (P + 2 * t, 0),
    ]


def wall_side(t, o):
    bt0, bt1, bs0, bs1 = joint_edges(o)
    n0 = 21.5 - (SMALL - o / 2) / 2
    n1 = 21.5 + (SMALL - o / 2) / 2
    w = 46.6
    return [
        (0, 0), (n0 + t, 0), (n0 + t, t), (n1 + t, t), (n1 + t, 0), (w + t, 0),
        (w + t, bt0 + t), (w + 2 * t, bt0 + t), (w + 2 * t, bt1 + t), (w + t, bt1 + t),
        (w + t, P + 2 * t), (n1 + t, P + 2 * t), (n1 + t, P + t), (n0 + t, P + t),
        (n0 + t, P + 2 * t), (0, P + 2 * t), (0, bs1 + t), (t, bs1 + t),
        (t, bs0 + t), (0, bs0 + t),
    ]


def mirror_x(pts, w):
    return [(w - x, y) for x, y in pts]


def wall_front(t, o):
    bt0, bt1, _, _ = joint_edges(o)
    t0 = 25.3 - (SMALL + o / 2) / 2
    t1 = 25.3 + (SMALL + o / 2) / 2
    w = 47.0
    return [
        (0, bt1 + t), (0, bt0 + t), (t, bt0 + t), (t, t),
        (t0 + t, t), (t0 + t, 0), (t1 + t, 0), (t1 + t, t),
        (w + 2 * t, t), (w + 2 * t, bt0 + t), (w + t, bt0 + t), (w + t, bt1 + t),
        (w + 2 * t, bt1 + t), (w + 2 * t, P + t), (t1 + t, P + t), (t1 + t, P + 2 * t),
        (t0 + t, P + 2 * t), (t0 + t, P + t), (t, P + t), (t, bt1 + t),
    ]


def wall_back(t, o):
    _, _, bs0, bs1 = joint_edges(o)
    t0 = 21.5 - (SMALL + o / 2) / 2
    t1 = 21.5 + (SMALL + o / 2) / 2
    w = 44.4
    return [
        (0, P + t), (0, bs1 + t), (t, bs1 + t), (t, bs0 + t), (0, bs0 + t), (0, t),
        (t0 + t, t), (t0 + t, 0), (t1 + t, 0), (t1 + t, t),
        (w + t, t), (w + t, P + t), (t1 + t, P + t), (t1 + t, P + 2 * t),
        (t0 + t, P + 2 * t), (t0 + t, P + t),
    ]


def fmt(v):
    return f"{v:.4f}".rstrip("0").rstrip(".")


def poly_path(pts, ox, oy):
    coords = " L ".join(f"{fmt(ox + x)},{fmt(oy + y)}" for x, y in pts)
    return f"M {coords} Z"


def rounded_rect_path(x, y, w, h, r):
    return (
        f"M {fmt(x + r)},{fmt(y)} L {fmt(x + w - r)},{fmt(y)}"
        f" Q {fmt(x + w)},{fmt(y)} {fmt(x + w)},{fmt(y + r)}"
        f" L {fmt(x + w)},{fmt(y + h - r)}"
        f" Q {fmt(x + w)},{fmt(y + h)} {fmt(x + w - r)},{fmt(y + h)}"
        f" L {fmt(x + r)},{fmt(y + h)}"
        f" Q {fmt(x)},{fmt(y + h)} {fmt(x)},{fmt(y + h - r)}"
        f" L {fmt(x)},{fmt(y + r)}"
        f" Q {fmt(x)},{fmt(y)} {fmt(x + r)},{fmt(y)} Z"
    )


def rect_path(x, y, w, h):
    return f"M {fmt(x)},{fmt(y)} L {fmt(x + w)},{fmt(y)} L {fmt(x + w)},{fmt(y + h)} L {fmt(x)},{fmt(y + h)} Z"


def path_el(d, color=CUT):
    style = f"fill:none;stroke:{color};stroke-width:{HAIRLINE};stroke-linecap:butt;stroke-linejoin:miter"
    return f'  <path d="{d}" style="{style}" />\n'


def generate(t, overlap=OVERLAP):
    gap = 6.0
    size = P + 2 * t
    label_h = 42.0
    els = []

    label = f"{t:g}".replace(".", ",") + "ММ"
    x = 0.0
    y = label_h + gap

    row1 = [
        (wall_front(t, overlap), 47.0 + 2 * t),
        (bottom(t, overlap), size),
        (wall_back(t, overlap), 44.4 + t),
        (wall_side(t, overlap), 46.6 + 2 * t),
        (mirror_x(wall_side(t, overlap), 46.6 + 2 * t), 46.6 + 2 * t),
    ]
    for pts, w in row1:
        els.append(path_el(poly_path(pts, x, y)))
        x += w + gap

    lid_x = x
    els.append(path_el(poly_path(lid(t, overlap), lid_x, y), ENGRAVE))
    e = (size - ENGRAVE_SIZE) / 2
    els.append(path_el(rounded_rect_path(lid_x + e, y + e, ENGRAVE_SIZE, ENGRAVE_SIZE, ENGRAVE_R), ENGRAVE))
    x += size + gap

    els.append(path_el(rect_path(x, y, RECT_W, RECT_H)))
    els.append(path_el(rect_path(x, y + RECT_H + gap, RECT_W, RECT_H)))
    x += RECT_W + gap

    torn_x = x
    els.append(path_el(rounded_rect_path(torn_x, y, TORN_W, TORN_H, TORN_R)))
    els.append(path_el(rect_path(torn_x, y + TORN_STRIP_Y, TORN_W, TORN_STRIP_H)))
    els.append(
        f'  <g transform="translate({fmt(torn_x + TORN_TEXT_X)},{fmt(y + TORN_TEXT_Y)}) scale({TORN_TEXT_SCALE:.8f})">\n'
        f'    <path d="{TORN_TEXT_D}" style="fill:none;stroke:{CUT};stroke-width:{HAIRLINE / TORN_TEXT_SCALE:.4f};stroke-linecap:butt;stroke-linejoin:miter" />\n'
        f"  </g>\n"
    )
    x += TORN_W

    width = x + 1
    height = y + size + 1
    text = (
        f'  <text x="0" y="{fmt(label_h - 8)}" font-family="Arial" font-size="39"'
        f' fill="{CUT}">{label}</text>\n'
    )

    return (
        f'<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n'
        f'<svg version="1.1" width="{fmt(width)}mm" height="{fmt(height)}mm"'
        f' viewBox="0 0 {fmt(width)} {fmt(height)}" xmlns="http://www.w3.org/2000/svg">\n'
        + text
        + "".join(els)
        + "</svg>\n"
    )


def main():
    ap = argparse.ArgumentParser(description="Генератор раскладки коробки TORN")
    ap.add_argument("thickness", type=float, help="толщина фанеры, мм (например 3.2)")
    ap.add_argument("-o", "--output", help="выходной SVG (по умолчанию korobka-<t>mm.svg)")
    ap.add_argument("--overlap", type=float, default=OVERLAP,
                    help="суммарный натяг шип/паз, мм (по умолчанию 0.4)")
    args = ap.parse_args()

    out = args.output or f"korobka-{args.thickness:g}mm.svg"
    with open(out, "w") as f:
        f.write(generate(args.thickness, args.overlap))
    print(f"OK: {out} (t={args.thickness:g} мм, натяг {args.overlap:g} мм)")


if __name__ == "__main__":
    main()

#!/bin/sh
# Builds assets/before-after.png from the two captures demo.tape takes:
# each one cropped to the transcript, framed as a window and labeled.
set -e
cd "$(dirname "$0")/.."

# The transcript region of each capture, as WxH+X+Y: the prompt through the reply.
CROP_WITHOUT="${CROP_WITHOUT:-1240x158+0+560}"
CROP_WITH="${CROP_WITH:-1240x222+0+560}"
FONT=/System/Library/Fonts/HelveticaNeue.ttc
BG='#1e1e2e'
BAR='#181825'
OUT=assets/before-after.png
TMP=$(mktemp -d)

frame() {
  # $1 capture, $2 crop, $3 label, $4 output
  magick "$1" -crop "$2" +repage -bordercolor "$BG" -border 0x14 "$TMP/body.png"
  W=$(magick identify -format %w "$TMP/body.png")
  H=$(magick identify -format %h "$TMP/body.png")
  magick -size "${W}x44" "xc:$BAR" \
    -fill '#f38ba8' -draw 'circle 26,22 33,22' \
    -fill '#f9e2af' -draw 'circle 50,22 57,22' \
    -fill '#a6e3a1' -draw 'circle 74,22 81,22' \
    -font "$FONT" -pointsize 17 -fill '#9399b2' -gravity center -annotate +0+0 "$3" \
    "$TMP/bar.png"
  magick "$TMP/bar.png" "$TMP/body.png" -background "$BG" -append \
    -bordercolor "$BG" -border 0x10 -gravity north -chop 0x10 "$TMP/win.png"
  WW=$(magick identify -format %w "$TMP/win.png")
  WH=$(magick identify -format %h "$TMP/win.png")
  magick -size "${WW}x${WH}" xc:none -fill white -draw "roundrectangle 0,0 $((WW-1)),$((WH-1)) 14,14" "$TMP/mask.png"
  magick "$TMP/win.png" "$TMP/mask.png" -alpha off -compose CopyOpacity -composite "$TMP/round.png"
  magick "$TMP/round.png" \( +clone -background black -shadow 45x18+0+10 \) +swap \
    -background none -layers merge +repage "$4"
}

frame demo/without.png "$CROP_WITHOUT" 'Without bash-why' "$TMP/a.png"
frame demo/with.png "$CROP_WITH" 'With bash-why' "$TMP/b.png"
magick -size 1x28 xc:none "$TMP/gap.png"
magick "$TMP/a.png" "$TMP/gap.png" "$TMP/b.png" -background none -gravity center -append \
  -bordercolor none -border 8 "$OUT"
rm -rf "$TMP"
magick identify -format '%wx%h\n' "$OUT"

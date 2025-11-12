#!/usr/bin/env bash
# Normalize logo sizes by visible area, but safely constrain to canvas
# Requires ImageMagick 7+ (uses `magick`)

mkdir -p output

# Canvas and target visual area
TARGET_WIDTH=300
TARGET_HEIGHT=150
TARGET_AREA=20000  # Adjust for more/less logo fill

for f in *.png; do
  echo "Processing $f ..."

  # 1. Trim excess whitespace
  magick "$f" -fuzz 5% -trim +repage "tmp.png"

  # 2. Measure trimmed logo dimensions
  read w h <<< $(magick identify -format "%w %h" "tmp.png")

  # 3. Compute current area
  area=$((w * h))

  # 4. Compute scale factor for target area
  scale=$(echo "scale=4; sqrt($TARGET_AREA / $area)" | bc -l)

  # 5. Predict scaled dimensions
  new_w=$(echo "$w * $scale" | bc -l)
  new_h=$(echo "$h * $scale" | bc -l)

  # 6. Limit to fit within canvas
  max_scale_w=$(echo "scale=4; $TARGET_WIDTH / $w" | bc -l)
  max_scale_h=$(echo "scale=4; $TARGET_HEIGHT / $h" | bc -l)
  max_scale=$(echo "if ($max_scale_w < $max_scale_h) $max_scale_w else $max_scale_h" | bc -l)

  # If scaled logo would exceed the box, clamp it
  compare=$(echo "$scale > $max_scale" | bc -l)
  if [ "$compare" -eq 1 ]; then
    scale=$max_scale
  fi

  # 7. Final resized dimensions
  new_w=$(printf "%.0f" $(echo "$w * $scale" | bc -l))
  new_h=$(printf "%.0f" $(echo "$h * $scale" | bc -l))

  # 8. Resize and center safely on the canvas
  magick "tmp.png" -resize "${new_w}x${new_h}" \
    -gravity center -background none -extent ${TARGET_WIDTH}x${TARGET_HEIGHT} \
    "output/$f"

  echo " → output/$f  (${new_w}x${new_h})"
done

rm -f tmp.png
echo "✅ Done! All logos normalized and safely fit in ./output/"

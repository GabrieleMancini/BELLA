#!/bin/bash
# Run this from inside your local BELLA repo folder (the one with .git in it)
set -e

echo "== Step 1: stop tracking media with Git LFS =="
# Remove the LFS filter rules from .gitattributes
if [ -f .gitattributes ]; then
  grep -v "filter=lfs" .gitattributes > .gitattributes.tmp && mv .gitattributes.tmp .gitattributes
  echo "Cleaned .gitattributes (removed LFS rules)."
fi

git lfs uninstall || true

echo "== Step 2: re-add all media as normal (non-LFS) files =="
git add --renormalize .
git status --short | head -20

echo "== Step 3: create cover images (1.jpg) for archive folders that need one =="
declare -A COVERS=(
  ["archive/Salotto_2"]="DSC_2609.JPG"
  ["archive/Viani_Big"]="DSC_2455.JPG"
  ["archive/Viani"]="DSC_2262.JPG"
  ["archive/salotto-cafe"]="DSC_1193.JPG"
  ["archive/Cotton-Club"]="cb94d665-7052-4a14-b83e-b161020b3cfe.JPG"
  ["archive/St-Pauli Museum"]="09e876c1-d15e-4591-bad3-72637c494686.JPG"
  ["archive/Bar_italia"]="IMG_5230.jpg"
  ["archive/Salotto-cafe-concert"]="WhatsApp Image 2026-05-29 at 12.19.16.jpeg"
  ["archive/Baradona"]="14998741-6b4a-4f20-a74b-1e975f40e290.JPG"
  ["archive/park-session"]="park.jpeg"
)

for folder in "${!COVERS[@]}"; do
  src="${COVERS[$folder]}"
  if [ -f "$folder/$src" ]; then
    cp "$folder/$src" "$folder/1.jpg"
    git add "$folder/1.jpg"
    echo "Created cover: $folder/1.jpg  (copied from $src)"
  else
    echo "WARNING: could not find $folder/$src -- check this folder manually"
  fi
done

echo "== Step 4: commit and push =="
git commit -m "Fix: stop tracking media via Git LFS (GitHub Pages can't serve it), add missing archive covers"
git push origin main

echo ""
echo "Done. Give GitHub Pages a minute or two to rebuild, then hard-refresh bellahamburg.com (Cmd+Shift+R)."

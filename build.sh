#!/usr/bin/env bash
# Builds two single-file outputs from the source files:
#   dist/index.html    - standalone page (CSS + JS inlined), deploy anywhere
#   dist/artifact.html - body fragment for the claude.ai artifact host
cd "$(dirname "$0")"
mkdir -p dist
awk '
/href="styles.css"/ { print "<style>"; while ((getline l < "styles.css") > 0) print l; print "</style>"; next }
/src="app.js"/ { print "<script>"; while ((getline l < "app.js") > 0) print l; print "</script>"; next }
/@artifact/ { next }
{ print }
' index.html > dist/index.html
awk '
/@artifact-head -->/ { on=1; next }
/@artifact-head-end/ { on=0; next }
/@artifact-body -->/ { on=1; next }
/@artifact-body-end/ { on=0; next }
!on { next }
/href="styles.css"/ { print "<style>"; while ((getline l < "styles.css") > 0) print l; print "</style>"; next }
/src="app.js"/ { print "<script>"; while ((getline l < "app.js") > 0) print l; print "</script>"; next }
{ print }
' index.html > dist/artifact.html
echo "built: $(wc -c < dist/index.html) bytes standalone, $(wc -c < dist/artifact.html) bytes artifact"

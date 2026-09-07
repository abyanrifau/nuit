#!/usr/bin/env bash
# Builds the single-file outputs from the source files:
#   dist/index.html      - standalone landing page (CSS + JS inlined), deploy anywhere
#   dist/calculate.html  - standalone calculator page, same treatment
#   dist/artifact.html   - body fragment of the landing page, for the claude.ai artifact host
cd "$(dirname "$0")"
mkdir -p dist

# Inline every local stylesheet and script a page references, and drop the
# @artifact markers. Any page listed here gets the same treatment, so adding a
# page means adding it to the loop, not editing the awk.
inline() {
  awk '
  /href="styles.css"/ { print "<style>"; while ((getline l < "styles.css") > 0) print l; close("styles.css"); next }
  /src="app.js"/      { print "<script>"; while ((getline l < "app.js")   > 0) print l; close("app.js");   print "</script>"; next }
  /src="calc.js"/     { print "<script>"; while ((getline l < "calc.js")  > 0) print l; close("calc.js");  print "</script>"; next }
  /@artifact/ { next }
  { print }
  ' "$1" > "$2"
}

for page in index calculate; do
  inline "$page.html" "dist/$page.html"
done

# Body-only fragment of the landing page for the artifact host.
awk '
/@artifact-head -->/ { on=1; next }
/@artifact-head-end/ { on=0; next }
/@artifact-body -->/ { on=1; next }
/@artifact-body-end/ { on=0; next }
!on { next }
/href="styles.css"/ { print "<style>"; while ((getline l < "styles.css") > 0) print l; close("styles.css"); next }
/src="app.js"/ { print "<script>"; while ((getline l < "app.js") > 0) print l; close("app.js"); print "</script>"; next }
{ print }
' index.html > dist/artifact.html

echo "built: $(wc -c < dist/index.html) bytes index, $(wc -c < dist/calculate.html) bytes calculate, $(wc -c < dist/artifact.html) bytes artifact"

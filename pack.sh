#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_FILE="${SCRIPT_DIR}/g-locks.zip"

cd "${SCRIPT_DIR}"
glib-compile-schemas schemas/
rm -f "${OUTPUT_FILE}"

zip -r "${OUTPUT_FILE}" \
    extension.js \
    prefs.js \
    metadata.json \
    stylesheet.css \
    LICENSE \
    src \
    icons \
    schemas

echo "Extension packaged successfully: ${OUTPUT_FILE}"
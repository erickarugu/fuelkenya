#!/usr/bin/env bash
# Upload one or more EPRA cycle CSVs to the FuelKenya API.
#
#   api/scripts/upload_cycles.sh api/data/epra-cycles/2026-11-15_to_2026-12-14.csv
#   api/scripts/upload_cycles.sh api/data/epra-cycles/2018-*.csv
#
# The ingest token is read from $FUELKENYA_TOKEN_FILE (default
# ~/.config/fuelkenya/ingest_token, chmod 600) and never printed.
set -euo pipefail

API="${FUELKENYA_API:-https://api.fuelkenya.com/v1}"
TOKEN_FILE="${FUELKENYA_TOKEN_FILE:-$HOME/.config/fuelkenya/ingest_token}"

if [ ! -r "$TOKEN_FILE" ]; then
  echo "Token file not found: $TOKEN_FILE" >&2
  exit 1
fi
if [ "$#" -eq 0 ]; then
  echo "Usage: $0 <cycle.csv> [more.csv ...]" >&2
  exit 1
fi

ok=0
failed=0
uploaded=()
for csv in "$@"; do
  # Send the token via a header file so it never appears in the process list.
  header=$(mktemp)
  chmod 600 "$header"
  printf 'Authorization: Bearer %s\n' "$(cat "$TOKEN_FILE")" > "$header"
  body=$(mktemp)
  status=$(curl -sS -o "$body" -w '%{http_code}' -X POST "$API/ingest/csv" \
    -H @"$header" -F "file=@${csv};type=text/csv") || status=000
  rm -f "$header"
  if [ "$status" = "201" ] || [ "$status" = "200" ]; then
    ok=$((ok + 1))
    d=$(basename "$csv" | grep -oE '^[0-9]{4}-[0-9]{2}-[0-9]{2}' || true)
    [ -n "$d" ] && uploaded+=("\"$d\"")
    echo "ok      $(basename "$csv")  $(cat "$body")"
  else
    failed=$((failed + 1))
    echo "FAILED  $(basename "$csv")  HTTP $status  $(head -c 300 "$body")"
  fi
  rm -f "$body"
done

echo "uploaded: $ok  failed: $failed"
# Email subscribers automatically when this upload brought in the newest cycle.
# The API skips it for backfills, old cycles, or a cycle already emailed.
if [ "$failed" -eq 0 ] && [ "${#uploaded[@]}" -gt 0 ] && [ -z "${FUELKENYA_NO_ALERTS:-}" ]; then
  header=$(mktemp)
  chmod 600 "$header"
  printf 'Authorization: Bearer %s\n' "$(cat "$TOKEN_FILE")" > "$header"
  list=$(IFS=,; echo "${uploaded[*]}")
  echo "alerts: $(curl -sS -X POST "$API/alerts/send" -H @"$header" \
    -H 'Content-Type: application/json' -d "{\"mode\":\"auto\",\"uploaded\":[$list]}" || echo 'request failed')"
  rm -f "$header"
fi
[ "$failed" -eq 0 ]

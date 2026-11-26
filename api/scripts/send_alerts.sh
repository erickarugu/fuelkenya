#!/usr/bin/env bash
# Email the latest cycle's prices to everyone who signed up for alerts.
#
#   api/scripts/send_alerts.sh                    # dry run: how many, and the subject line
#   api/scripts/send_alerts.sh --test you@x.com   # send yourself a copy (repeatable)
#   api/scripts/send_alerts.sh --send             # send to all subscribers (once per cycle)
#
# Upload and check the new cycle first (upload_cycles.sh). The token is read
# from the same file as upload_cycles.sh and never printed.
set -euo pipefail

API="${FUELKENYA_API:-https://api.fuelkenya.com/v1}"
TOKEN_FILE="${FUELKENYA_TOKEN_FILE:-$HOME/.config/fuelkenya/ingest_token}"
[ -r "$TOKEN_FILE" ] || { echo "Token file not found: $TOKEN_FILE" >&2; exit 1; }

case "${1:-}" in
  "")      body='{"mode":"dry_run"}' ;;
  --test)  [ -n "${2:-}" ] || { echo "Usage: $0 --test you@example.com" >&2; exit 1; }
           body=$(printf '{"mode":"test","test_email":"%s"}' "$2") ;;
  --send)  read -r -p "Email every subscriber this cycle's prices? Type yes: " ok
           [ "$ok" = "yes" ] || { echo "Cancelled."; exit 1; }
           body='{"mode":"send"}' ;;
  *)       echo "Usage: $0 [--test email | --send]" >&2; exit 1 ;;
esac

header=$(mktemp); chmod 600 "$header"
printf 'Authorization: Bearer %s\n' "$(cat "$TOKEN_FILE")" > "$header"
out=$(mktemp)
status=$(curl -sS -o "$out" -w '%{http_code}' -X POST "$API/alerts/send" \
  -H @"$header" -H 'Content-Type: application/json' -d "$body") || status=000
rm -f "$header"
echo "HTTP $status  $(cat "$out")"
rm -f "$out"
[ "$status" = "200" ]

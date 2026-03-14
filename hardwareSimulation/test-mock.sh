#!/bin/bash
# Check mock endpoints. Run from hardwareSimulation with mock running (npm start).

cd "$(dirname "$0")"
BASE_URL="${HARDWARE_URL:-http://localhost:3000}"
FAIL=0

check() {
  local name="$1" url="$2" body="$3"
  local code
  if [ -n "$body" ]; then
    code=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d "$body" "$url")
  else
    code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  fi
  if [ "$code" = "200" ]; then
    echo "OK  $name"
  else
    echo "FAIL $name (HTTP $code)"
    FAIL=1
  fi
}

echo "Checking endpoints at $BASE_URL"
echo "(To use a different host, run: HARDWARE_URL=http://HOST:3000 ./test-mock.sh)"
echo ""

check "POST /hardware/unlock" "$BASE_URL/hardware/unlock" '{"stationId":"station-001","slotNumber":5}'
check "POST /hardware/return" "$BASE_URL/hardware/return" '{"stationId":"station-001","slotNumber":3,"umbrellaId":"umbrella-123"}'

echo ""
[ $FAIL -eq 0 ] && echo "All endpoints OK." || echo "One or more checks failed."
exit $FAIL

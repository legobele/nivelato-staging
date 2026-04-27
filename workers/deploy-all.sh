#!/bin/bash
# Deploy all 5 subagent workers to Cloudflare
# Run: bash deploy-all.sh <NGROK_URL>

NGROK_URL=${1:-"http://localhost:8080"}
ACCOUNT_ID="f340f909f4bd8d4751826debfa7cf2ac"

declare -A WORKERS=(
  ["t1sm420-ops"]="worker-ops.js"
  ["t1sm420-research"]="worker-research.js"
  ["t1sm420-creative"]="worker-creative.js"
  ["t1sm420-qc"]="worker-qc.js"
  ["t1sm420-strategy"]="worker-strategy.js"
)

for NAME in "${!WORKERS[@]}"; do
  FILE="${WORKERS[$NAME]}"
  echo "Deploying $NAME from $FILE..."
  
  # Inject the ngrok URL into the worker
  sed "s|NGROK_URL_PLACEHOLDER|$NGROK_URL|g" "$FILE" > "/tmp/${NAME}.js"
  
  # Deploy via Cloudflare API
  curl -s -X PUT "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/scripts/${NAME}" \
    -H "Authorization: Bearer $CLOUDFLARE_TOKEN" \
    -H "Content-Type: application/javascript" \
    --data-binary @"/tmp/${NAME}.js" | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK' if d.get('success') else f'FAIL: {d}')"
done

echo "All workers deployed."
echo "Endpoints:"
for NAME in "${!WORKERS[@]}"; do
  echo "  https://${NAME}.legobele.workers.dev"
done

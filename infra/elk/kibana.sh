#!/bin/bash
set -eu

KIBANA_URL=${KIBANA_URL}
CONFIG_FILE=${CONFIG_FILE}
USERNAME=${ELK_USERNAME}
PASSWORD=${ELK_PASSWORD}

echo "Waiting for Kibana (30s)..."
sleep 30

echo "Importing configuration..."
curl -s -u "$USERNAME:$PASSWORD" \
  -X POST "${KIBANA_URL}/elk/api/saved_objects/_import?overwrite=true" \
  -H "kbn-xsrf: true" \
  --cacert /certs/ca.crt \
  -F "file=@$CONFIG_FILE" || true

tail -f /dev/null

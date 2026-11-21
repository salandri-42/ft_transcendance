#!/bin/bash
set -e

CERTS_DIR=${CERTS_DIR:-/certs}
mkdir -p "$CERTS_DIR"

if [ ! -f "$CERTS_DIR/elk-keystore.p12" ]; then
    echo "Generating ELK certificate..."

    cat > "$CERTS_DIR/csr.conf" <<EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = req_distinguished_name
req_extensions = v3_req

[req_distinguished_name]
C = US
ST = State
L = City
O = Organization
CN = elasticsearch

[v3_req]
subjectAltName = @alt_names

[alt_names]
DNS.1 = elasticsearch
DNS.2 = kibana
DNS.3 = logstash
DNS.4 = elk
IP.1 = 127.0.0.1
EOF

    openssl req -new -x509 -days 3650 -nodes -out "$CERTS_DIR/ca.crt" -keyout "$CERTS_DIR/ca.key" \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=elk-ca"

    openssl req -new -keyout "$CERTS_DIR/elk.key" -out "$CERTS_DIR/elk.csr" \
        -config "$CERTS_DIR/csr.conf" -nodes

    openssl x509 -req -in "$CERTS_DIR/elk.csr" -CA "$CERTS_DIR/ca.crt" -CAkey "$CERTS_DIR/ca.key" \
        -CAcreateserial -out "$CERTS_DIR/elk.crt" -days 3650 \
        -extensions v3_req -extfile "$CERTS_DIR/csr.conf"

    cat "$CERTS_DIR/elk.crt" "$CERTS_DIR/ca.crt" > "$CERTS_DIR/elk-full.crt"
    openssl pkcs12 -export -in "$CERTS_DIR/elk-full.crt" -inkey "$CERTS_DIR/elk.key" \
        -out "$CERTS_DIR/elk-keystore.p12" -name elk \
        -passout pass:"${ELK_KEYSTORE_PASSWORD:-elk-keystore-password}"

    mv "$CERTS_DIR/elk-full.crt" "$CERTS_DIR/elk.crt"
    rm -f "$CERTS_DIR"/*.csr "$CERTS_DIR"/*.srl "$CERTS_DIR"/*.conf
    chmod 644 "$CERTS_DIR"/*

    echo "✓ Certificate generated"
fi

exec /kibana.sh


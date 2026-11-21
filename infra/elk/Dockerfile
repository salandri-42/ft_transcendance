FROM alpine:latest

RUN apk add --no-cache bash curl openssl

COPY kibana.sh /kibana.sh
COPY entrypoint.sh /entrypoint.sh
COPY config.ndjson /config.ndjson
RUN chmod +x /kibana.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]

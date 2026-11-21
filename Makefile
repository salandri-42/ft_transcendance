all: build up

help:
	@echo "Available targets:"
	@echo "  make / make all      Build images and start services"
	@echo "  make up              Start services in background"
	@echo "  make down            Stop services"
	@echo "  make logs            Follow service logs"
	@echo "  make restart         Restart running services"
	@echo "  make refresh         Down + up"
	@echo "  make reset-db        Reset identity/cosmos Prisma databases"
	@echo "  make clean           Remove Docker artifacts + dist"
	@echo "  make fclean          Deep clean (includes node_modules)"
	@echo "  make disk-usage      Show Docker/local disk usage"

build: certs
	docker buildx bake dev
	@docker image prune -f 2>/dev/null || true

build-prod: certs
	docker buildx bake prod
	@docker image prune -f 2>/dev/null || true

certs:
	mkdir -p infra/nginx/certs
	openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
		-keyout infra/nginx/certs/nginx.key \
		-out infra/nginx/certs/nginx.crt \
		-subj "/C=MG/ST=Antananarivo/L=Antananarivo/O=42/OU=Transcendence/CN=localhost" 2>/dev/null || true

reset-db:
	docker compose up -d --build postgres identity cosmos
	docker compose exec identity npx prisma db push --force-reset
	docker compose exec cosmos npx prisma db push --force-reset

re-db: re reset-db

up:
	docker compose --profile cloudflare up -d

up-cloudflare:
	docker compose --profile cloudflare up -d

down:
	docker compose --profile cloudflare down

restart:
	docker compose restart

logs:
	docker compose logs -f

logs-cloudflare:
	docker compose logs -f cloudflared


# Show disk usage breakdown
disk-usage:
	@echo "=== Docker images ==="
	@docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | sort -k3 -h
	@echo ""
	@echo "=== Docker system disk usage ==="
	@docker system df
	@echo ""
	@echo "=== Volumes ==="
	@docker volume ls --format "table {{.Name}}\t{{.Driver}}" 2>/dev/null
	@echo ""
	@echo "=== Local node_modules ==="
	@du -sh services/*/node_modules 2>/dev/null || echo "  (none)"

clean: down
	docker system prune -af --volumes
	docker builder prune -af
	rm -rf infra/nginx/certs
	rm -rf services/*/dist

fclean:
	docker compose --profile cloudflare down -v --rmi all --remove-orphans
	docker system prune -af --volumes
	docker builder prune -af
	rm -rf infra/nginx/certs
	rm -rf services/*/dist
	rm -rf services/*/node_modules

refresh: down up

refresh-cloudflare: down up-cloudflare

re: fclean build up

re-cloudflare: fclean build up-cloudflare

# Step 1: Merge current branch into a tmp branch based on develop (stop for review)
merge-dev:
	@CURRENT=$$(git branch --show-current); \
	if [ -z "$$CURRENT" ]; then echo "Error: HEAD is detached."; exit 1; fi; \
	if [ "$$CURRENT" = "develop" ]; then echo "Error: already on develop."; exit 1; fi; \
	TMP="tmp/merge-$$CURRENT-$$(date +%s)"; \
	echo "── Merging '$$CURRENT' → tmp branch '$$TMP'"; \
	git fetch origin && \
	git checkout develop && \
	git pull --ff-only origin develop 2>/dev/null || true; \
	git checkout -b "$$TMP" && \
	git merge "$$CURRENT" -m "merge($$CURRENT): into develop via $$TMP" && \
	echo "── ✓ Now on '$$TMP'. Review the merge, then run 'make merge-dev-finish'." && \
	echo "── To abort: git checkout $$CURRENT && git branch -D $$TMP"

# Step 2: Fast-forward develop with the current tmp branch, push, and go back
merge-dev-finish:
	@TMP=$$(git branch --show-current); \
	if echo "$$TMP" | grep -qv '^tmp/merge-'; then echo "Error: not on a tmp/merge-* branch (current: $$TMP)."; exit 1; fi; \
	CURRENT=$$(echo "$$TMP" | sed 's|tmp/merge-\(.*\)-[0-9]*$$|\1|'); \
	echo "── Fast-forwarding develop with '$$TMP'"; \
	git checkout develop && \
	git merge --ff-only "$$TMP" && \
	git branch -d "$$TMP" && \
	echo "── ✓ develop updated. Pushing…" && \
	git push origin develop && \
	git checkout "$$CURRENT" && \
	git merge --ff-only develop && \
	echo "── ✓ Done. '$$CURRENT' updated to match 'develop'."

.PHONY: all help build build-prod up up-cloudflare down logs logs-cloudflare clean fclean re re-cloudflare restart disk-usage refresh refresh-cloudflare reset-db re-db merge-dev merge-dev-finish

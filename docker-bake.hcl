variable "TAG" {
  default = "latest"
}

group "default" {
  targets = ["dev"]
}

group "dev" {
  targets = ["gateway-dev", "identity-dev", "cosmos-dev", "pythia-dev", "scribe-dev", "frontend-dev", "nginx", "postgres", "redis"]
}

group "prod" {
  targets = ["gateway-prod", "identity-prod", "cosmos-prod", "pythia-prod", "scribe-prod", "frontend-prod", "nginx", "postgres", "redis"]
}

group "frontend" {
  targets = ["frontend-dev"]
}

target "common" {
  dockerfile = "Dockerfile"
}

target "nginx" {
  inherits = ["common"]
  context = "infra/nginx"
  tags = ["nginx:${TAG}"]
}

target "postgres" {
  inherits = ["common"]
  context = "infra/postgres"
  tags = ["postgres:dev", "postgres:${TAG}"]
}

target "redis" {
  inherits = ["common"]
  context = "infra/redis"
  tags = ["redis:dev", "redis:${TAG}"]
}

# ── NestJS services (share same Alpine base layer) ──

target "gateway-dev" {
  inherits = ["common"]
  context = "services/gateway"
  target = "development"
  tags = ["gateway:dev", "gateway:${TAG}-dev"]
  cache-from = ["type=registry,ref=gateway:cache"]
}

target "gateway-prod" {
  inherits = ["common"]
  context = "services/gateway"
  target = "production"
  tags = ["gateway:prod", "gateway:${TAG}"]
  cache-from = ["type=registry,ref=gateway:cache"]
}

target "frontend-dev" {
  inherits = ["common"]
  context = "services/frontend"
  target = "development"
  tags = ["frontend:dev", "frontend:${TAG}-dev"]
  cache-from = ["type=registry,ref=frontend:cache"]
}

target "frontend-prod" {
  inherits = ["common"]
  context = "services/frontend"
  target = "production"
  tags = ["frontend:prod", "frontend:${TAG}"]
  cache-from = ["type=registry,ref=frontend:cache"]
}

target "identity-dev" {
  inherits = ["common"]
  context = "services/identity"
  target = "development"
  tags = ["identity:dev", "identity:${TAG}-dev"]
  cache-from = ["type=registry,ref=identity:cache"]
}

target "identity-prod" {
  inherits = ["common"]
  context = "services/identity"
  target = "production"
  tags = ["identity:prod", "identity:${TAG}"]
  cache-from = ["type=registry,ref=identity:cache"]
}

target "cosmos-dev" {
  inherits = ["common"]
  context = "services/cosmos"
  target = "development"
  tags = ["cosmos:dev", "cosmos:${TAG}-dev"]
  cache-from = ["type=registry,ref=cosmos:cache"]
}

target "cosmos-prod" {
  inherits = ["common"]
  context = "services/cosmos"
  target = "production"
  tags = ["cosmos:prod", "cosmos:${TAG}"]
  cache-from = ["type=registry,ref=cosmos:cache"]
}

target "pythia-dev" {
  inherits = ["common"]
  context = "services/pythia"
  target = "development"
  tags = ["pythia:dev", "pythia:${TAG}-dev"]
  cache-from = ["type=registry,ref=pythia:cache"]
}

target "pythia-prod" {
  inherits = ["common"]
  context = "services/pythia"
  target = "production"
  tags = ["pythia:prod", "pythia:${TAG}"]
  cache-from = ["type=registry,ref=pythia:cache"]
}

target "scribe-dev" {
  inherits = ["common"]
  context = "services/scribe"
  target = "development"
  tags = ["scribe:dev", "scribe:${TAG}-dev"]
  cache-from = ["type=registry,ref=scribe:cache"]
}

target "scribe-prod" {
  inherits = ["common"]
  context = "services/scribe"
  target = "production"
  tags = ["scribe:prod", "scribe:${TAG}"]
  cache-from = ["type=registry,ref=scribe:cache"]
}
-- =============================================================
-- Script d'initialisation PostgreSQL
-- Crée la base de données dédiée au service Cosmos
-- La base "transcendence" (Identity) est créée automatiquement
-- par la variable d'environnement POSTGRES_DB dans docker-compose.
-- =============================================================

-- Crée la base cosmos_db si elle n'existe pas encore
SELECT 'CREATE DATABASE cosmos_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'cosmos_db')\gexec

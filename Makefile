# RADAR — commandes projet. `make help` pour la liste.
.DEFAULT_GOAL := help

help: ## Affiche cette aide
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

dev: ## Lance l'app en local (Vite) sur http://localhost:5173
	npm run dev

build: ## Build de production (tsc + vite)
	npm run build

test: ## Lance les tests (Vitest)
	npm test

hermes: ## Génère le paquet de handoff Hermes (export-hermes/ + tarball)
	npm run hermes

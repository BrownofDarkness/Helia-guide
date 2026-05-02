# 🚧 Stub à remplir — voir correction/ pour la version complète.
#
# À provisionner :
# - fly_app : taskly-api
# - fly_machine : 2 instances minimum (HA)
# - fly_postgres_cluster : Postgres managé Fly
# - fly_app_secret : JWT_SECRET (généré random_password)
# - sentry_project (provider sentry/sentry) : projet + DSN exposé
# - betterstack_monitor : uptime check sur https://taskly-api.fly.dev/health
#
# Bonnes pratiques :
# - backend distant chiffré (S3 + use_lockfile, ou Tigris/Fly)
# - variables fly_region, fly_org, sentry_org en var.tf
# - outputs : fly_app_url, sentry_dsn (sensible)

terraform {
  required_version = ">= 1.7"
  required_providers {
    # TODO : déclarer fly-apps/fly, sentry/sentry, betterstackhq/betterstack
  }
  # TODO : backend distant
}

# TODO : ressources

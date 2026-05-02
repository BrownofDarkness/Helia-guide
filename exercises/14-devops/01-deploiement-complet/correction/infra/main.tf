terraform {
  required_version = ">= 1.7"
  required_providers {
    fly = {
      source  = "fly-apps/fly"
      version = "~> 0.0.23"
    }
    sentry = {
      source  = "jianyuan/sentry"
      version = "~> 0.13"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  backend "s3" {
    bucket       = "taskly-tfstate"
    key          = "prod/terraform.tfstate"
    region       = "eu-west-3"
    use_lockfile = true
  }
}

provider "fly" {}
provider "sentry" {
  base_url = "https://sentry.io/api/"
}

# ----- Random secrets -----

resource "random_password" "jwt" {
  length           = 64
  override_special = "!#%*-_+="
}

# ----- Sentry project -----

resource "sentry_project" "taskly" {
  organization = var.sentry_org
  team         = var.sentry_team
  name         = "taskly-api"
  slug         = "taskly-api"
  platform     = "node"
}

resource "sentry_key" "taskly" {
  organization = var.sentry_org
  project      = sentry_project.taskly.slug
  name         = "Default"
}

# ----- Fly app + Postgres -----

resource "fly_app" "api" {
  name = "taskly-api"
  org  = var.fly_org
}

resource "fly_app" "postgres" {
  name = "taskly-db"
  org  = var.fly_org
}

# Postgres provisioning : Fly l'a sorti du provider TF officiel ; on déclare
# l'app puis on délègue le cluster à `flyctl postgres create` ou Tigris/Neon.
# Voir scripts/postgres-bootstrap.sh.

resource "fly_machine" "api" {
  count  = 2
  app    = fly_app.api.name
  region = var.fly_region
  name   = "api-${count.index}"
  image  = "registry.fly.io/taskly-api:latest"

  services = [{
    ports = [
      { port = 80, handlers = ["http"] },
      { port = 443, handlers = ["tls", "http"] },
    ]
    protocol      = "tcp"
    internal_port = 3000
  }]
}

# ----- Secrets app (Fly) -----

resource "fly_app_secret" "jwt" {
  app   = fly_app.api.name
  name  = "JWT_SECRET"
  value = random_password.jwt.result
}

resource "fly_app_secret" "sentry_dsn" {
  app   = fly_app.api.name
  name  = "SENTRY_DSN"
  value = sentry_key.taskly.dsn_public
}

resource "fly_app_secret" "database_url" {
  app   = fly_app.api.name
  name  = "DATABASE_URL"
  value = var.database_url # on n'inscrit pas la DB sortie de tofu — c'est plus sûr
}

# ----- Outputs -----

output "fly_app_url" {
  value = "https://${fly_app.api.name}.fly.dev"
}

output "sentry_dsn" {
  value     = sentry_key.taskly.dsn_public
  sensitive = true
}

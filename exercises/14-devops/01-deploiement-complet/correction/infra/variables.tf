variable "fly_org" {
  type        = string
  description = "Slug de l'organisation Fly.io"
}

variable "fly_region" {
  type        = string
  default     = "cdg"
  description = "Région Fly principale"
}

variable "sentry_org" {
  type        = string
  description = "Slug de l'organisation Sentry"
}

variable "sentry_team" {
  type        = string
  description = "Slug de l'équipe Sentry"
}

variable "database_url" {
  type        = string
  sensitive   = true
  description = "DATABASE_URL Postgres (issu de flyctl postgres create)"
}

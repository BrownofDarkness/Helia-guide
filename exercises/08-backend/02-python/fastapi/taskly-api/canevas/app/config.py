from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ENV: str = "development"
    DATABASE_URL: str = "sqlite+aiosqlite:///./data.db"
    JWT_SECRET: str

    @property
    def is_prod(self) -> bool:
        return self.ENV == "production"


settings = Settings()  # type: ignore[call-arg]

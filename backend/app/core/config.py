import json
import urllib.parse
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    
    # App
    APP_NAME: str = "MedAssist AI"
    ENV: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # JWT
    JWT_SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 10080

    # MySQL
    MYSQL_PUBLIC_URL: str | None = None
    MYSQL_USER: str = "root"
    MYSQL_PASSWORD: str = "root"
    MYSQL_DB: str = "medassist_db"
    MYSQL_HOST: str = "localhost"
    MYSQL_PORT: int = 3306

    # MongoDB
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB_NAME: str = "medassist_logs"

    # CORS
    CORS_ORIGINS: str | list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "https://med-assist-ai-mekalacybersecurity.vercel.app",
    ]

    @property
    def parsed_cors_origins(self) -> list[str]:
        if isinstance(self.CORS_ORIGINS, str):
            try:
                return json.loads(self.CORS_ORIGINS)
            except ValueError:
                return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
        return self.CORS_ORIGINS

    @property
    def DATABASE_URL(self) -> str:
        if self.MYSQL_PUBLIC_URL:
            url = self.MYSQL_PUBLIC_URL
            if url.startswith("mysql://"):
                url = url.replace("mysql://", "mysql+aiomysql://", 1)
            elif url.startswith("mysql+pymysql://"):
                url = url.replace("mysql+pymysql://", "mysql+aiomysql://", 1)
            return url

        # Fallback to individual components (local testing usually)
        password = urllib.parse.quote_plus(self.MYSQL_PASSWORD)
        return (
            f"mysql+aiomysql://{self.MYSQL_USER}:{password}"
            f"@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DB}"
        )

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
        env_file_encoding="utf-8"
    )


def get_settings() -> Settings:
    return Settings()


settings = get_settings()
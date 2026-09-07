import json
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    # ============================================================
    # App
    # ============================================================
    APP_NAME: str = "MedAssist AI"
    ENV: str = "production"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # ============================================================
    # JWT
    # ============================================================
    JWT_SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 10080

    # ============================================================
    # MySQL
    # ============================================================
    MYSQL_PUBLIC_URL: str | None = None

    MYSQL_USER: str = "root"
    MYSQL_PASSWORD: str = ""
    MYSQL_DB: str = "railway"
    MYSQL_HOST: str = "localhost"
    MYSQL_PORT: int = 3306

    # ============================================================
    # MongoDB
    # ============================================================
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB_NAME: str = "medassist_logs"

    # ============================================================
    # CORS
    # ============================================================
    CORS_ORIGINS: str | list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "https://med-assist-ai-mekalacybersecurity.vercel.app",
        "https://med-assist-ai-mekala123.vercel.app",
    ]

    @property
    def parsed_cors_origins(self) -> list[str]:
        if isinstance(self.CORS_ORIGINS, str):
            try:
                return json.loads(self.CORS_ORIGINS)
            except (ValueError, TypeError):
                return [
                    origin.strip()
                    for origin in self.CORS_ORIGINS.split(",")
                    if origin.strip()
                ]

        return self.CORS_ORIGINS

    # ============================================================
    # Database URL
    # ============================================================
    @property
    def DATABASE_URL(self) -> str:
        """
        Railway production MUST use MYSQL_PUBLIC_URL.

        We intentionally do NOT fall back to localhost here,
        because localhost is not the Railway MySQL server.
        """

        if not self.MYSQL_PUBLIC_URL:
            raise RuntimeError(
                "MYSQL_PUBLIC_URL is missing. "
                "Please add MYSQL_PUBLIC_URL to Railway Variables."
            )

        url = self.MYSQL_PUBLIC_URL.strip()

        # Railway URL:
        # mysql://user:password@host:port/database
        #
        # SQLAlchemy async driver:
        # mysql+aiomysql://user:password@host:port/database

        if url.startswith("mysql://"):
            url = url.replace(
                "mysql://",
                "mysql+aiomysql://",
                1,
            )

        elif url.startswith("mysql+pymysql://"):
            url = url.replace(
                "mysql+pymysql://",
                "mysql+aiomysql://",
                1,
            )

        elif not url.startswith("mysql+aiomysql://"):
            raise RuntimeError(
                "Invalid MYSQL_PUBLIC_URL format. "
                "Expected mysql:// or mysql+aiomysql://"
            )

        return url

    # ============================================================
    # Pydantic Settings
    # ============================================================
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
        env_file_encoding="utf-8",
    )


def get_settings() -> Settings:
    return Settings()


settings = get_settings()

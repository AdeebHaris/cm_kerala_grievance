import os
from pydantic_settings import BaseSettings

_env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:Adeebharis%401998@localhost:5432/cm_kerala"
    SECRET_KEY: str = "cm-kerala-secret"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_DAYS: int = 7
    GROQ_API_KEY: str = ""
    FRONTEND_URL: str = "http://localhost:5173"
    PORT: int = 8000

    model_config = {"env_file": _env_path, "extra": "ignore"}


settings = Settings()

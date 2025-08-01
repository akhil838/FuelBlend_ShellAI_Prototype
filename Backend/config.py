from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGO_URI: str
    DB_NAME: str
    HF_TOKEN: str

    class Config:
        env_file = ".env"

settings = Settings()
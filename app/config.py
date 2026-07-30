import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    supabase_url: str
    supabase_key: str
    supabase_service_key: str
    admin_api_key: str

    @classmethod
    def from_environment(cls) -> "Settings":
        return cls(
            supabase_url=os.environ["SUPABASE_URL"],
            supabase_key=os.environ["SUPABASE_KEY"],
            supabase_service_key=os.environ["SUPABASE_SERVICE_ROLE_KEY"],
            admin_api_key=os.environ["ADMIN_API_KEY"],
        )

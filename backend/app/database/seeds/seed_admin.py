import os

from app.services.auth_service import create_admin_user, get_user_by_email


def get_required_env(name: str) -> str:
    value = os.getenv(name, "").strip()

    if not value:
        raise ValueError(f"Variavel de ambiente obrigatoria ausente: {name}")

    return value


def seed_admin() -> dict:
    email = get_required_env("ADMIN_EMAIL")
    password = get_required_env("ADMIN_PASSWORD")
    name = os.getenv("ADMIN_NAME", "").strip() or None

    existing_user = get_user_by_email(email)

    if existing_user:
        return {
            "created": False,
            "user": {
                "id": existing_user["id"],
                "email": existing_user["email"],
                "name": existing_user["name"],
                "role": existing_user["role"],
                "is_active": existing_user["is_active"],
            },
        }

    created_user = create_admin_user(
        email=email,
        password=password,
        name=name,
    )

    return {
        "created": True,
        "user": created_user,
    }


if __name__ == "__main__":
    result = seed_admin()
    action = "criado" if result["created"] else "ja existente"
    print(f"Admin {action}: {result['user']['email']}")

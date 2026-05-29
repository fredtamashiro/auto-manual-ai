from fastapi import APIRouter

from app.services.theme_service import list_themes

router = APIRouter(prefix="/themes", tags=["Themes"])


@router.get("")
def get_themes():
    return {
        "themes": list_themes(),
    }

from fastapi import APIRouter, Depends

from app.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me")
async def get_current_user_info(
    user: User = Depends(get_current_user),
):
    return {"id": user.id, "email": user.email, "name": user.name}

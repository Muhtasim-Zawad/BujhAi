from pydantic import BaseModel


class JoinCodeRequest(BaseModel):
    join_code: str

from pydantic import BaseModel
from typing import List

class ResponseSchema(BaseModel):
    preamble:str
    size:int
    res:List[str]


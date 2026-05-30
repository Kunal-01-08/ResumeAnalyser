from pydantic import BaseModel
from typing import List

class SectionSchema(BaseModel):
    name:str
    desc:str
    points:List[str]

class OutlineSchema(BaseModel):
    sections:List[SectionSchema]
    ats_keywords:List[str]
    mistakes:List[str]




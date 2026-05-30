from pydantic import BaseModel
from typing import List
class ResumeEvaluation(BaseModel):
    strengths: List[str]
    ats_score: int
    conclusion: str

class ComparisonResponseSchema(BaseModel):
    resume1: ResumeEvaluation
    resume2: ResumeEvaluation
    comparison_summary:str
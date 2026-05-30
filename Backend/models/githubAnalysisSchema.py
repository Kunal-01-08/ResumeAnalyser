from pydantic import BaseModel
from typing import List


class GithubAnalysisSchema(BaseModel):
    summary:str

    overallLevel: str

    strongestAreas: List[str]

    weakAreas: List[str]

    projectQualityAnalysis: List[str]

    recruiterImpression: str

    improvementSuggestions: List[str]

    standoutProjects: List[str]

    employabilityAssessment: str


class GithubProfileSchema(BaseModel):
    name: str | None
    avatar: str
    followers: int
    publicRepos: int
    bio: str | None


class GithubResponseSchema(BaseModel):
    profile: GithubProfileSchema
    analysis: GithubAnalysisSchema
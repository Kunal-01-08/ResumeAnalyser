from pydantic import BaseModel
from typing import List


class GithubProfileSchema(BaseModel):
    name: str | None
    avatar: str
    followers: int
    publicRepos: int
    bio: str | None


class CombinedAnalysisSchema(BaseModel):

    overallAssessment: str

    resumeGithubConsistency: str

    verifiedStrengths: List[str]

    unsupportedClaims: List[str]

    strongestProjects: List[str]

    technicalDepthEvaluation: List[str]

    recruiterImpression: str

    improvementSuggestions: List[str]

    finalVerdict: str


class CombinedResponseSchema(BaseModel):

    profile: GithubProfileSchema

    analysis: CombinedAnalysisSchema
from models.responseSchema import ResponseSchema
from models.comparisonResponseSchema import ComparisonResponseSchema
from models.resumeOutlineSchema import OutlineSchema
from models.githubAnalysisSchema import GithubAnalysisSchema
from models.combinedAnalysisSchema import CombinedAnalysisSchema
import os
from langchain_groq import ChatGroq

from langchain_community.document_loaders import PyPDFLoader
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_classic.schema import Document

from langchain_core.output_parsers import PydanticOutputParser
os.environ['GROQ_API_KEY']=os.getenv("GROQ_SECRET")

llm = ChatGroq(model='meta-llama/llama-4-scout-17b-16e-instruct',max_tokens=500,temperature=0.2)
parser=PydanticOutputParser(pydantic_object=ResponseSchema)
comparison_parser=PydanticOutputParser(pydantic_object=ComparisonResponseSchema)
outline_parser=PydanticOutputParser(pydantic_object=OutlineSchema)
githubAnalysis_parser=PydanticOutputParser(pydantic_object=GithubAnalysisSchema)
combinedAnalysis_parser=PydanticOutputParser(pydantic_object=CombinedAnalysisSchema)
splitter=RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200
)

template=PromptTemplate(
    input_variables=['resume'],
    template='''Analyse and return 'Atsscore' out of 100,'Strengths' and 'Weaknesses' of the resume:
    {resume} 
    in strict json format (very important) like this
    {format}
    Very important:Be honest and abide by the industry standards
    ''',
    partial_variables={'format':JsonOutputParser().get_format_instructions()}
)

chain=template|llm|JsonOutputParser()

userPromptTemplate=PromptTemplate(
    input_variables=['prompt','context'],
    template='''{prompt}. Respond in crisp and concise points in not more than 700 tokens, 
    also suggest fixes if any,
    and preamble should lead to the response list,
    also preamble should be the very summary of what follows ahead in the response.
    context:{context}
        formt={format}

        Very important:Be honest and abide by the industry standards and make sure you answer what is asked directly
    '''  ,
    partial_variables={
        "format":parser.get_format_instructions()
    }
)

chain2=userPromptTemplate|llm|parser

resumeComparisonTemplate=PromptTemplate(
    input_variables=['resume1','resume2'],
    template='''
    Compare these two resumes for:
- technical skills
- project quality
- ATS compatibility(out of 100, judge based on industry standards)
- experience depth
- role suitability
A tight, strict and honest analysis is preferred with no sugar-coating or making the person feel better
context: resume1:{resume1}, resume2:{resume2}
formt={format}

If both resumes are effectively equivalent in quality, skills, and experience,
clearly state that neither resume has a meaningful advantage.
Do not force a winner if differences are negligible.
    '''  ,
    partial_variables={
        "format":comparison_parser.get_format_instructions()
    }
)

chain3=resumeComparisonTemplate|llm|comparison_parser

resumeOutlineTemplate=PromptTemplate(
   input_variables=[
    "role",
    "experience",
    "targetCompany",
    "employmentType",
    "preferredTechStack",
    "country",
    "misc",
    "jd"
],
    template = """
You are an expert resume advisor.

Note: Readme files might or might not be present , they are ignored in the context selection. Also, top 10 project repos are considered at max which means actual number of repos might be more or less.

Target Role:
{role}

Experience Level:
{experience}

Target Company Type:
{targetCompany}

Employment Type:
{employmentType}

Preferred Tech Stack:
{preferredTechStack}

Country / Region:
{country}

Additional Instructions:
{misc}

Job Description:
{jd}

Suggest:
- ideal resume sections 
- important skills to include
- recommended projects
- ATS keywords(in semantics of the role, not random, atleast 5(strict))
- formatting tips
- mistakes to avoid(in points)

Keep the response practical and role-specific. Abide by the industrial standards.

format={format}
""",
partial_variables={
        "format":outline_parser.get_format_instructions()
    }
)

chain4=resumeOutlineTemplate|llm|outline_parser

githubAnalysisTemplate=PromptTemplate(
    input_variables=["repos_summary"],
    template= """
You are an expert software engineering recruiter and portfolio reviewer.

Analyze the following GitHub profile repository summaries.

Repository Summaries:
{repos_summary}

Your task:
1. Evaluate the overall strength of the GitHub profile
2. Identify strongest technical areas
3. Identify weak or missing areas
4. Evaluate project quality and diversity
5. Assess recruiter impression
6. Suggest improvements to make the profile stronger
7. Mention whether the profile appears beginner, intermediate, or advanced
8. Suggest what kinds of projects would improve employability

Important Instructions:
- Be practical and realistic
- Avoid generic motivational advice
- Focus on technical depth, project quality, and portfolio presentation
- Consider consistency, project diversity, and modern tech relevance
- Mention if projects seem tutorial-like or repetitive
- Highlight standout repositories if present

Return the response in structured format
format:{format}

Summary has to be more than 100 words.
""",

partial_variables={
    "format":githubAnalysis_parser.get_format_instructions()
}
)

chain5=githubAnalysisTemplate|llm|githubAnalysis_parser

combinedAnalysis_template=PromptTemplate(
    input_variables=['combined_context'],
    template="""
You are an expert technical recruiter and engineering portfolio evaluator.

Analyze the following candidate information.

The context contains:
1. Resume content
2. GitHub repository summaries

Combined Context:
{combined_context}

Your task:
1. Evaluate whether the GitHub profile supports the resume claims
2. Identify technically verified strengths
3. Identify unsupported or weakly supported claims
4. Evaluate overall technical depth
5. Assess strongest projects
6. Evaluate recruiter impression
7. Suggest concrete improvements
8. Give an overall final assessment

Important Instructions:
- Be practical and realistic
- Avoid generic motivational advice
- Focus on technical credibility and consistency
- Mention mismatches if present
- Mention strong alignment if present
- Consider project quality and relevance
- Be concise but insightful

format:{format}

Important note: Leave no loose ends, be very strict and honest during evaluation.

""",
partial_variables={
    'format':combinedAnalysis_parser.get_format_instructions()
}
)

chain6=combinedAnalysis_template|llm|combinedAnalysis_parser

def sectionTagger(text:str):
    sections={
        "education":"",
        "projects":"",
        "skills":"",
        "experience":""
    }

    currentSec=None
    for line in text.split('\n'):
        lowerline=line.lower().strip()
        if "education" in lowerline.split(" ")[0].replace(":",""):
            currentSec="education"
            
        elif "projects" in lowerline.split(" ")[0].replace(":",""):
            currentSec="projects"
            
        elif "skills" in lowerline.split(" ")[0].replace(":","") or "technical" in lowerline.split(" ")[0].replace(":",""):
            currentSec="skills"
            
        elif "experience" in lowerline.split(" ")[0].replace(":",""):
            currentSec="experience"
            

        if currentSec:
            sections[currentSec]+=line+"\n"
    return sections

def getSections(text:str):
        
        text=text.lower()
        sectionsInPrompt=[]
        if any(word in text for word in ["education", "college", "degree", "study"]):
            sectionsInPrompt.append("education")

        if any(word in text for word in ["project", "projects"]):
            sectionsInPrompt.append("projects")

        if any(word in text for word in ["skill", "skills", "tech", "stack"]):
            sectionsInPrompt.append("skills")

        if any(word in text for word in ["experience", "work", "intern"]):
            sectionsInPrompt.append("experience")

        return sectionsInPrompt

def getContext(contextSec:list[str],sections:dict):
    context=""
    for sec in contextSec:
        context += f"{sec.upper()}:\n{sections[sec]}\n\n"
    return context

def chunkDocument(
    context:str,
    source:str,
    name:str=None
):
    chunks = splitter.split_text(context)

    chunks_doc = [
        Document(
            page_content=chunk,
            metadata={
                "source": source,
                "name": name
            }
        )
        for chunk in chunks
    ]

    return chunks_doc
import React from "react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
const backend = import.meta.env.VITE_BACKEND_URL;
const CombinedAnalysis = () => {
    const navigate=useNavigate()
  const [filename, setfilename] = useState("No file chosen");
  const [error, seterror] = useState("");
  const [response, setresponse] = useState(null);
  const [profile, setprofile] = useState(null);
  const [github, setgithub] = useState("");
  const [query, setquery] = useState("");
  const [queryResponse, setqueryResponse] = useState(null);
   const spinnerText=async (text) => {
      seterror(text)
  }
  const handleSubmit = async (e) => {
    e.preventDefault();
    await spinnerText("Analysing the github profile against the claims in your resume, it will take a moment...")
const token = localStorage.getItem("token");
    let formData = new FormData(e.target);

    if (filename === "No file chosen ") {
      seterror("Select resume first");
      return;
    }

    let res = await fetch(`${backend}/combined/analysis`, {
      method: "POST",
      headers:{
      Authorization:`Bearer ${token}`
   },
      body: formData,
    });
if(res.status==401) {
      localStorage.removeItem("token")
      navigate("/authentication")
      return
    }
    let resJson = await res.json();
    if (!res.ok) seterror(resJson.detail);
    else {
      setresponse(resJson.analysis);
      setprofile(resJson.profile);
      seterror("No error occurrred...");
    }
  };

  const handleSubmit2 = async (e) => {
    e.preventDefault();
    await spinnerText("Working on your query...")
    const token = localStorage.getItem("token");
    if (query === "")
      seterror("Can not proceed...\n\n Query field can not be empty");
    else {
      let formData = new FormData(e.target);

      let res = await fetch(`${backend}/combined/query`, {
        method: "POST",headers:{
      Authorization:`Bearer ${token}`
   },
        body: formData,
      });
if(res.status==401) {
      localStorage.removeItem("token")
      navigate("/authentication")
      return
    }
      let resJson = await res.json();
      if (!res.ok) seterror(resJson.detail);
      else {
        setqueryResponse({ preamble: resJson.preamble, res: resJson.res });
        seterror("No error encountered while responding to your request");
        e.target.reset();
        console.log(resJson);
      }
    }
  };

  return (
    <div className="w-screen h-screen text-white flex flex-col">
       <NavLink to={"/"} className="px-3  flex justify-center items-center" ><lord-icon
                    src="https://cdn.lordicon.com/pgirtdfe.json"
                    trigger="hover"
                    stroke="light"
                    state="hover-partial-roll"
                    colors="primary:#000000,secondary:#000000,tertiary:#000000,quaternary:#ffffff,quinary:#ffffff,senary:#ffffff,septenary:#ffffff"    >
                </lord-icon></NavLink>
      <div className="flex w-full p-2">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full text-xs sm:text-sm">
          <div className="flex justify-between w-full">
            <div className="resume w-full m-2 flex flex-col gap-2">
              <label htmlFor="resume" className="px-3 py-1  bg-blue-600 hover:bg-blue-700 transition-all w-fit rounded-full">Upload resume :</label>
              <input
                id="resume"
                name="file"
                type="file"
                className="border-2 border-white hidden"
                onChange={(e) => {
                  if (e.target.files[0]) setfilename(e.target.files[0].name);
                }}
              />
              <p className="text-blue-700 border-2 border-gray-500 w-full ">
                {" "}
                {filename}{" "}
              </p>
            </div>
            <div className="github w-full m-2 flex flex-col gap-2 ">
              <label htmlFor="github" className="px-3 py-1">Github url :</label>
              <input
                id="github"
                name="githubUrl"
                type="text"
                className=" border-2 border-gray-500 focus:outline-0 w-full"
                onChange={(e) => setgithub(e.target.value)}
              />
            </div>
          </div>
          <button
            type="Submit"
            disabled={filename === "No file chosen" || github === ""}
            className={`self-center bg-white text-black px-3 py-1 rounded-xl hover:bg-gray-400 disabled:bg-gray-400 disabled:cursor-not-allowed    `}
          >
            Analyse
          </button>
        </form>
      </div>

      {profile && response && (
        <div className="w-full flex flex-col sm:flex-row p-2 h-2/3 gap-4">
          <div className="w-full sm:w-2/3 overflow-auto  border-blue-600 border-2  border-dotted p-4 flex flex-col gap-4 h-full">
            <div className=" p-2 flex gap-4 font-bold w-full border-2 border-yellow-500 ">
              <img
                src={`${profile.avatar}`}
                alt="avatar"
                className="w-10 h-10 rounded-full border-2 border-white"
              />
              <div className=" flex flex-col gap-1 w-full">
                <span className=" text-xl">{profile.name || "No name"}</span>

                <span className="text-yellow-500">
                  {profile.bio || "No bio"}
                </span>
                <div className="flex w-full justify-between border border-white px-2 bg-blue-950 py-1">
                  <span>Followers: {profile.followers}</span>
                  <span>Public Repositories: {profile.publicRepos}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-bold text-xl">OverallAssessment:</span>
              <span className="bg-gray-800 p-1 capitalize text-yellow-500 font-light ">
                {" "}
                {response.overallAssessment}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-bold text-xl">
                Resume and github consistency:
              </span>
              <span className="bg-gray-800 p-1 capitalize text-yellow-500 font-light ">
                {" "}
                {response.resumeGithubConsistency}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-bold text-xl">Strongest Projects:</span>

              <span className="bg-gray-800 p-1">
                {" "}
                <ol className="list-disc px-6 text-green-500 font-light ">
                  {response.strongestProjects.map((item, idx) => {
                    return (
                      <li key={idx} className=" capitalize  ">
                        {item}
                      </li>
                    );
                  })}
                </ol>
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="font-bold text-xl">Unsupported claims:</span>

              <span className="bg-gray-800 p-1">
                {" "}
                <ol className="list-disc px-6 text-red-600 font-light ">
                  {response.unsupportedClaims.map((item, idx) => {
                    return (
                      <li key={idx} className=" capitalize  ">
                        {item}
                      </li>
                    );
                  })}
                </ol>
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-bold text-xl">Technical depth:</span>

              <span className="bg-gray-800 p-1">
                {" "}
                <ol className="list-disc px-6 text-yellow-500 font-light ">
                  {response.technicalDepthEvaluation.map((item, idx) => {
                    return (
                      <li key={idx} className=" capitalize  ">
                        {item}
                      </li>
                    );
                  })}
                </ol>
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="font-bold text-xl">Verified Strengths:</span>

              <span className="bg-gray-800 p-1">
                {" "}
                <ol className="list-disc px-6 text-yellow-500 font-light ">
                  {response.verifiedStrengths.map((item, idx) => {
                    return (
                      <li key={idx} className=" capitalize  ">
                        {item}
                      </li>
                    );
                  })}
                </ol>
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="font-bold text-xl">Suggestions:</span>

              <span className="bg-gray-800 p-1">
                {" "}
                <ol className="list-disc px-6 text-green-500 font-light ">
                  {response.improvementSuggestions.map((item, idx) => {
                    return (
                      <li key={idx} className=" capitalize  ">
                        {item}
                      </li>
                    );
                  })}
                </ol>
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="font-bold text-xl">Recruiter impression:</span>
              <span className="bg-gray-800 p-1 capitalize text-yellow-500 font-light ">
                {" "}
                {response.recruiterImpression}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-bold text-xl">Final verdict:</span>
              <span className="bg-gray-800 p-1 capitalize text-yellow-500 font-light ">
                {" "}
                {response.finalVerdict}
              </span>
            </div>
          </div>

          <div className="w-full sm:w-1/3 overflow-auto h-full border-2 border-white border-dotted text-white p-2 flex flex-col gap-4  items-center  ">
            <form onSubmit={handleSubmit2} className="flex flex-col gap-2  ">
              <label htmlFor="query" className="font-extrabold text-2xl">
                Have doubts?, Ask the AI!
              </label>
              <input
                id="query"
                name="query"
                type="text"
                placeholder="What's on your mind?"
                value={query}
                onChange={(e) => setquery(e.target.value)}
                className="border-2 border-white px-2 py-1 italic "
              />

              <button
                type="Submit"
                className={`self-center bg-white text-black px-3 py-1 rounded-xl hover:bg-gray-400 disabled:bg-gray-400 disabled:cursor-not-allowed    `}
              >
                Ask!
              </button>
            </form>

            {queryResponse && (
              <div>
                {" "}
                <p>{queryResponse.preamble}</p>
                <ol className=" flex flex-col gap-2 font-light text-sm list-disc px-6 ">
                  {queryResponse.res.map((item, idx) => {
                    return <li key={idx}> {item} </li>;
                  })}
                </ol>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="m-2 border-2 border-red-600 h-full text-red-600 p-2 overflow-auto">
        {error == "" ? "No error encountered" : error}
      </div>
    </div>
  );
};

export default CombinedAnalysis;

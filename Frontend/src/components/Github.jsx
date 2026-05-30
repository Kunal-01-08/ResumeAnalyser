import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { NavLink } from "react-router-dom";
const backend = import.meta.env.VITE_BACKEND_URL;
const Github = () => {
    const navigate=useNavigate()
  const [error, seterror] = useState("No error occurred...");
  const [response, setresponse] = useState(null);
  const [profile, setprofile] = useState(null);
   const spinnerText=async (text) => {
      seterror(text)
  }
  const handleSubmit = async (e) => {
    e.preventDefault();
    try{
      await spinnerText("Analysing your github profile, please wait...")
const token = localStorage.getItem("token");
    let formData = new FormData(e.target);

    let res = await fetch(`${backend}/github/analyse`, {
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
    if (!res.ok) {
      seterror(resJson.detail);
      setresponse(null);
    } else {
      setresponse(resJson.analysis);
      setprofile(resJson.profile);
      seterror("No error occurrred...");
      console.log(resJson);
    }
    }catch (err) {
    console.error(err);

    seterror(
      "Unable to connect to the server. Please try again in a few moments."
    );
  }
  };
  return (
    <div className="flex w-screen flex-col lg:flex-row h-screen text-white gap-2">
      <div className="w-full h-full flex flex-col gap-2">
        <div className="bg-blue-600 flex justify-center">

       <NavLink to={"/"} className="px-3  flex justify-center items-center bg-blue-800 rounded-full w-fit " ><lord-icon
              src="https://cdn.lordicon.com/pgirtdfe.json"
              trigger="hover"
              stroke="light"
              state="hover-partial-roll"
              colors="primary:#000000,secondary:#000000,tertiary:#000000,quaternary:#ffffff,quinary:#ffffff,senary:#ffffff,septenary:#ffffff"    >
          </lord-icon></NavLink>
                </div>
        <form
          onSubmit={handleSubmit}
          className="w-full flex flex-col gap-2 p-4"
        >
          <div className="flex w-full">
            <label htmlFor="url" className="min-w-35">
              Github profile url:
            </label>
            <input
              type="text"
              name="githubUrl"
              id="url"
              className="outline-1 w-full px-2 focus:bg-white bg-black text-blue-600"
            />
          </div>
          <button
            type="submit"
            className="w-fit px-3 py-1 bg-gray-500 hover:bg-gray-800 rounded-full border-2 border-white  self-center"
          >
            Analyse
          </button>
        </form>
        {response && (
          <div className="summary overflow-auto h-full border-white border-2 border-dotted p-4">
            <p className="font-bold text-xl text-blue-600">Summary:</p>
            {response.summary}
          </div>
        )}

        <div className="error h-full  overflow-auto border-red-600 border-2 border-dotted p-4 text-red-600 font-extralight">
          {error}
        </div>
      </div>
      {profile && response && (
        <div className="w-full overflow-auto border-blue-600 border-2  border-dotted p-4 flex flex-col gap-4">
          <div className=" p-2 flex gap-4 font-bold w-full border-2 border-yellow-500">
            <img
              src={`${profile.avatar}`}
              alt="avatar"
              className="w-10 h-10 rounded-full border-2 border-white"
            />
            <div className=" flex flex-col gap-1 w-full">
              
                <span className=" text-xl">{profile.name || "No name"}</span>
          
                <span className="text-yellow-500">{profile.bio || "No bio"}</span>
              <div className="flex w-full justify-between border border-white px-2 bg-blue-950 py-1">
                <span>Followers: {profile.followers}</span>
                <span>Public Repositories: {profile.publicRepos}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold text-xl">Overall level:</span>
            <span className="bg-gray-800 p-1 capitalize text-yellow-500 font-light ">
              {" "}
              {response.overallLevel}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-bold text-xl">Strongest areas:</span>

            <span className="bg-gray-800 p-1">
              {" "}
              <ol className="list-disc px-6 text-green-500 font-light ">
                {response.strongestAreas.map((item, idx) => {
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
            <span className="font-bold text-xl">Weak areas:</span>

            <span className="bg-gray-800 p-1">
              {" "}
              <ol className="list-disc px-6 text-red-600 font-light ">
                {response.weakAreas.map((item, idx) => {
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
            <span className="font-bold text-xl">Project quality:</span>

            <span className="bg-gray-800 p-1">
              {" "}
              <ol className="list-disc px-6 text-yellow-500 font-light ">
                {response.projectQualityAnalysis.map((item, idx) => {
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
            <span className="font-bold text-xl">Standout projects:</span>

            <span className="bg-gray-800 p-1">
              {" "}
              <ol className="list-disc px-6 text-yellow-500 font-light ">
                {response.standoutProjects.map((item, idx) => {
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
            <span className="font-bold text-xl">Employability:</span>
            <span className="bg-gray-800 p-1 capitalize text-yellow-500 font-light ">
              {" "}
              {response.employabilityAssessment}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Github;

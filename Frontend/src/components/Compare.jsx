import React from "react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
const backend = import.meta.env.VITE_BACKEND_URL;
const Compare = () => {
    const navigate=useNavigate()
  const [filename1, setfilename1] = useState("No file chosen");
  const [filename2, setfilename2] = useState("No file chosen");
  const [error, seterror] = useState("");
  const [response, setresponse] = useState({});
 const spinnerText=async (text) => {
      seterror(text)
  }
  const handleSubmit = async (e) => {
    e.preventDefault();
    try{
      await spinnerText("Comparing the resumes and preparing the result for you...")
const token = localStorage.getItem("token");
    let formData = new FormData(e.target);

    if (filename1 === "No file chosen") {
      seterror("Select resume for candidate A");
      return;
    }
    if (filename2 === "No file chosen") {
      seterror("Select resume for candidate B");
      return;
    }

    let res = await fetch(`${backend}/resume/compare`, {
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
      setresponse(resJson);
      seterror("");
    }
    }catch (err) {
    console.error(err);

    seterror(
      "Unable to connect to the server. Please try again in a few moments."
    );
  }
  };

  return (
    <div className="w-screen h-screen text-white flex flex-col justify-between text-xs sm:text-sm">
        <div className="w-full  bg-blue-600 flex justify-center h-fit py-1 overflow-auto" >

<NavLink to={"/"} className="px-3  flex justify-center items-center h-fit w-fit bg-blue-800 rounded-full py-1" ><lord-icon
    src="https://cdn.lordicon.com/pgirtdfe.json"
    trigger="hover"
    stroke="light"
    state="hover-partial-roll"
    colors="primary:#000000,secondary:#000000,tertiary:#000000,quaternary:#ffffff,quinary:#ffffff,senary:#ffffff,septenary:#ffffff"    className="h-5 w-5">
</lord-icon></NavLink>
      </div>
      <div className="flex w-full p-2 h-10/60">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full h-full">
          <div className="flex justify-between w-full">
            <div className="resume1 w-full m-2 flex flex-col gap-2">
              <label htmlFor="resume1"  className="px-3 py-1  bg-blue-600 hover:bg-blue-700 transition-all w-fit rounded-full text-[10px] sm:text-xs">Upload resume (A):</label>
              <input
                id="resume1"
                name="file1"
                type="file"
                className="border-2 border-white hidden"
                onChange={(e) => {
                  if (e.target.files[0]) setfilename1(e.target.files[0].name);
                }}
              />
              <p className="text-blue-700 border-2 border-gray-500 px-2 text-[10px] sm:text-xs">
                {" "}
                {filename1}{" "}
              </p>
            </div>
            <div className="resume2 w-full m-2 flex flex-col gap-2">
              <label htmlFor="resume2"  className="px-3 py-1  bg-blue-600 hover:bg-blue-700 transition-all w-fit rounded-full text-[10px] sm:text-xs">Upload resume (B):</label>
              <input
                id="resume2"
                name="file2"
                type="file"
                className="border-2 border-white hidden"
                onChange={(e) => {
                  if (e.target.files[0]) setfilename2(e.target.files[0].name);
                }}
              />
              <p className="text-blue-700 border-2 border-gray-500 px-2 text-[10px] sm:text-xs">
                {" "}
                {filename2}{" "}
              </p>
            </div>
          </div>
          <button
            type="Submit"
            disabled={
              filename1 === "No file chosen" || filename2 === "No file chosen"
            }
            className={`self-center bg-white text-black px-3 py-1 rounded-xl hover:bg-gray-400 disabled:bg-gray-400 disabled:cursor-not-allowed    `}
          >
            Compare
          </button>
        </form>
      </div>
      {response.resume1 && response.resume2 && (
        <div className="flex flex-col h-1/2">
          {" "}
          <div className="flex h-8/11 py-2">
            <div className="w-full mx-2 border-2 border-blue-700 p-2 rounded-2xl h-full overflow-auto">
              <p className="font-extrabold sm:text-xl text-gray-400">
                Candidate A analysis:
              </p>
              <p className="p-2 italic">{response.resume1.conclusion}</p>
              <ul className="list-disc px-4 text-yellow-500 italic font-extralight">
                {response.resume1.strengths.map((i, idx) => {
                  return <li key={idx}>{i}</li>;
                })}
              </ul>
            </div>
            <div className="w-full mx-2 border-2 border-blue-700 p-2 rounded-2xl max-h-full overflow-auto">
              <p className="font-extrabold sm:text-xl text-gray-400">
                Candidate B analysis:
              </p>
              <p className="p-2 italic">{response.resume2.conclusion}</p>

              <ul className="list-disc px-4 text-yellow-500 italic font-extralight">
                {response.resume2.strengths.map((i, idx) => {
                  return <li key={idx}>{i}</li>;
                })}
              </ul>
            </div>
          </div>
          <div className="flex py-2 h-3/11">
            <div className="w-full h-full mx-2 border-2 border-gray-400 p-2 rounded-2xl">
              <p className="font-extrabold sm:text-xl text-gray-400">
                ATS-score for Candidate A :
              </p>
              <span className="font-extrabold italic text-2xl text-green-500 ">
                {response.resume1.ats_score}
              </span>
              <span className="font-bold text-gray-400">/100</span>
            </div>
            <div className="w-full mx-2 border-2 h-full border-gray-400 p-2 rounded-2xl">
              <p className="font-extrabold sm:text-xl text-gray-400">
                ATS-score for Candidate B :
              </p>
              <span className="font-extrabold italic text-2xl text-green-500 ">
                {response.resume2.ats_score}
              </span>
              <span className="font-bold text-gray-400">/100</span>
            </div>
          </div>
        </div>
      )}
      {response.comparison_summary && (
        <div className="border-2 border-gray-400 m-2 p-2 h-1/6 overflow-auto rounded-2xl">
          <p className="font-extrabold text-xl sm:text-2xl text-gray-400">
            Comparison summary:
          </p>
          <p className="text-sm sm:text-xl font-bold italic ">
            {response.comparison_summary}
          </p>
        </div>
      )}
      <div className="m-2 border-2  border-red-600 h-1/10 text-red-600 p-2 overflow-auto">
        {error == "" ? "No error encountered while responding to your request" : error}
      </div>
    </div>
  );
};

export default Compare;

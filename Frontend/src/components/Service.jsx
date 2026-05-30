import React from "react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { NavLink } from "react-router-dom";
const backend = import.meta.env.VITE_BACKEND_URL;
const Service = () => {
  const navigate = useNavigate()
  const [filename, setfilename] = useState("No file chosen");
  const [strengths, setstrengths] = useState([]);
  const [resume, setresume] = useState("");
  const [query, setquery] = useState("");
  const [weaknesses, setweaknesses] = useState([]);
  const [ats, setats] = useState(null)
  const [error, seterror] = useState(
    "---",
  );
  const [queryResponse, setqueryResponse] = useState({ preamble: "", res:[] });
  const spinnerText=async (text) => {
      seterror(text)
  }
  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    await spinnerText("Our AI is analysing your resume...");

    const token = localStorage.getItem("token");
    const formData = new FormData(e.target);

    const res = await fetch(`${backend}/resume/analyse`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (res.status === 401) {
      localStorage.removeItem("token");
      navigate("/authentication");
      return;
    }

    const resJson = await res.json();

    if (!res.ok) {
      seterror(resJson.detail || "An unexpected error occurred.");
      return;
    }

    setstrengths(resJson.Response.Strengths);
    setweaknesses(resJson.Response.Weaknesses);
    setresume(resJson.Resume);
    setats(resJson.Response.Atsscore);
    seterror("No error encountered while responding to your request");
  } catch (err) {
    console.error(err);

    seterror(
      "Unable to connect to the server. Please try again in a few moments."
    );
  }
};

  const handleSubmit2 = async (e) => {
    e.preventDefault();
    try{
    await spinnerText("Working on your query...")
    const token = localStorage.getItem("token");
    if (resume === "")
      seterror("Can not proceed.... \nPlease upload the resume first");
    else if (query === "")
      seterror("Can not proceed...\nQuery field can not be empty");
    else {
        let formData = new FormData(e.target);
        formData.append("resume", resume);
        let result = await fetch(`${backend}/resume/query`, {
          method: "POST",headers:{
      Authorization:`Bearer ${token}`
   },
          body: formData,
        });
if(result.status==401) {
      localStorage.removeItem("token")
      navigate("/authentication")
      return
    }
        let resJson = await result.json();
        if (!result.ok) seterror(resJson.detail);
        else {
          setqueryResponse({ preamble: resJson.preamble, res: resJson.res });
          seterror("No error encountered while responding to your request");
          e.target.reset();
          console.log(resJson);
        }
    }
    }catch (err) {
    console.error(err);

    seterror(
      "Unable to connect to the server. Please try again in a few moments."
    );
  }
  
  };

  return (
    <div className="bg-black w-screen h-screen flex flex-col md:flex-row gap-2 text-xs sm:text-sm">
      <div className="h-3/10 md:h-full  w-full   flex flex-col  ">
      <div className="flex justify-center w-full  bg-blue-600">

          <NavLink to={"/"} className="px-3  flex justify-center items-center w-fit rounded-full bg-blue-800" ><lord-icon
              src="https://cdn.lordicon.com/pgirtdfe.json"
              trigger="hover"
              stroke="light"
              state="hover-partial-roll"
              colors="primary:#000000,secondary:#000000,tertiary:#000000,quaternary:#ffffff,quinary:#ffffff,senary:#ffffff,septenary:#ffffff"    >
          </lord-icon></NavLink>
                </div>
        <div className="h-3/4 border-b-0 border-white border-2 border-dotted  text-white p-3 flex  flex-row md:flex-col  justify-between gap-2 overflow-auto w-full">
        <div className="w-full px-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full">
            <intryput
              id="resume"
              name="file"
              type="file"
              className="border-2 border-white hidden"
              onChange={(e) => {
                if (e.target.files[0]) setfilename(e.target.files[0].name);
              }}
            />
            <div className="flex flex-col xl:flex-row gap-2 py-4">

              <label htmlFor="resume" className="px-3 py-1  bg-blue-600 hover:bg-blue-700 transition-all text-nowrap w-fit rounded-full">Choose resume</label>
            <p className="text-blue-700 border-2 border-dotted border-gray-500 w-full px-2">
              {" "}
              {filename}{" "}
            </p>
            </div>
            <button
              type="Submit"
              disabled={filename === "No file chosen"}
              className={`self-center bg-white text-black px-3 py-1 rounded-xl hover:bg-gray-400 disabled:bg-gray-400 disabled:cursor-not-allowed    `}
            >
              Analyze resume
            </button>
          </form></div>
        {ats && 
          <div className="bg-yellow-500 border-3 p-2 px-4 border-dotted border-blue-700 flex flex-col self-center text-xl sm:text-2xl h-fit w-full"> 
             <p className="text-white  w-full">
              Ats score:
             </p>
             <div className="flex  justify-between w-full"><p className="text-green-800">{ats && ats}</p><p>/100</p></div>
          </div>
        }
        </div>

       
        <div className="h-1/4  border-dotted border-2 text-red-600 p-2 overflow-auto ">
          {error}
        </div>
      </div>

      <div className="h-3/10 md:h-full overflow-auto  w-full  flex md:flex-col bg-black ">
        <div className="h-full  bg-black w-full border-white  border-2 border-dotted text-yellow-500 overflow-auto p-2">
          <p className="text-white">Strengths of your resume -</p>
          <ol className=" flex flex-col gap-2 font-light text-sm list-disc px-6 ">
            {strengths && strengths.map((item, idx) => {
              return <li key={idx}> {item} </li>;
            })}
          </ol>
        </div>
        <div className="h-full bg-black w-full border-white border-2 border-dotted text-yellow-500 overflow-auto p-2">
          <p className="text-white">Weaknesses of your resume -</p>

          <ol className=" flex flex-col gap-2 font-light text-sm list-disc px-6 ">
            {weaknesses && weaknesses.map((item, idx) => {
              return <li key={idx}> {item} </li>;
            })}
          </ol>
        </div>
      </div>
      <div className="h-2/5 md:h-full border-2 overflow-auto border-white border-dotted w-full  text-white p-2 flex flex-col gap-4  items-center  ">
        <form onSubmit={handleSubmit2} className="flex flex-col gap-2  "> 
          <label htmlFor="query" className="font-extrabold sm:text-2xl">Have doubts?, Ask the AI!</label>
          <input
            id="query"
            name="query"
            type="text"
            value={query}
            onChange={(e) => setquery(e.target.value)}
            className="border-2 border-white px-2 py-1"
          />

          <button
            type="Submit"
            className={`self-center bg-white text-black px-3 py-1 rounded-xl hover:bg-gray-400 disabled:bg-gray-400 disabled:cursor-not-allowed    `}
          >
            Ask!
          </button>
        </form>

        <p>{queryResponse.preamble}</p>
         <ol className=" flex flex-col gap-2 font-light text-sm list-disc px-6 ">
            {queryResponse.res.map((item, idx) => {
              return <li key={idx}> {item} </li>;
            })}
          </ol>
      </div>
    </div>
  );
};

export default Service;

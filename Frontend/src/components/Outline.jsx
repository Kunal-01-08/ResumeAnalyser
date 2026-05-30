import React from "react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
const backend = import.meta.env.VITE_BACKEND_URL;
const Outline = () => {
  const navigate=useNavigate()
  const [error, seterror] = useState("No error occurred...");
  const [response, setresponse] = useState(null);
 const spinnerText=async (text) => {
      seterror(text)
  }
  const handleSubmit = async (e) => {
    e.preventDefault();
   try{
     await spinnerText("Generating the resume outline for you, it will take a moment...")
const token = localStorage.getItem("token");
    let formData = new FormData(e.target);

    if (!formData.get("role")) {
      seterror("Please select a role first");
      return;
    }
    if (!formData.get("experience")) {
      seterror("Please select an experience first");
    }

    let res = await fetch(`${backend}/resume/outline`, {
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
      seterror("No error occurred...");
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
    <div className="flex flex-col lg:flex-row w-screen h-screen text-white text-xs ">
         <div className="flex flex-col px-1 justify-center bg-blue-600 "><NavLink to={"/"} className="px-3  h-fit w-fit flex justify-center items-center bg-blue-800 rounded-full" ><lord-icon
                      src="https://cdn.lordicon.com/pgirtdfe.json"
                      trigger="hover"
                      stroke="light"
                      state="hover-partial-roll"
                      colors="primary:#000000,secondary:#000000,tertiary:#000000,quaternary:#ffffff,quinary:#ffffff,senary:#ffffff,septenary:#ffffff"    >
                  </lord-icon></NavLink></div>
      <div className="w-full h-full flex flex-col overflow-auto p-4">
        <form
          onSubmit={handleSubmit}
          className="w-full flex flex-col h-fit p-4"
        >
          <div className="h-fit p-2 flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <label htmlFor="role" className="min-w-[120px]">
                Target Role<span className="text-red-500"> * </span>:
              </label>

              <select
                id="role"
                name="role"
                className="w-full border-2 border-white bg-black text-white p-2 rounded-lg"
              >
                <option value="">Select Target Role</option>

                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Backend Developer">Backend Developer</option>
                <option value="Full Stack Developer">
                  Full Stack Developer
                </option>
                <option value="Machine Learning Engineer">
                  Machine Learning Engineer
                </option>
                <option value="Data Analyst">Data Analyst</option>
                <option value="DevOps Engineer">DevOps Engineer</option>
                <option value="Software Engineer">Software Engineer</option>
                <option value="Mobile App Developer">
                  Mobile App Developer
                </option>
                <option value="Cybersecurity Engineer">
                  Cybersecurity Engineer
                </option>
                <option value="Cloud Engineer">Cloud Engineer</option>
              </select>
            </div>

            <div className="flex items-start gap-4">
              <label htmlFor="experience" className="min-w-[120px]">
                Experience Level<span className="text-red-500"> * </span>:
              </label>

              <select
                id="experience"
                name="experience"
                className="w-full border-2 border-white bg-black text-white p-2 rounded-lg"
              >
                <option value="">Select Experience Level</option>

                <option value="Fresher">Fresher</option>
                <option value="Internship Experience">
                  Internship Experience
                </option>
                <option value="0-1 Years">0-1 Years</option>
                <option value="1-3 Years">1-3 Years</option>
                <option value="3-5 Years">3-5 Years</option>
                <option value="5+ Years">5+ Years</option>
              </select>
            </div>

            <p className="font-extrabold text-gray-600">Optional details</p>

            <div className="flex items-start gap-4">
              <label htmlFor="targetCompany" className="min-w-[120px]">
                Target Company:
              </label>

              <select
                id="targetCompany"
                name="targetCompany"
                className="w-full border-2 border-white bg-black text-white p-2 rounded-lg"
              >
                <option value="">Select Target Company Type</option>

                <option value="FAANG">FAANG</option>
                <option value="Product Based Company">
                  Product Based Company
                </option>
                <option value="Startup">Startup</option>
                <option value="Service Based Company">
                  Service Based Company
                </option>
                <option value="Research Organization">
                  Research Organization
                </option>
                <option value="Remote First Company">
                  Remote First Company
                </option>
              </select>
            </div>

            <div className="flex items-start gap-4">
              <label htmlFor="employmentType" className="min-w-[120px]">
                Employment Type:
              </label>

              <select
                id="employmentType"
                name="employmentType"
                className="w-full border-2 border-white bg-black text-white p-2 rounded-lg"
              >
                <option value="">Select Employment Type</option>

                <option value="Internship">Internship</option>
                <option value="Full Time">Full Time</option>
                <option value="Part Time">Part Time</option>
                <option value="Freelance">Freelance</option>
                <option value="Contract">Contract</option>
              </select>
            </div>

            <div className="flex items-start gap-4">
              <label htmlFor="preferredTechStack" className="min-w-[120px]">
                Preferred Tech Stack:
              </label>

              <input
                id="preferredTechStack"
                type="text"
                name="preferredTechStack"
                placeholder="e.g. MERN, FastAPI, TensorFlow"
                className="w-full border-2 border-white bg-black text-white p-2 rounded-lg"
              />
            </div>

            <div className="flex items-start gap-4">
              <label htmlFor="country" className="min-w-[120px]">
                Country / Region:
              </label>

              <select
                id="country"
                name="country"
                className="w-full border-2 border-white bg-black text-white p-2 rounded-lg"
              >
                <option value="">Select Country / Region</option>

                <option value="India">India</option>
                <option value="USA">USA</option>
                <option value="Canada">Canada</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Europe">Europe</option>
                <option value="Australia">Australia</option>
                <option value="Remote / Global">Remote / Global</option>
              </select>
            </div>

            <div className="flex items-start gap-4">
              <label htmlFor="jd" className="min-w-[120px] pt-2">
                Job Description:
              </label>

              <textarea
                name="jd"
                id="jd"
                className="w-full outline-1 outline-white p-2 rounded-lg"
              ></textarea>
            </div>

            <div className="flex items-start gap-4">
              <label htmlFor="misc" className="min-w-[120px] pt-2">
                Additional Directions:
              </label>

              <textarea
                name="misc"
                id="misc"
                className="w-full outline-1 outline-white p-2 rounded-lg"
              ></textarea>
            </div>
          </div>
          <button type="Submit" className="px-3 py-1 bg-gray-500 rounded-full border-2 border-white hover:bg-gray-700 w-fit self-center ">Submit</button>
        </form>
        <div className="w-full text-red-600 border-2  border-red-600 p-2 h-full min-h-30 overflow-auto">
          {error}
        </div>
      </div>

      {response && (
        <div className="w-full h-full border-2 border-blue-500 p-4 flex flex-col gap-2 overflow-auto">
          <p className=" font-extrabold text-2xl text-gray-500">Outline for you resume:</p>
          <p className="font-bold text-xl">Sections:</p>
          <ol className="flex flex-col gap-4 px-8 py-2 bg-gray-900 list-decimal border-2 border-white border-dotted  ">
            {response.sections && response.sections.map((item, idx) => {
              return (
                <li key={idx} className="italic text-[17px]">
                    <div className="p-2">

                  <span className="text-yellow-500 font-bold">{item.name}</span>
                  <span> : </span>
                  <span className=" text-[14px]">{item.desc}</span>
                    </div>

                  <ul className="list-disc flex flex-col gap-2 text-[14px]">
                    {item.points.map((i,id)=>{
                        return <li key={id} className=" text-blue-500">
                                {i}
                        </li>
                    })}
                  </ul>
                </li>
              );
            })}
          </ol>
          <p className="font-bold text-xl">ATS-Keywords</p>
           <ol className="flex flex-col  px-8 py-2 bg-gray-900 list-decimal border-2 border-white border-dotted ">
            { response.ats_keywords && response.ats_keywords.map((item, idx) => {
              return (
                <li key={idx} className="italic text-[17px]">
                    <div className="p-1">

                  <span className="text-yellow-500">{item}</span>
                 
                    </div>

                </li>
              );
            })}
          </ol>
           <p className="font-bold text-xl">Common pitfalls</p>
           <ol className="flex flex-col  px-8 py-2 bg-gray-900 list-decimal border-2 border-white border-dotted">
            {response.mistakes && response.mistakes.map((item, idx) => {
              return (
                <li key={idx} className="italic text-[17px]">
                    <div className="p-1">

                  <span className="text-red-600">{item}</span>
                 
                    </div>

                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
};

export default Outline;

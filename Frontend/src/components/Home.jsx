import React from "react";
import { NavLink } from "react-router-dom";
import { useState } from "react";

const Home = () => {
  const [options, setoptions] = useState(1);
  return (
    <div
      className="w-screen min-h-screen bg-black text-white p-4 flex flex-col gap-10"
      onClick={() => setoptions(0)}
    >
      <div className="flex justify-between">
        <div>
          <span className="text-2xl sm:text-5xl font-extrabold">Resume</span>
          <span className="text-2xl sm:text-5xl font-extrabold text-red-700">Analyser</span>
        </div>
        <NavLink
          to="/authentication"
          className="py-2 px-1 sm:px-3 bg-blue-950 rounded-full flex justify-center items-center transition-all duration-50 hover:scale-101 hover:bg-blue-600 text-xs"
        >
          Signup/ Login
        </NavLink>
      </div>
      <div className="flex flex-col gap-6 lg:flex-row items-center">
        <div className="flex flex-col gap-4 justify-between w-full lg:w-3/4 2xl:w-1/2">
          <div className="flex flex-col items-center md:flex-row w-full min-h-40 gap-12 px-6 ">
            <div className="flex items-center w-fit  mx-auto relative">
              <div className=" h-15 w-15 flex justify-center items-center absolute left-1/2 -translate-x-1/2 ">
                <lord-icon
                  src="https://cdn.lordicon.com/oxgyjdir.json"
                  trigger="click"
                  colors="primary:#000000,secondary:#ffffff"
                  className="h-10 w-10 hover:h-12 hover:w-12   "
                  onClick={(e) => {
                    e.stopPropagation();
                    setoptions(1);
                  }}
                ></lord-icon>
              </div>

              <ul
                className={`rounded-2xl bg-gray-900 overflow-hidden
  transition-all duration-100 ease-in 

  ${
    options == 1
      ? "opacity-100 h-fit min-w-85 translate-x-0"
      : "opacity-100 h-0 w-0 -translate-x-50 pointer-events-none"
  }`}
              >
                <li className="transition-all duration-100 ease-in-out  hover:bg-black border-gray-700 border hover:text-yellow-500 hover:text-shadow cursor-pointer font-bold text-[15px] hover:font-extrabold hover:text-[16px] h-7  flex justify-center items-center w-full">
                  <NavLink to="/service">Deep resume analysis</NavLink>
                </li>
                <li className="transition-all duration-100 ease-in-out  hover:bg-black border-gray-700 border hover:text-yellow-500 hover:text-shadow cursor-pointer font-bold text-[15px] hover:font-extrabold hover:text-[16px] h-7 flex justify-center items-center w-full">
                  <NavLink to="/compare">Compare resumes</NavLink>
                </li>
                <li className="transition-all duration-100 ease-in-out  hover:bg-black border-gray-700 border hover:text-yellow-500 hover:text-shadow cursor-pointer font-bold text-[15px] hover:font-extrabold hover:text-[16px] h-7 flex justify-center items-center w-full">
                  <NavLink to="/outline">
                    Role based resume outline suggestions
                  </NavLink>
                </li>
                <li className="transition-all duration-100 ease-in-out  hover:bg-black border-gray-700 border hover:text-yellow-500 hover:text-shadow cursor-pointer font-bold text-[15px] hover:font-extrabold hover:text-[16px] h-7 flex justify-center items-center w-full">
                  <NavLink to="/github">Github profile analysis</NavLink>
                </li>
                <li className="transition-all duration-100 ease-in-out  hover:bg-black border-gray-700 border hover:text-yellow-500 hover:text-shadow cursor-pointer font-bold text-[15px] hover:font-extrabold hover:text-[16px] h-7 flex justify-center items-center w-full">
                  <NavLink to="/combinedAnalysis">Combined analysis</NavLink>
                </li>
              </ul>
            </div>
            
              <a
                href="tel:+918287946279"
                className="p-2 w-full h-40 bg-[#43424268] hover:border hover:border-yellow-500 hover:scale-101 group  rounded-full   flex justify-start items-center transition-all duration-200  cursor-pointer "
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText("+91 8287946279");
                  alert("Phone number is copied to clipbaord");
                }}
              >
                <lord-icon
    src="https://cdn.lordicon.com/vyyhrdzw.json"
    trigger="loop"
              id="githubIcon"
              stroke="bold"
              className="h-40 w-40 "
    // colors="primary:#ffffff,secondary:#ffffff,tertiary:#000000"
    >
</lord-icon>
                <div className="flex flex-col justify-center h-full gap-2">
                  <span className="text-xl text-wrap wrap-break-word flex-wrap sm:text-2xl 2xl:text-4xl font-bold">Contact number</span>
                  <span className="text-sm sm:text-xl italic transition-all text-wrap wrap-break-word duration-200 group-hover:text-blue-600 group-hover:scale-101">
                    {" "}
                    +91 8287946279
                  </span>
                </div>
              </a>
            
          </div>
          <a
            href="https://github.com/Kunal-01-08"
            className="p-2 h-40 bg-[#43424268] hover:border hover:border-yellow-500 hover:scale-101 group  rounded-full mx-6 flex justify-start items-center transition-all duration-200 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <lord-icon
              src="https://cdn.lordicon.com/lllcnxva.json"
              trigger="loop"
              id="githubIcon"
              stroke="bold"
              className="h-40 w-40 "
              // colors="primary:#000000,secondary:#000000,tertiary:#ffffff"
            ></lord-icon>
            <div className="flex flex-col justify-center h-full gap-2">
              <span className="text-xl text-wrap wrap-break-word flex-wrap sm:text-2xl 2xl:text-4xl font-bold">Github profile</span>
              <span className="text-sm sm:text-xl italic transition-all text-wrap wrap-break-word duration-200 group-hover:text-blue-600 group-hover:scale-105">
                {" "}
                https://github.com/Kunal-01-08
              </span>
            </div>
          </a>
          <a
            href="mailto:vishuzado@gmail.com"
            className="p-2 h-40 bg-[#43424268] hover:border  hover:border-yellow-500 hover:scale-101 group  rounded-full mx-6 flex justify-start items-center transition-all duration-200  cursor-pointer "
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText("vishuzado@gmail.com");
              alert("Email is copied to clipbaord");
            }}
          >
            <lord-icon
              src="https://cdn.lordicon.com/ozlkyfxg.json"
              trigger="loop"
              stroke="bold"
              // colors="primary:#ffffff,secondary:#ffffff"
              id="gmailIcon"
              className="h-30 w-30"
            ></lord-icon>
            <div className="flex flex-col justify-center h-full gap-2">
              <span className="text-xl text-wrap wrap-break-word flex-wrap sm:text-2xl 2xl:text-4xl font-bold">Email address</span>
              <span className="text-sm sm:text-xl italic transition-all text-wrap wrap-break-word duration-200 group-hover:text-blue-600 group-hover:scale-101">
                {" "}
                vishuzado@gmail.com
              </span>
            </div>
          </a>
        </div>

        <div className="w-full lg:w-1/4 2xl:w-1/2 overflow-hidden h-120 bg-blue-950 rounded-2xl">
          <div className="about text-yellow-600 w-full  h-fit p-4 rounded-4xl flex flex-col animate-[up_40s_linear_infinite] hover:[animation-play-state:paused]">
            <div className="flex flex-col gap-10 text-white">
              <section className="flex flex-col gap-4">
                <h1 className="text-4xl font-extrabold text-yellow-400">
                  About Us
                </h1>

                <span className="text-lg leading-8 text-gray-300">
                  In today&rsquo;s competitive technology landscape, resumes are
                  no longer judged solely on formatting or keyword optimization.
                  Recruiters, hiring teams, and technical evaluators
                  increasingly look beyond surface-level presentation to
                  understand the depth of a candidate&rsquo;s practical
                  abilities, project experience, consistency, and real-world
                  implementation skills.
                </span>
              </section>

              <section className="flex flex-col gap-4">
                <h2 className="text-3xl font-bold text-yellow-300">
                  Our Purpose
                </h2>

                <span className="text-lg leading-8 text-gray-300">
                  Our platform was created to bridge the gap between traditional
                  resume screening and actual technical capability evaluation.
                  Instead of focusing only on ATS keywords and resume
                  formatting, we combine resume analysis, GitHub evaluation,
                  contextual retrieval systems, and AI-driven assessment
                  workflows to create a more meaningful profile evaluation
                  experience for developers and software engineers.
                </span>
              </section>

              <section className="flex flex-col gap-5">
                <h2 className="text-3xl font-bold text-yellow-300">
                  Deep Resume Analysis
                </h2>

                <span className="text-lg leading-8 text-gray-300">
                  Our deep resume analysis system evaluates resumes
                  structurally, contextually, and technically rather than
                  relying solely on keyword matching. The platform examines how
                  effectively a candidate communicates their technical skills,
                  projects, and impact.
                </span>

                <ul className="list-disc ml-8 text-gray-300 text-lg leading-8 flex flex-col gap-2">
                  <li>Resume structure and readability</li>
                  <li>Project quality and technical depth</li>
                  <li>Skill relevance and consistency</li>
                  <li>Impact-oriented project descriptions</li>
                  <li>Section clarity and organization</li>
                  <li>Alignment with modern hiring expectations</li>
                </ul>
              </section>

              <section className="flex flex-col gap-5">
                <h2 className="text-3xl font-bold text-yellow-300">
                  GitHub Profile Analysis
                </h2>

                <span className="text-lg leading-8 text-gray-300">
                  For developers, practical implementation matters immensely.
                  Our GitHub analysis system evaluates repositories, README
                  files, project documentation, and repository organization to
                  better understand a candidate&rsquo;s engineering
                  capabilities.
                </span>

                <ul className="list-disc ml-8 text-gray-300 text-lg leading-8 flex flex-col gap-2">
                  <li>Repository quality and complexity</li>
                  <li>Project consistency and maintainability</li>
                  <li>Technical stack diversity</li>
                  <li>README and documentation quality</li>
                  <li>Open-source credibility</li>
                  <li>Engineering practices and presentation</li>
                </ul>
              </section>

              <section className="flex flex-col gap-5">
                <h2 className="text-3xl font-bold text-yellow-300">
                  Combined Resume + GitHub Evaluation
                </h2>

                <span className="text-lg leading-8 text-gray-300">
                  One of the most powerful features of our platform is combined
                  analysis. Instead of evaluating resumes and GitHub profiles
                  separately, our system compares both sources together to
                  determine whether technical claims are genuinely supported by
                  practical work.
                </span>

                <ul className="list-disc ml-8 text-gray-300 text-lg leading-8 flex flex-col gap-2">
                  <li>Verification of listed technical skills</li>
                  <li>Consistency between projects and resume claims</li>
                  <li>Technical authenticity assessment</li>
                  <li>Project credibility evaluation</li>
                  <li>Identification of unsupported claims</li>
                </ul>
              </section>

              <section className="flex flex-col gap-5">
                <h2 className="text-3xl font-bold text-yellow-300">
                  Retrieval-Augmented AI System
                </h2>

                <span className="text-lg leading-8 text-gray-300">
                  Our platform uses retrieval-augmented generation workflows to
                  create context-aware responses. Instead of relying only on
                  static prompting, the system retrieves relevant information
                  dynamically from resumes, repositories, and project
                  documentation during AI interactions.
                </span>

                <ul className="list-disc ml-8 text-gray-300 text-lg leading-8 flex flex-col gap-2">
                  <li>Multi-source contextual retrieval</li>
                  <li>Project-aware AI responses</li>
                  <li>Document embedding systems</li>
                  <li>Contextual follow-up querying</li>
                  <li>Improved response grounding and accuracy</li>
                </ul>
              </section>

              <section className="flex flex-col gap-5">
                <h2 className="text-3xl font-bold text-yellow-300">
                  Role-Based Resume Guidance
                </h2>

                <span className="text-lg leading-8 text-gray-300">
                  Different software engineering roles demand different
                  strengths. Our platform helps users tailor their resumes
                  according to specific career paths and industry expectations.
                </span>

                <ul className="list-disc ml-8 text-gray-300 text-lg leading-8 flex flex-col gap-2">
                  <li>Backend engineering resume guidance</li>
                  <li>Frontend-focused profile optimization</li>
                  <li>Full-stack role alignment</li>
                  <li>Technology stack prioritization</li>
                  <li>Project presentation recommendations</li>
                </ul>
              </section>

              <section className="flex flex-col gap-5">
                <h2 className="text-3xl font-bold text-yellow-300">
                  Resume Comparison System
                </h2>

                <span className="text-lg leading-8 text-gray-300">
                  Our comparison engine allows users to compare multiple resumes
                  and identify differences in structure, clarity, technical
                  impact, and overall effectiveness.
                </span>

                <ul className="list-disc ml-8 text-gray-300 text-lg leading-8 flex flex-col gap-2">
                  <li>Resume version comparison</li>
                  <li>Project description optimization</li>
                  <li>Technical communication evaluation</li>
                  <li>Resume readability assessment</li>
                  <li>Professional presentation analysis</li>
                </ul>
              </section>

              <section className="flex flex-col gap-5">
                <h2 className="text-3xl font-bold text-yellow-300">
                  Authentication & Personalized Infrastructure
                </h2>

                <span className="text-lg leading-8 text-gray-300">
                  To support scalable and secure multi-user workflows, our
                  platform incorporates authentication systems and user-isolated
                  retrieval infrastructure. Each user interacts with their own
                  protected AI environment and vector database context.
                </span>

                <ul className="list-disc ml-8 text-gray-300 text-lg leading-8 flex flex-col gap-2">
                  <li>JWT-based authentication</li>
                  <li>User-specific vector retrieval systems</li>
                  <li>Protected AI endpoints</li>
                  <li>Personalized querying workflows</li>
                  <li>Scalable multi-user architecture</li>
                </ul>
              </section>

              <section className="flex flex-col gap-5">
                <h2 className="text-3xl font-bold text-yellow-300">
                  Our Vision
                </h2>

                <span className="text-lg leading-8 text-gray-300">
                  We believe technical profile evaluation should focus on
                  genuine engineering capability rather than superficial
                  optimization strategies. Strong developers should be
                  recognized for what they can actually build, explain, and
                  maintain.
                </span>

                <ul className="list-disc ml-8 text-gray-300 text-lg leading-8 flex flex-col gap-2">
                  <li>Encouraging authentic technical growth</li>
                  <li>Promoting project-driven credibility</li>
                  <li>Improving transparency in evaluation</li>
                  <li>Helping developers identify weak areas</li>
                  <li>Building smarter AI-powered career tools</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

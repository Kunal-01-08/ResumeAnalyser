import React, { useState } from "react";
import { NavLink } from "react-router-dom";
const backend = import.meta.env.VITE_BACKEND_URL;

const Authentication = () => {
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);

    const endpoint = isLogin ? "login" : "signup";

    try {
      const res = await fetch(`${backend}/${endpoint}`, {
        method: "POST",
        body: formData,
      });

      const resJson = await res.json();

      if (!res.ok) {
        alert(resJson.detail);
        return;
      }

      if (isLogin) {
        localStorage.setItem(
          "token",
          resJson.access_token
        );

        alert(resJson.message);
      } else {
        alert(resJson.message);
      }

      console.log(resJson);

      e.target.reset();

    } catch (error) {
      console.log(error);
      alert("Something went wrong");
    }
  };

  return (
        <div className="h-screen p-2 bg-[#0f172a] flex flex-col justify-around items-center w-screen">
          <NavLink to={"/"} className="px-3 py-2 rounded-full   flex justify-center items-center bg-blue-950 hover:bg-blue-600 w-fit " ><lord-icon
              src="https://cdn.lordicon.com/pgirtdfe.json"
              trigger="hover"
              stroke="light"
              state="hover-partial-roll"
              colors="primary:#000000,secondary:#000000,tertiary:#000000,quaternary:#ffffff,quinary:#ffffff,senary:#ffffff,septenary:#ffffff"    >
          </lord-icon></NavLink>
    <div className="h-fit w-full flex justify-center items-center bg-[#0f172a] text-white px-4">
      <div className="w-full max-w-md bg-[#111827] rounded-2xl p-8 shadow-2xl">

        <h1 className="text-3xl font-bold text-center mb-2">
          {isLogin ? "Login" : "Create Account"}
        </h1>

        <p className="text-gray-400 text-center mb-8">
          {isLogin
            ? "Access your workspace"
            : "Start using the platform"}
        </p>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5"
        >

          <div className="flex flex-col gap-2">
            <label htmlFor="email">Email</label>

            <input
              type="email"
              id="email"
              name="email"
              required
              className="bg-[#1f2937] border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
              placeholder="Enter your email"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password">Password</label>

            <input
              type="password"
              id="password"
              name="password"
              required
              className="bg-[#1f2937] border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 transition-all rounded-xl py-3 font-semibold mt-2"
          >
            {isLogin ? "Login" : "Sign Up"}
          </button>
        </form>

        <div className="mt-6 text-center text-gray-400">
          {isLogin
            ? "Don't have an account?"
            : "Already have an account?"}

          <button
            onClick={() => setIsLogin(!isLogin)}
            className="ml-2 text-blue-400 hover:text-blue-300"
          >
            {isLogin ? "Sign Up" : "Login"}
          </button>
        </div>
      </div>
    </div>
        </div>
  );
};

export default Authentication;
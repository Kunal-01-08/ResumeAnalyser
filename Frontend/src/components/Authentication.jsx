import React, { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

const backend = import.meta.env.VITE_BACKEND_URL;

const Authentication = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isResetPage = location.pathname === "/reset-password";
  const isVerifyPage = location.pathname === "/verify-email";
  const [mode, setMode] = useState(isResetPage ? "reset" : isVerifyPage ? "verify" : "login");
  const [message, setMessage] = useState("");

  const submitForm = async (endpoint, formData) => {
    const res = await fetch(`${backend}/${endpoint}`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Something went wrong");
    return data;
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    try {
      const data = await submitForm(mode === "login" ? "login" : "signup", formData);
      if (mode === "login") localStorage.setItem("token", data.access_token);
      setMessage(data.message);
      event.target.reset();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    try {
      const data = await submitForm("forgot-password", new FormData(event.target));
      setMessage(data.message);
      event.target.reset();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleResendVerification = async (event) => {
    event.preventDefault();
    try {
      const data = await submitForm("resend-verification", new FormData(event.target));
      setMessage(data.message);
      event.target.reset();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    if (formData.get("password") !== formData.get("confirmPassword")) {
      setMessage("Passwords do not match.");
      return;
    }

    try {
      const data = await submitForm("reset-password", formData);
      setMessage(data.message);
      setTimeout(() => navigate("/authentication"), 1500);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleEmailVerification = async (event) => {
    event.preventDefault();
    try {
      const data = await submitForm("verify-email", new FormData(event.target));
      setMessage(data.message);
      setTimeout(() => navigate("/authentication"), 1500);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const resetToken = new URLSearchParams(location.search).get("token");
  const title = mode === "login" ? "Login" : mode === "signup" ? "Create Account" : mode === "forgot" ? "Forgot Password" : mode === "resend" ? "Resend Verification" : mode === "reset" ? "Reset Password" : "Verify Email";

  return (
    <div className="h-screen p-2 bg-[#0f172a] flex flex-col justify-around items-center w-screen">
      <NavLink to="/" className="px-3 py-2 rounded-full flex justify-center items-center bg-blue-950 hover:bg-blue-600 w-fit">
        Back
      </NavLink>
      <div className="h-fit w-full flex justify-center items-center bg-[#0f172a] text-white px-4">
        <div className="w-full max-w-md bg-[#111827] rounded-2xl p-8 shadow-2xl">
          <h1 className="text-3xl font-bold text-center mb-2">{title}</h1>
          <p className="text-gray-400 text-center mb-8">
            {mode === "forgot" ? "Enter your email and we will send a reset link." : mode === "resend" ? "Enter your email and we will send a fresh verification link." : mode === "reset" ? "Choose a new password for your account." : mode === "verify" ? "Confirm your account email to continue." : mode === "login" ? "Access your workspace" : "Start using the platform"}
          </p>

          {(mode === "login" || mode === "signup") && (
            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-5">
              <input type="email" name="email" required className="bg-[#1f2937] border border-gray-700 rounded-xl px-4 py-3" placeholder="Enter your email" />
              <input type="password" name="password" minLength={mode === "signup" ? 8 : undefined} required className="bg-[#1f2937] border border-gray-700 rounded-xl px-4 py-3" placeholder={mode === "signup" ? "Enter your password (8+ characters)" : "Enter your password"} />
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 transition-all rounded-xl py-3 font-semibold">{mode === "login" ? "Login" : "Sign Up"}</button>
            </form>
          )}

          {mode === "forgot" && (
            <form onSubmit={handleForgotPassword} className="flex flex-col gap-5">
              <input type="email" name="email" required className="bg-[#1f2937] border border-gray-700 rounded-xl px-4 py-3" placeholder="Enter your email" />
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 transition-all rounded-xl py-3 font-semibold">Send Reset Link</button>
            </form>
          )}

          {mode === "resend" && (
            <form onSubmit={handleResendVerification} className="flex flex-col gap-5">
              <input type="email" name="email" required className="bg-[#1f2937] border border-gray-700 rounded-xl px-4 py-3" placeholder="Enter your email" />
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 transition-all rounded-xl py-3 font-semibold">Resend Verification Link</button>
            </form>
          )}

          {mode === "reset" && (
            <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
              <input type="hidden" name="token" value={resetToken || ""} />
              <input type="password" name="password" minLength="8" required className="bg-[#1f2937] border border-gray-700 rounded-xl px-4 py-3" placeholder="New password (8+ characters)" />
              <input type="password" name="confirmPassword" minLength="8" required className="bg-[#1f2937] border border-gray-700 rounded-xl px-4 py-3" placeholder="Confirm new password" />
              <button type="submit" disabled={!resetToken} className="bg-blue-600 hover:bg-blue-700 transition-all rounded-xl py-3 font-semibold disabled:bg-gray-600">Reset Password</button>
            </form>
          )}

          {mode === "verify" && (
            <form onSubmit={handleEmailVerification} className="flex flex-col gap-5">
              <input type="hidden" name="token" value={resetToken || ""} />
              <button type="submit" disabled={!resetToken} className="bg-blue-600 hover:bg-blue-700 transition-all rounded-xl py-3 font-semibold disabled:bg-gray-600">Verify Email</button>
            </form>
          )}

          {message && <p className="mt-5 text-center text-sm text-yellow-300">{message}</p>}

          {!isResetPage && !isVerifyPage && (
            <div className="mt-6 text-center text-gray-400 space-y-3">
              {mode === "login" && <button onClick={() => { setMode("forgot"); setMessage(""); }} className="block mx-auto text-blue-400 hover:text-blue-300">Forgot password?</button>}
              {mode === "login" && <button onClick={() => { setMode("resend"); setMessage(""); }} className="block mx-auto text-blue-400 hover:text-blue-300">Resend verification email</button>}
              {mode !== "forgot" && mode !== "resend" && <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }} className="text-blue-400 hover:text-blue-300">{mode === "login" ? "Create an account" : "Already have an account? Login"}</button>}
              {(mode === "forgot" || mode === "resend") && <button onClick={() => { setMode("login"); setMessage(""); }} className="text-blue-400 hover:text-blue-300">Back to login</button>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Authentication;

import BackgroundWaves from "../components/BackgroundWaves";
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { notify } from "../utils/toast";
import { Mail, Lock, Eye, EyeOff, X } from "lucide-react";
import { backend } from "../server";
import Spinner from "../components/Spinner";
import { useWebsite } from "../context/WebsiteContext";
import { useAuth } from "../context/AuthContext";


function SignIn() {
  const [email, setEmail] = useState("");
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showForgotModal, setShowForgotModal] = useState(false);
  const navigate = useNavigate();

  const { refreshWebsites } = useWebsite()

  const { markLoggedIn } = useAuth()

  // const location = useLocation();
  // const from = location.state?.from?.pathname || "/emails";

  const validateField = (name, value) => {
    if (name === "email") {
      if (!value) return "Email is required";
      if (!/\S+@\S+\.\S+/.test(value)) return "Invalid email format";
    }
    if (name === "password") {
      if (!value) return "Password is required";
    }
    return "";
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.email) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      errors.email = "Invalid email format";
    if (!formData.password) errors.password = "Password is required";
    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    // Validate field on blur
    const error = validateField(name, value);
    setFieldErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setIsLoading(true);

    try {
      const response = await fetch(`${backend}/auth/user/sign-in`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });


      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      await refreshWebsites();
      markLoggedIn()
      notify.success("Login successful.");
      navigate("/home");
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const msg = error.message?.toLowerCase?.();
      if (msg?.includes("already logged in")) {
        notify.info("Already logged in");
        navigate("/home");
      } else {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        notify.error(error.message || "Something went wrong");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Reset Password API call
  const resetPassword = async () => {
    if (!email) {
      notify.error("Please enter an email");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      notify.error("Invalid email format");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${backend}/password/send/password-reset-email`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to send reset email");
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
      notify.success(data.message);
      setShowForgotModal(false);
      setEmail("");
    } catch (error) {
      notify.info(error.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-white">
      <BackgroundWaves />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white/90 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-lg p-6 sm:p-8">
          <div>
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-xl font-extrabold text-writerTeal">
                Login to proceed
              </h1>
              <p className="text-gray-600 mt-2 text-xs">Sign in now</p>
            </div>

            {isLoading ? (
              <>
                <Spinner size="medium" className="mx-auto" />
                <p className="text-center mt-3 text-gray-600 text-sm">
                  Signing in...
                </p>
              </>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    className={`w-full pl-12 py-3 rounded-full border bg-white focus:outline-none focus:ring-2 placeholder:text-sm ${fieldErrors.email
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-gray-100"
                      }`}
                  />
                  {fieldErrors.email && (
                    <p className="text-red-500 text-xs mt-1 ml-2">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    className={`w-full pl-12 pr-10 py-3 rounded-full border bg-white focus:outline-none focus:ring-2 placeholder:text-sm ${fieldErrors.password
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-gray-100"
                      }`}
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-3.5 text-gray-400"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                  {fieldErrors.password && (
                    <p className="text-red-500 text-xs mt-1 ml-2">
                      {fieldErrors.password}
                    </p>
                  )}
                </div>

                {/* Forgot Password */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-sm text-writerTeal hover:underline cursor-pointer"
                    onClick={() => setShowForgotModal(true)}
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-slate-800 text-white py-2.5 rounded-full font-medium hover:bg-slate-700 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
                >
                  {isLoading ? (
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  ) : (
                    "Sign In"
                  )}
                </button>

                {/* Footer */}
                <p className="text-center text-xs text-gray-500">
                  Don't have an account?{" "}
                  <Link to="/sign-up" className="underline underline-offset-2">
                    Sign Up
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/10">
          <div className="relative bg-white w-full max-w-md mx-auto rounded-2xl p-6 shadow-lg border border-slate-300">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-semibold text-slate-700 mb-4">
              Reset your password
            </h2>
            <div className="mb-4">
              <label
                htmlFor="forgotEmail"
                className="block text-sm text-slate-600 mb-1"
              >
                Please enter your associated email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2 rounded-full border border-slate-300 focus:ring-1 focus:ring-gray-200 focus:outline-none placeholder:text-sm"
                required
              />
            </div>
            <button
              type="button"
              onClick={resetPassword}
              className="w-full bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white py-2.5 rounded-full shadow hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              {isLoading ? (
                <svg
                  className="animate-spin h-5 w-5 mx-auto text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                "Send"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SignIn;

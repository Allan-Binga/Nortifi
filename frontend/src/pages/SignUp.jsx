import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { notify } from "../utils/toast";
import { backend } from "../server";
import BackgroundWaves from "../components/BackgroundWaves";

function SignUp() {
  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W]).{6,}$/;

    if (!emailRegex.test(formData.email))
      errors.email = "Please enter a valid email address.";
    if (!passwordRegex.test(formData.password))
      errors.password =
        "Password must be at least 6 characters, include uppercase, lowercase, and a number or symbol.";
    if (formData.userName.trim() === "")
      errors.userName = "Username is required.";
    return errors;
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
      const response = await fetch(`${backend}/auth/user/sign-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: formData.userName,
          email: formData.email,
          password: formData.password,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Registration failed");
      notify.success(data.message || "Successfully registered!");
      setTimeout(() => navigate("/sign-in"), 4000);
    } catch (error) {
      notify.error(error.message || "Failed to register. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="relative min-h-screen bg-white">
      <BackgroundWaves />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white/90 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-lg p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-extrabold text-writerTeal">
              Get Started
            </h1>
            <p className="text-gray-600 mt-2 text-xs">Sign up now</p>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* User Name */}
            <div className="relative">
              <User className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
              <input
                id="userName"
                name="userName"
                type="text"
                placeholder="User Name"
                value={formData.userName}
                onChange={handleInputChange}
                required
                className={`w-full pl-12 py-3 rounded-full border bg-white focus:outline-none focus:ring-2 placeholder:text-sm ${
                  fieldErrors.userName
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-gray-100"
                }`}
              />
              {fieldErrors.userName && (
                <p className="text-red-500 text-xs mt-1 ml-2">
                  {fieldErrors.userName}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className={`w-full pl-12 py-3 rounded-full border bg-white focus:outline-none focus:ring-2 placeholder:text-sm ${
                  fieldErrors.email
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
                onChange={handleInputChange}
                required
                className={`w-full pl-12 pr-10 py-3 rounded-full border bg-white focus:outline-none focus:ring-2 placeholder:text-sm text-lg font-medium ${
                  fieldErrors.password
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-gray-100"
                }`}
                style={{
                  WebkitTextSecurity: showPassword ? "none" : "disc",
                  MozTextSecurity: showPassword ? "none" : "disc",
                }}
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

              {/* Password strength feedback */}
              {formData.password && !fieldErrors.password && (
                <p
                  className={`text-xs mt-1 ml-2 ${
                    formData.password.length < 8
                      ? "text-red-500"
                      : /[A-Z]/.test(formData.password) &&
                        /[0-9\W]/.test(formData.password)
                      ? "text-green-600"
                      : "text-yellow-500"
                  }`}
                >
                  {formData.password.length < 8
                    ? "Too short (min 8 characters)"
                    : /[A-Z]/.test(formData.password) &&
                      /[0-9\W]/.test(formData.password)
                    ? "Strong password"
                    : "Add uppercase, number or symbol for strength"}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-800 text-white py-2.5 rounded-full font-medium hover:bg-slate-700 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? "Creating..." : "Create Account"}
            </button>

            {/* Footer */}
            <p className="text-center text-xs text-gray-500">
              Already have an account?{" "}
              <Link to="/sign-in" className="underline underline-offset-2">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SignUp;

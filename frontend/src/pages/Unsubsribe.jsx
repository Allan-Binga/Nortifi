import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import axios from "axios";
import { backend } from "../server";
import { notify } from "../utils/toast";

const LogoComponent = ({ mousePos }) => (
  <div
    className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl flex items-center justify-center shadow-lg"
    style={{
      transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)`,
    }}
  >
    <Mail className="w-8 h-8 text-white" />
  </div>
);

function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("invalid");
      return;
    }

    const doUnsubscribe = async () => {
      try {
        const response = await axios.get(
          `${backend}/emails/unsubscribe?token=${token}`
        );

        setStatus("success");
        notify.success(
          response.data.message || "You have been unsubscribed successfully."
        );
      } catch (error) {
        setStatus("error");
        const errorMsg =
          error.response?.data?.message ||
          "Failed to unsubscribe. Please try again.";
        setErrorMessage(errorMsg);
        notify.error(errorMsg);
      }
    };

    doUnsubscribe();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl flex items-center justify-center">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">Nortifi</span>
          </div>

          <Link to="/sign-in">
            <button className="bg-gray-900 text-white px-6 py-2 rounded-full hover:bg-gray-800">
              Sign in
            </button>
          </Link>
        </div>
      </nav>

      {/* Main */}
      <section className="pt-24 flex items-center justify-center min-h-screen">
        <div className="max-w-md mx-auto text-center">
          {/* Logo and Heading Container */}
          <div className="flex flex-col items-center space-y-4">
            <LogoComponent mousePos={mousePos} />
            <h1 className="text-4xl font-light">
              Unsubscribe from{" "}
              <span className="font-bold bg-gradient-to-r from-amber-500 to-amber-700 bg-clip-text text-transparent">
                Nortifi
              </span>
            </h1>
          </div>

          {/* Status Messages */}
          {status === "loading" && (
            <div className="flex flex-col items-center space-y-3 text-gray-600 mt-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p>Processing your request...</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center space-y-3 text-green-600 mt-8">
              <CheckCircle2 className="w-10 h-10" />
              <p className="text-lg">You’ve been unsubscribed successfully.</p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center space-y-3 text-red-600 mt-8">
              <AlertCircle className="w-10 h-10" />
              <p className="text-lg">{errorMessage}</p>
            </div>
          )}

          {status === "invalid" && (
            <div className="flex flex-col items-center space-y-3 text-red-600 mt-8">
              <AlertCircle className="w-10 h-10" />
              <p className="text-lg">
                Invalid unsubscribe link. Please check your email link.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Unsubscribe;

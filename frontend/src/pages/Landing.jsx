import React, { useState, useEffect } from "react";
import LandingImg from "../assets/logo.png";
import { Link } from "react-router-dom";
import { ArrowRight, Mail, Send, Target, Zap, ChevronDown } from "lucide-react";

// Mock logo component - replace with: <img src={LandingImg} alt="Logo" className="w-[148px] h-[148px]" />
const LogoComponent = () => (
  <div className="w-[148px] h-[148px] bg-gradient-to-br from-amber-500 to-amber-700 rounded-3xl flex items-center justify-center shadow-lg">
    <Mail className="w-16 h-16 text-white" />
  </div>
);

function Landing() {
  const [email, setEmail] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    const handleMouseMove = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const handleEmailSubmit = () => {
    if (email) {
      console.log("Email submitted:", email);
      setEmail("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Navigation */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/80 backdrop-blur-md shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl flex items-center justify-center">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">Nortifi</span>
          </div>
          <div className="flex items-center space-x-8">
            <button className="bg-gray-900 text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-colors">
              <Link to="/sign-in">Sign in</Link>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div
              className="flex justify-center mb-8"
              style={{
                transform: `translate(${mousePos.x * 0.5}px, ${
                  mousePos.y * 0.5
                }px)`,
              }}
            >
              <LogoComponent />
            </div>

            <h1 className="text-5xl md:text-7xl font-light mb-6 leading-tight">
              Nortifi
              <br />
              <span className="font-bold bg-gradient-to-r from-amber-500 to-amber-700 bg-clip-text text-transparent">
                solutions
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Send beautiful emails that convert. No complexity, no learning
              curve. Just results that matter.
            </p>

            <div className="max-w-md mx-auto mb-8 flex justify-center">
              <Link to="/sign-up">
                <button className="bg-gray-900 text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-all flex items-center space-x-2 hover:scale-105 cursor-pointer">
                  <span>Start Free</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>

            <p className="text-sm text-gray-500">No credit card required</p>
          </div>

          {/* Scroll Indicator */}
          <div className="flex justify-center">
            <div className="animate-bounce">
              <ChevronDown className="w-6 h-6 text-gray-400" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {/* <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="text-4xl font-light text-gray-900 mb-2">
                99.9%
              </div>
              <div className="text-gray-600">Delivery Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-light text-gray-900 mb-2">2M+</div>
              <div className="text-gray-600">Emails Sent</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-light text-gray-900 mb-2">10k+</div>
              <div className="text-gray-600">Happy Customers</div>
            </div>
          </div>
        </div>
      </section> */}

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light mb-4">Everything you need</h2>
            <p className="text-xl text-gray-600">
              Powerful features, beautifully simple
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="group">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-200 transition-colors">
                <Send className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Smart Campaigns</h3>
              <p className="text-gray-600 leading-relaxed">
                Create and send campaigns that adapt to your audience
                automatically. No guesswork, just results.
              </p>
            </div>

            <div className="group">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-200 transition-colors">
                <Target className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Precise Targeting</h3>
              <p className="text-gray-600 leading-relaxed">
                Reach the right people at the right time with intelligent
                segmentation and behavioral triggers.
              </p>
            </div>

            <div className="group">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-200 transition-colors">
                <Zap className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Lightning Fast</h3>
              <p className="text-gray-600 leading-relaxed">
                Send millions of emails in seconds with our optimized
                infrastructure built for speed and reliability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-light mb-6">
            Ready to transform your email marketing?
          </h2>
          <p className="text-xl text-gray-300 mb-12">
            Join thousands of businesses already seeing incredible results
          </p>

          <div className="max-w-md mx-auto">
            <div className="max-w-md mx-auto mb-8 flex justify-center">
              <Link to="/sign-up">
                <button className="bg-white text-gray-900 px-6 py-3 rounded-xl hover:bg-white transition-all flex items-center space-x-2 hover:scale-105 cursor-pointer">
                  <span>Start Free</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Landing;

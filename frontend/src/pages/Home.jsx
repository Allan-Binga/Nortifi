import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { backend } from "../server";
import Navbar from "../components/Navbar";
import { Send, Users, Plus, Mail, ChevronRight, Server } from "lucide-react";

function Home() {
  const [dashboardData, setDashboardData] = useState({
    campaigns: [],
    contacts: [],
    smtpConfigs: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch dashboard data on mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${backend}/dashboard/my-dashboard`, {
          withCredentials: true,
        });
        setDashboardData({
          campaigns: response.data.campaigns || [],
          contacts: response.data.contacts || [],
          smtpConfigs: response.data.smtpConfigs || [],
        });
      } catch (err) {
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <section className="pt-30 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-light mb-4">
              Welcome to Your{" "}
              <span className="font-bold bg-gradient-to-r from-amber-500 to-amber-700 bg-clip-text text-transparent">
                Nortifi Dashboard
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl leading-relaxed">
              Manage your campaigns, track performance, and grow your audience
              with ease.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-4 mb-12">
            <Link to="/new-email">
              <button className="bg-gray-900 text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-all flex items-center space-x-2 cursor-pointer">
                <Mail className="w-5 h-5" />
                <span>New Email</span>
              </button>
            </Link>
            <Link to="/register-smtp">
              <button className="bg-white text-gray-900 px-6 py-3 rounded-xl border border-gray-200 hover:bg-gray-100 transition-all flex items-center space-x-2 cursor-pointer">
                <Server className="w-5 h-5" />
                <span>Register an SMTP server</span>
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Dashboard Stats */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          {isLoading ? (
            <div className="text-center text-gray-600">Loading...</div>
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {/* Campaigns */}
              <Link
                to="/emails"
                className="group bg-gray-50 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all block"
              >
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
                  <Send className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-3xl font-light text-gray-900 mb-2">
                  {dashboardData.campaigns.length}
                </h3>
                <p className="text-gray-600">Campaigns</p>
              </Link>

              {/* Contacts */}
              <Link
                to="/contacts"
                className="group bg-gray-50 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all block"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-3xl font-light text-gray-900 mb-2">
                  {dashboardData.contacts.length}
                </h3>
                <p className="text-gray-600">Contacts</p>
              </Link>

              {/* SMTP Servers */}
              <Link
                to="/smtp-configuration"
                className="group bg-gray-50 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all block"
              >
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                  <Server className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-3xl font-light text-gray-900 mb-2">
                  {dashboardData.smtpConfigs.length}
                </h3>
                <p className="text-gray-600">SMTP Servers</p>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Recent Campaigns */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold">Recent Campaigns</h2>
            <Link
              to="/emails"
              className="text-gray-600 hover:text-gray-900 flex items-center space-x-1"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="text-center text-gray-600">Loading...</div>
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : dashboardData.campaigns.length === 0 ? (
            <p className="text-gray-500">
              No campaigns yet. Create your first one!
            </p>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {dashboardData.campaigns.slice(0, 2).map((c) => (
                <div
                  key={c.campaign_id}
                  className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all"
                >
                  <h3 className="text-lg font-semibold mb-2">{c.name}</h3>
                  <p className="text-gray-600 mb-4">
                    Sent on {new Date(c.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-light mb-6">
            Ready to launch your next campaign?
          </h2>
          <Link to="/new-email">
            <button className="bg-white text-gray-900 cursor-pointer px-6 py-3 rounded-xl hover:bg-gray-100 transition-all flex items-center space-x-2 hover:scale-105 mx-auto">
              <Plus className="w-5 h-5" />
              <span>Create New Campaign</span>
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;

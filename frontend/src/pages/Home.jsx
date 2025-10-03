import Sidebar from "../components/Sidebar";
import Label from "../components/Label";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { backend } from "../server";
import { Send, Users, Plus, ChevronRight, Server, Globe, Mail } from "lucide-react";

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
    <div className="flex min-h-screen bg-blue-50">
      {/* Sidebar */}
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Label />

        <div className="flex-1 overflow-y-auto">
          {/* Hero Section */}
          <section className="py-8">
            <div className="max-w-6xl mx-auto px-6">
              <div className="mb-6 mt-20">
                <h1 className="text-10xl text-baseline md:text-4xl font-bold mb-3">
                  Welcome to Your{" "}
                  <span className="font-bold bg-gradient-to-r from-amber-500 to-amber-700 bg-clip-text text-transparent">
                    Nortifi Dashboard
                  </span>
                </h1>
                <p className="text-gray-600 max-w-xl leading-snug">
                  Manage your campaigns, track performance, and grow your audience
                  with ease.
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3 mb-8">
                <Link to="/sites">
                  <button className="bg-blue-600 font-bold text-stone-50 px-4 py-4 rounded-sm hover:bg-blue-700 transition-all flex items-center space-x-2 cursor-pointer text-md">
                    <Globe className="w-4 h-4" />
                    <span>Manage Websites</span>
                  </button>
                </Link>
                <Link to="/new-email">
                  <button className="bg-white font-bold text-blue-500 px-4 py-4 rounded-sm border border-blue-400 hover:bg-blue-200 transition-all flex items-center space-x-2 cursor-pointer text-md">
                    <Mail className="w-4 h-4" />
                    <span>New Campaign</span>
                  </button>
                </Link>
              </div>
            </div>
          </section>

          {/* Dashboard Stats */}
          <section className="py-8">
            <div className="max-w-6xl mx-auto px-6">
              {isLoading ? (
                <div className="text-center text-gray-600">Loading...</div>
              ) : error ? (
                <div className="text-center text-red-500">{error}</div>
              ) : (
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Campaigns */}
                  <Link
                    to="/emails"
                    className="group bg-gray-50 p-5 rounded-lg border border-solid border-blue-200 transition-all block"
                  >
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-indigo-200 transition-colors">
                      <Send className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-1">
                      {dashboardData.campaigns.length}
                    </h3>
                    <p className="text-sm">Campaigns</p>
                  </Link>

                  {/* Contacts */}
                  <Link
                    to="/contacts"
                    className="group bg-gray-50 p-5 rounded-lg border border-solid border-blue-200 transition-all block"
                  >
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-1">
                      {dashboardData.contacts.length}
                    </h3>
                    <p className=" text-sm">Contacts</p>
                  </Link>

                  {/* SMTP Servers */}
                  <Link
                    to="/smtp-configuration"
                    className="group bg-gray-50 p-5 rounded-lg border border-solid border-blue-200 transition-all block"
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors">
                      <Server className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-1">
                      {dashboardData.smtpConfigs.length}
                    </h3>
                    <p className="text-sm">SMTP Servers</p>
                  </Link>
                </div>
              )}
            </div>
          </section>

          {/* CTA Section */}
          {/* <section className="py-8">
            <div className="max-w-6xl mx-auto px-6">
              <div className="bg-gray-900 text-white rounded-md p-6 flex items-center justify-between">
                <h2 className="text-2xl font-light">
                  Ready to launch your next campaign?
                </h2>
                <Link to="/new-email">
                  <button className="bg-white text-gray-900 cursor-pointer px-5 py-2 rounded-md hover:bg-gray-100 transition-all flex items-center space-x-2 hover:scale-105 text-sm">
                    <Plus className="w-4 h-4" />
                    <span>Create New Campaign</span>
                  </button>
                </Link>
              </div>
            </div>
          </section> */}

          {/* Recent Campaigns */}
          <section className="py-8">
            <div className="max-w-6xl mx-auto px-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Recent Campaigns</h2>
                <Link
                  to="/emails"
                  className="text-gray-600 hover:text-gray-900 flex items-center space-x-1 text-sm"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {isLoading ? (
                <div className="text-center text-gray-600">Loading...</div>
              ) : error ? (
                <div className="text-center text-red-500">{error}</div>
              ) : dashboardData.campaigns.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No campaigns yet. Create your first one!
                </p>
              ) : (
                <div className="grid md:grid-cols-2 gap-5">
                  {dashboardData.campaigns.slice(0, 2).map((c) => (
                    <div
                      key={c.campaign_id}
                      className="bg-white p-5 rounded-md border border-blue-200 transition-all"
                    >
                      <h3 className="text-md font-semibold mb-1">{c.name}</h3>
                      <p className="text-gray-600 text-sm">
                        Sent on {new Date(c.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );

}

export default Home;

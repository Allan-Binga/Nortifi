import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { backend } from "../server";

const WebsiteContext = createContext();

export function WebsiteProvider({ children }) {
    const [activeWebsite, setActiveWebsite] = useState(null);
    const [websites, setWebsites] = useState([]);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const fetchWebsites = async () => {
            try {
                const { data } = await axios.get(`${backend}/websites/my-sites`, {
                    withCredentials: true,
                });

                if (data.success) {
                    setWebsites(data.websites);

                    //Try to load saved website from localStorage
                    const savedWebsite = localStorage.getItem("activeWebsite");

                    if (savedWebsite) {
                        const parsed = JSON.parse(savedWebsite);
                        const stillExists = data.websites.find(
                            (site) => site.website_id === parsed.website_id
                        );
                        if (stillExists) {
                            setActiveWebsite(parsed);
                            return;
                        }
                    }

                    //Default to first website if nothing saved
                    if (data.websites.length > 0) {
                        setActiveWebsite(data.websites[0]);
                    }
                }
            } catch (err) {
                console.error("Error fetching websites:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchWebsites();
    }, []);

    //Persist activeWebsite changes
    useEffect(() => {
        if (activeWebsite) {
            localStorage.setItem("activeWebsite", JSON.stringify(activeWebsite));
        }
    }, [activeWebsite]);

    const refreshWebsites = async () => {
        try {
            const { data } = await axios.get(`${backend}/websites/my-sites`, {
                withCredentials: true,
            });

            if (data.success) {
                setWebsites(data.websites);
                if (data.websites.length > 0 && !activeWebsite) {
                    setActiveWebsite(data.websites[0]);
                }
            }
        } catch (err) {
            console.error("Error refreshing websites:", err);
        }
    };

    return (
        <WebsiteContext.Provider
            value={{
                websites,
                setWebsites,
                activeWebsite,
                setActiveWebsite,
                loading,
                refreshWebsites,
            }}
        >
            {children}
        </WebsiteContext.Provider>
    );
}

export const useWebsite = () => useContext(WebsiteContext);

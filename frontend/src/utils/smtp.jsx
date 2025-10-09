import axios from "axios";
import { backend } from "../server";
import { notify } from "./toast";
import { useWebsite } from "../context/WebsiteContext";

export function useFetchSMTPs() {
  const { activeWebsite } = useWebsite();

  const fetchSMTPs = async () => {
    if (!activeWebsite) {
      notify.info("Please select a website first.");
      return [];
    }

    try {
      const response = await axios.get(
        `${backend}/smtp/all/servers/website/${activeWebsite.website_id}`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Please login";
      notify.info(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return { fetchSMTPs };
}
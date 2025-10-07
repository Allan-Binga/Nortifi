import axios from "axios";
import { backend } from "../server";
import { notify } from "./toast";

export async function fetchWebsites() {
    try {
        const response = await axios.get(`${backend}/websites/my-sites`, { withCredentials: true })

        return response.data
    } catch (error) {
        const errorMessage = error.response?.data?.error || "Please login";
        notify.info(errorMessage);
        throw new Error(errorMessage);
    }
}
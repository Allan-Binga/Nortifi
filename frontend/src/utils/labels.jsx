import axios from "axios"
import { backend } from "../server"
import { notify } from "./toast"

export async function fetchLabels() {
    try {
        const response = await axios.get(`${backend}/labels/all`, { withCredentials: true })

        return response.data
    } catch (error) {
        const errorMessage = error.response?.data?.error;
        notify.info(errorMessage);
        throw new Error(errorMessage);
    }
}
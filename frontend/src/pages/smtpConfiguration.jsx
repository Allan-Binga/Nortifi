import Navbar from "../components/Navbar"
import axios from "axios"
import { Link } from "react-router-dom"
import { backend } from "../server"
import { notify } from "../utils/toast"

function Configurations () {
    return (
        <div>
            <p>
                Configurations
            </p>
        </div>
    )
}

export default Configurations
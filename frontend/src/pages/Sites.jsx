import Sidebar from "../components/Sidebar"
import Label from "../components/Label"
import Spinner from "../components/Spinner"
import { backend } from "../server"
import axios from "axios"

function Sites() {
    return (
        <div className="flex min-h-screen bg-blue-50">
            {/*Sidebar*/}
            <Sidebar />
            <div className="flex-1 overflow-y-auto">

            </div>
        </div>
    )
}

export default Sites
import Sidebar from "../components/Sidebar"

function Sites() {
    return (
        <div className="flex min-h-screen bg-gray-100">
            {/*Sidebar*/}
            <Sidebar />
            <div className="flex-1 overflow-y-auto">

            </div>
        </div>
    )
}

export default Sites
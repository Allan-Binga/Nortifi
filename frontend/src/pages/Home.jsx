import Navbar from "../components/Navbar"
import { Link } from "react-router-dom"
import axios from "axios"
import { useEffect, useState } from "react"
import { backend } from "../server"

function Home () {
    return (
        <div>
            <p>
                Home
            </p>
        </div>
    )
}

export default Home
import Navbar from "../components/Navbar";
import BackgroundWaves from "../components/BackgroundWaves";
import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Mail, Contact, List } from "lucide-react";
import axios from "axios";
import { notify } from "../utils/toast";
import { backend } from "../server";

function Emails() {
  return (
    <div className="relative min-h-screen bg-white">
      <Navbar/>
      <BackgroundWaves/>
    </div>
  );
}

export default Emails;

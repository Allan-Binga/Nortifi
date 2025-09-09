import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { Toaster } from "sonner";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import Contact from "./pages/Contact";
import NewEmail from "./pages/New-Email";
import Emails from "./pages/Emails";

function App() {
  return (
    <Router>
      <Toaster richColors position="top-right" />
      <Routes>
        <Route path="/" element={<Navigate to="/sign-in" />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/contacts" element={<Contact />} />
        <Route path="/new-email" element={<NewEmail />} />
        <Route path="/emails" element={<Emails />} />
      </Routes>
    </Router>
  );
}

export default App;

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
import Landing from "./pages/Landing";
import Configurations from "./pages/smtpConfiguration";
import RegisterSMTP from "./pages/RegisterSMTP";

function App() {
  return (
    <Router>
      <Toaster richColors position="top-right" />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/contacts" element={<Contact />} />
        <Route path="/new-email" element={<NewEmail />} />
        <Route path="/emails" element={<Emails />} />
        <Route path="/smtp-configuration" element={<Configurations/>}/>
         <Route path="/register-smtp" element={<RegisterSMTP/>}/>
      </Routes>
    </Router>
  );
}

export default App;

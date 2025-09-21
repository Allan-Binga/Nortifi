import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import Contact from "./pages/Contact";
import NewEmail from "./pages/New-Email";
import Emails from "./pages/Emails";
import Landing from "./pages/Landing";
import Configurations from "./pages/smtpConfiguration";
import RegisterSMTP from "./pages/RegisterSMTP";
import Home from "./pages/Home";
import Unsubscribe from "./pages/Unsubsribe";

function App() {
  return (
    <Router>
      <Toaster richColors position="top-right" />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/home" element={<Home />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/contacts" element={<Contact />} />
        <Route path="/new-email" element={<NewEmail />} />
        <Route path="/emails" element={<Emails />} />
        <Route path="/smtp-configuration" element={<Configurations />} />
        <Route path="/register-smtp" element={<RegisterSMTP />} />
        <Route path="/unsubscribe" element={<Unsubscribe />} />
      </Routes>
    </Router>
  );
}

export default App;

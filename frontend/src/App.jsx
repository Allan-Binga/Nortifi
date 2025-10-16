import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { WebsiteProvider } from "./context/WebsiteContext";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "sonner";
import ProtectedRoute from "./components/ProtectedRoute";
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
import VerifyEmail from "./pages/VerifyEmail";
import ResetPassword from "./pages/ResetPassword";
import Sites from "./pages/WebsiteDetails"
import Contacts from "./pages/All Contacts";
import SMTPDetails from "./pages/SMTPServerDetails";
import EmailStatus from "./pages/EmailsStatus";
import EmailDetails from "./pages/EmailDetails";
import WebsiteContacts from "./pages/WebsiteContacts";
import ImportContacts from "./pages/ImportContacts";

function App() {
  return (
    <WebsiteProvider>
      <Router>
        <AuthProvider>
          <Toaster richColors position="top-right" />
          <Routes>
            <Route path="/" element={<Landing />} />

            <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/sign-in" element={<SignIn />} />

            <Route path="/add-contact" element={<ProtectedRoute><Contact /></ProtectedRoute>} />
            <Route path="/import-contacts" element={<ProtectedRoute><ImportContacts /></ProtectedRoute>} />
            <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
            <Route path="/new-email" element={<ProtectedRoute><NewEmail /></ProtectedRoute>} />
            <Route path="/emails" element={<ProtectedRoute><Emails /></ProtectedRoute>} />
            <Route path="/emails/:status" element={<ProtectedRoute><EmailStatus /></ProtectedRoute>} />
            <Route path="/emails/campaign/:campaignId" element={<ProtectedRoute><EmailDetails /></ProtectedRoute>} />
            <Route path="/smtp-configuration" element={<ProtectedRoute><Configurations /></ProtectedRoute>} />
            <Route path="/smtp/servers/:smtpId" element={<ProtectedRoute><SMTPDetails /></ProtectedRoute>} />
            <Route path="/sites/site/:websiteId" element={<ProtectedRoute><Sites /></ProtectedRoute>} />
            <Route path="/contacts/:websiteId" element={<ProtectedRoute><WebsiteContacts /></ProtectedRoute>} />
            <Route path="/register-smtp" element={<ProtectedRoute><RegisterSMTP /></ProtectedRoute>} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Routes>
        </AuthProvider>
      </Router>
    </WebsiteProvider>
  );
}

export default App;

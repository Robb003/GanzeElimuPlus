
import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Home from './Pages/Home';
import Navbar from './Components/Navbar';
import Footer from './Components/Footer';
import About from './Pages/About';
import Register from './Pages/Register';
import Login from './Pages/Login';
import ApplicantDashboard from './Pages/ApplicantDashboard';
import MyApplicationDetails from './Pages/MyApplicationDetails';
import Consent from './Pages/Consent';

import { AuthProvider } from './context/AuthContext';

const App = () => {
  return (
    <AuthProvider>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/privacy-notice" element={<Consent />} />
        <Route path="/applicant-dashboard" element={<ApplicantDashboard />} />
        <Route path="/my-application" element={<MyApplicationDetails />} />
      </Routes>

      <Footer />
    </AuthProvider>
  );
};

export default App;

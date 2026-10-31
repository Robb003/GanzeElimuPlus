import React from 'react'
import Herosection from '../Components/Herosection';
import Footer from  '../Components/Footer';
import Navbar from '../Components/Navbar';
import ApplicationCountdown from '../Components/ApplicationCountdown'

function Home() {
  return (
    <div>
      <Herosection />
      <ApplicationCountdown />
    </div>
  )
}

export default Home

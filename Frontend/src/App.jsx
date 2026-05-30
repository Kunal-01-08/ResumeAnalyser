import { useState } from 'react'
import { Route,Routes } from 'react-router-dom'
import './App.css'
import Service from './components/Service'
import Compare from './components/Compare'
import Home from './components/Home'
import Outline from './components/Outline'
import Github from './components/Github'
import CombinedAnalysis from './components/CombinedAnalysis'
import Authentication from './components/Authentication'
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/service" element={<Service/>} />
        <Route path="/compare" element={<Compare/>} />
        <Route path="/outline" element={<Outline/>}/>
        <Route path="/github" element={<Github/>}/>
        <Route path="/combinedAnalysis" element={<CombinedAnalysis/>}/>
        <Route path="/authentication" element={<Authentication/>}/>


      </Routes>
    </>
  )
}

export default App

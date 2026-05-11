import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom'
import './index.css'
import Home from './Pages/Home.jsx'
import Login from './Pages/Login.jsx'
import Signup from './Pages/Signup.jsx'
import Notification from './Pages/Notification.jsx'
import toast, { Toaster } from 'react-hot-toast'
import useAuthUser from "./hooks/useAuthUser.js";
import PageLoader from './components/PageLoader.jsx'
import OnboardingPage from './Pages/OnboardingPage.jsx'
import Navbar from './components/Navbar.jsx'

function App () {
  const { isLoading, authUser } = useAuthUser();

  if(isLoading)return (<>
    <PageLoader/>
  </>)



  const isAuthenticated = Boolean(authUser);
  const isOnboarded = authUser?.isOnboarded;


  return (
    <>
      <Routes>
        <Route path='/' element={isAuthenticated && isOnboarded ? (
              <Navbar showSidebarAndNavbar='true'>
                <Home />
              </Navbar>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )} />
        <Route
          path="/signup"
          element={
            !isAuthenticated ? <Signup /> : <Navigate to={isOnboarded ? "/" : "/onboarding"} />
          }
        />
        <Route
          path="/login"
          element={
            !isAuthenticated ? <Login /> : <Navigate to={isOnboarded ? "/" : "/onboarding"} />
          }
        />
        <Route
          path="/onboarding"
          element={
            isAuthenticated ? (
              !isOnboarded ? (
                <OnboardingPage />
              ) : (
                <Navigate to="/" />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route path='/notification' element={<Notification />} />
      </Routes>
      <Toaster></Toaster>
    </>
  )
}

export default App

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import "./index.css";

import Home from "./Pages/Home.jsx";
import Login from "./Pages/Login.jsx";
import Signup from "./Pages/Signup.jsx";
import OnboardingPage from "./Pages/OnboardingPage.jsx";
import NotificationsPage from "./Pages/NotificationPage.jsx";
import MyFriends from "./Pages/MyFriends.jsx";
import ChatPage from "./Pages/ChatPage.jsx";
import VideoMeeting from "./Pages/videoMeeting.jsx";

import Navbar from "./components/Navbar.jsx";
import PageLoader from "./components/PageLoader.jsx";

import { Toaster } from "react-hot-toast";

import useAuthUser from "./hooks/useAuthUser.js";

function App() {
  const { isLoading, authUser } = useAuthUser();

  if (isLoading) {
    return <PageLoader />;
  }

  const isAuthenticated = Boolean(authUser);
  const isOnboarded = authUser?.isOnboarded;

  return (

      <div data-theme={"forest"}>
        <Routes>

          <Route
            path="/"
            element={
              isAuthenticated && isOnboarded ? (
                <Navbar showSidebarAndNavbar={true}>
                  <Home />
                </Navbar>
              ) : (
                <Navigate
                  to={!isAuthenticated ? "/login" : "/onboarding"}
                />
              )
            }
          />

          <Route
            path="/signup"
            element={
              !isAuthenticated ? (
                <Signup />
              ) : (
                <Navigate
                  to={isOnboarded ? "/" : "/onboarding"}
                />
              )
            }
          />

          <Route
            path="/login"
            element={
              !isAuthenticated ? (
                <Login />
              ) : (
                <Navigate
                  to={isOnboarded ? "/" : "/onboarding"}
                />
              )
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

          <Route
            path="/notification"
            element={
              isAuthenticated && isOnboarded ? (
                <Navbar showSidebarAndNavbar={true}>
                  <NotificationsPage />
                </Navbar>
              ) : (
                <Navigate
                  to={!isAuthenticated ? "/login" : "/onboarding"}
                />
              )
            }
          />

          <Route
            path="/myfriends"
            element={
              isAuthenticated && isOnboarded ? (
                <Navbar showSidebarAndNavbar={true}>
                  <MyFriends />
                </Navbar>
              ) : (
                <Navigate
                  to={!isAuthenticated ? "/login" : "/onboarding"}
                />
              )
            }
          />

          <Route
            path="/call/:id/video"
            element={
              isAuthenticated && isOnboarded ? (
                <VideoMeeting  />
              ) : (
                <Navigate
                  to={!isAuthenticated ? "/login" : "/onboarding"}
                />
              )
            }
          />

          <Route
            path="/chat/:id"
            element={
              isAuthenticated && isOnboarded ? (
                <ChatPage />
              ) : (
                <Navigate
                  to={!isAuthenticated ? "/login" : "/onboarding"}
                />
              )
            }
          />

        </Routes>

        <Toaster />
      </div>
  );
}

export default App;
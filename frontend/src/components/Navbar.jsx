import useLogout from '../hooks/useLogout'
import { useState } from 'react'
import ThemeSelector from './ThemeSelector'
import { useThemeStore } from '../store/useThemeStore'
import { Link } from 'react-router-dom'
import { ShipWheelIcon } from 'lucide-react'
import { useNavigate } from "react-router";
import useAuthUser from '../hooks/useAuthUser'

const Navbar = ({ showSidebarAndNavbar = true, children }) => {
  const { theme } = useThemeStore()
  // const queryClient = useQueryClient();
  // const { mutate: logoutMutation } = useMutation({
  //   mutationFn: logout,
  //   onSuccess: () => queryClient.invalidateQueries({ queryKey: ["authUser"] }),
  // });
  const { logoutMutation } = useLogout()
  const navigate = useNavigate();
  const { isLoading, authUser } = useAuthUser();
  console.log(authUser)
  

  return (
    <div data-theme={theme} className='drawer lg:drawer-open'>
      <input id='my-drawer-4' type='checkbox' className='drawer-toggle' />

      <div className='drawer-content'>
        {/* Navbar */}
        <nav className='navbar w-full bg-base-300'>
          {/* Drawer Toggle */}
          <label
            htmlFor='my-drawer-4'
            aria-label='open sidebar'
            className='btn btn-square btn-ghost'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              strokeLinejoin='round'
              strokeLinecap='round'
              strokeWidth='2'
              fill='none'
              stroke='currentColor'
              className='size-5'
            >
              <path d='M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z'></path>
              <path d='M9 4v16'></path>
              <path d='M14 10l2 2l-2 2'></path>
            </svg>
          </label>

          {/* Navbar Content */}
          <div className='flex w-full items-center justify-between px-4'>
            {/* Title */}
            <div className='pl-5'>
              <Link to='/' className='flex items-center gap-2.5'>
                <ShipWheelIcon
                  className='
                  size-7 
                  text-primary 
                  
                '
                />
                <span className='text-2xl  font-mono bg-clip-text text-transparent bg-linear-to-r from-primary to-secondary  tracking-wider'>
                  EcoMeet
                </span>
              </Link>
            </div>

            {/* Right Section */}
            <div className='flex items-center gap-2'>
              {/* Color plate */}

              <ThemeSelector />

              {/* Notification */}

              <Link to='/notification' className='btn btn-ghost btn-circle'>
                <div className='indicator'>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='h-5 w-5'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
                    />
                  </svg>

                  <span className='badge badge-primary indicator-item w-2 h-2 p-0'></span>
                </div>
              </Link>

              {/* Profile Dropdown */}
              <div className='dropdown dropdown-end'>
                <div
                  tabIndex={0}
                  role='button'
                  className='btn btn-ghost btn-circle avatar'
                >
                  <div className='w-10 rounded-full'>
                    <img
                      alt='profile'
                      src={authUser?.profilePic}
                    />
                  </div>
                </div>

                <ul
                  tabIndex={0}
                  className='menu menu-sm dropdown-content bg-base-100 rounded-box z-10 mt-3 w-52 p-2 shadow'
                >
                  <li>
                    <a className='justify-between'>
                      Profile
                      <span className='badge'>New</span>
                    </a>
                  </li>

                  <li>
                    <a>Settings</a>
                  </li>

                  <li>
                    <a onClick={logoutMutation}>Logout</a>
                  </li>
                </ul>
              </div>
              <button
                onClick={logoutMutation}
                className='btn btn-ghost btn-circle'
              >
                {' '}
                {/* while cllicking on logoutMutation we run this funcion which is in hook/useLogout which runs a fucntion of logout in it which calls an api threw axios and return response and error , if user logout authUser return null,authUser return null because onSuccess of LogOut we run a useQuery{['authUser']} in which we send a get request on /me but before it we run the middleware which try to take token form the cookie but it wont get and send the error . The error is handled in getAuthUser function of useQuery writen in lib/aci.js/authUser returns null  and update isAuthenticate valiable to false in app.jsx and we redirect accoringly */}
                <div className='indicator'>
                  <svg
                    className='h-5 w-5'
                    viewBox='0 0 24 24'
                    xmlns='http://www.w3.org/2000/svg'
                    stroke='currentColor'
                    fill='none'
                  >
                    <path
                      stroke-linecap='round'
                      stroke-linejoin='round'
                      stroke-width='2'
                      d='M20 12h-9.5m7.5 3l3-3-3-3m-5-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2h5a2 2 0 002-2v-1'
                    />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <div className='p-4'>{showSidebarAndNavbar && children}</div>
      </div>

      {/* Sidebar */}
      <div className='drawer-side is-drawer-close:overflow-visible'>
        <label
          htmlFor='my-drawer-4'
          aria-label='close sidebar'
          className='drawer-overlay'
        ></label>

        <div className='flex min-h-full flex-col items-start bg-base-200 is-drawer-close:w-14 is-drawer-open:w-64'>
          <ul className='menu w-full grow'>
            {/* Home */}
            <li>
              <button
                className='is-drawer-close:tooltip is-drawer-close:tooltip-right'
                data-tip='Homepage'
                onClick={() => navigate("/")}
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 24 24'
                  strokeLinejoin='round'
                  strokeLinecap='round'
                  strokeWidth='2'
                  fill='none'
                  stroke='currentColor'
                  className='my-1.5 inline-block size-4'
                >
                  <path d='M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8'></path>
                  <path d='M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'></path>
                </svg>

                <span className='is-drawer-close:hidden'>Homepage</span>
              </button>
            </li>

            {/* Settings */}
            <li>
              <button
                className='is-drawer-close:tooltip is-drawer-close:tooltip-right'
                data-tip='Friends'
                onClick={()=>{navigate('/myfriends')}}
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 465.888 465.888'
                  fill='currentColor'
                  className='my-1.5 inline-block size-5'
                >
                  <path d='M464.283 357.994l-37.104-83.588c-1.698-3.826-4.679-6.997-8.392-8.93L361.201 235.5c-1.27-.662-2.808-.533-3.951.33-6.347 4.801-13.132 8.709-20.226 11.703l34.318 17.864c7.806 4.063 14.068 10.729 17.637 18.771l41.229 92.879c1.017 2.289 1.8 4.643 2.354 7.026h14.762c6.305 0 12.119-3.154 15.555-8.439 2.437-5.285 2.963-11.879.404-17.64z' />

                  <path d='M94.545 265.398l34.319-17.864c-7.094-2.996-13.88-6.901-20.228-11.703-1.144-.864-2.682-.991-3.951-.331l-57.585 29.978c-3.713 1.933-6.692 5.103-8.39 8.929L1.604 357.994c-2.558 5.762-2.033 12.356 1.402 17.641 3.436 5.285 9.251 8.439 15.555 8.439h14.763c.556-2.386 1.339-4.737 2.355-7.028l41.23-92.878c3.57-8.042 9.833-14.708 17.636-18.77z' />

                  <path d='M232.945 243.712c45.134 0 81.724-42.827 81.724-95.654 0-73.26-36.589-95.654-81.724-95.654-45.137 0-81.726 22.395-81.726 95.654 0 52.827 36.591 95.654 81.726 95.654z' />

                  <path d='M372.179 291.625c-1.887-4.252-5.198-7.774-9.323-9.923l-63.986-33.308c-1.411-.735-3.12-.592-4.391.367-18.097 13.689-39.375 20.926-61.533 20.926-22.16 0-43.438-7.235-61.537-20.926-1.271-.961-2.979-1.104-4.391-.367l-63.985 33.308c-4.126 2.147-7.436 5.671-9.322 9.923l-41.23 92.88c-2.843 6.401-2.26 13.729 1.558 19.602 3.818 5.872 10.279 9.378 17.284 9.378h323.247c7.004 0 13.466-3.506 17.282-9.378s4.399-13.2 1.56-19.602l-41.233-92.88z' />
                </svg>

                <span className='is-drawer-close:hidden'>Friends</span>
              </button>
            </li>
            <li>
              <button
                className='is-drawer-close:tooltip is-drawer-close:tooltip-right'
                data-tip='Notification'
                 onClick={() => navigate("/notification")}
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  className='my-1.5 inline-block size-5'
                >
                  <path d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5' />
                  <path d='M9 17v1a3 3 0 006 0v-1' />
                </svg>

                <span className='is-drawer-close:hidden'>Notification</span>
              </button>
            </li>
            <li>
              <button
                className='is-drawer-close:tooltip is-drawer-close:tooltip-right'
                data-tip='Settings'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 24 24'
                  strokeLinejoin='round'
                  strokeLinecap='round'
                  strokeWidth='2'
                  fill='none'
                  stroke='currentColor'
                  className='my-1.5 inline-block size-4'
                >
                  <path d='M20 7h-9'></path>
                  <path d='M14 17H5'></path>
                  <circle cx='17' cy='17' r='3'></circle>
                  <circle cx='7' cy='7' r='3'></circle>
                </svg>

                <span className='is-drawer-close:hidden'>Settings</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Navbar

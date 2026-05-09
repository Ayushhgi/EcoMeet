import React, { useContext, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext.jsx'
import { Snackbar } from '@mui/material'

const Authentication = () => {
  const [formstate, setFormstate] = useState(0) // 0 = Signup, 1 = Login
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fullname, setFullname] = useState('')
  const [message, setMessage] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false) // 🔥 Loading State

  const { handleRegister, handleLogin } = useContext(AuthContext)

  const handleAuth = async () => {
    try {
      setLoading(true) // 🔥 Start Loading

      let result
      if (formstate === 1) {
        result = await handleLogin(username, password)
      } else {
        result = await handleRegister(fullname, username, password)
        setFormstate(1)
      }

      setMessage(result)
      setOpen(true)

      setUsername('')
      setFullname('')
      setPassword('')
    } catch (err) {
      const errorMessage =
        err.response?.data?.msg ||
        err.response?.data?.message ||
        'Something went wrong'

      setMessage(errorMessage)
      setOpen(true)
    } finally {
      setLoading(false) // 🔥 Stop Loading
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 px-4'>
      <div className='bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md'>
        <h2 className='text-3xl font-bold text-center text-gray-800 mb-6'>
          {formstate === 0 ? 'Sign Up' : 'Login'}
        </h2>

        <form
          onSubmit={e => {
            e.preventDefault()
            handleAuth()
          }}
          className='space-y-5'
        >
          {/* Full Name - Only in Signup */}
          {formstate === 0 && (
            <div>
              <label className='block mb-1 text-sm font-medium text-gray-700'>Fullname</label>
              <input
                type='text'
                placeholder='Enter your Fullname'
                value={fullname}
                disabled={loading}
                onChange={e => setFullname(e.target.value)}
                className='w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 transition'
              />
            </div>
          )}

          {/* Username */}
          <div>
            <label className='block mb-1 text-sm font-medium text-gray-700'>Username</label>
            <input
              type='text'
              placeholder='Enter your username'
              value={username}
              disabled={loading}
              onChange={e => setUsername(e.target.value)}
              className='w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 transition'
            />
          </div>

          {/* Password */}
          <div>
            <label className='block mb-1 text-sm font-medium text-gray-700'>Password</label>
            <input
              type='password'
              placeholder='Enter your password'
              value={password}
              disabled={loading}
              onChange={e => setPassword(e.target.value)}
              className='w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 transition'
            />
          </div>

          {/* Submit Button */}
          <div>
            <button
              type='submit'
              disabled={loading}
              className='w-full bg-emerald-500 text-white py-2 rounded-xl hover:bg-emerald-700 transition font-semibold flex items-center justify-center'
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    ></path>
                  </svg>
                  {formstate === 0 ? 'Creating...' : 'Logging in...'}
                </>
              ) : (
                formstate === 0 ? 'Create Account' : 'Login'
              )}
            </button>
          </div>
        </form>

        {/* Toggle between Signup and Login */}
        <p className='mt-4 text-sm text-center text-gray-600'>
          {formstate === 0 ? (
            <>
              Already have an account?{' '}
              <span
                role='button'
                tabIndex='0'
                onClick={() => !loading && setFormstate(1)}
                className='text-emerald-500 hover:underline cursor-pointer'
              >
                Login
              </span>
            </>
          ) : (
            <>
              Don’t have an account?{' '}
              <span
                role='button'
                tabIndex='0'
                onClick={() => !loading && setFormstate(0)}
                className='text-emerald-500 hover:underline cursor-pointer'
              >
                Signup
              </span>
            </>
          )}
        </p>
      </div>

      {/* Snackbar Message */}
      <Snackbar
        open={open}
        autoHideDuration={4000}
        message={message}
        onClose={() => {
          setOpen(false)
          setMessage('')
        }}
      />
    </div>
  )
}

export default Authentication

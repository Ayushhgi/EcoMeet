import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  getAuthUser,
  getUserFriends,
  getFriendRequests,
  getOutgoingFriendReqs,
  acceptFriendRequest
} from '../lib/api'

import { useThemeStore } from '../store/useThemeStore'

const ProfileCard = () => {
  const { theme } = useThemeStore()

  const [user, setUser] = useState(null)
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [outgoingRequests, setOutgoingRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [userData, friendsData, requestsData, outgoingData] =
        await Promise.all([
          getAuthUser(),
          getUserFriends(),
          getFriendRequests(),
          getOutgoingFriendReqs()
        ])

      setUser(userData?.user)
      setFriends(friendsData || [])
      setRequests(requestsData?.incomingReqs || [])
      setOutgoingRequests(outgoingData || [])
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async requestId => {
    try {
      await acceptFriendRequest(requestId)

      loadData()
    } catch (error) {
      console.log(error)
    }
  }

  if (loading) {
    return (
      <div
        data-theme={theme}
        className='card bg-base-100 shadow-xl w-full max-w-xl'
      >
        <div className='card-body items-center py-10'>
          <span className='loading loading-spinner loading-lg text-primary'></span>
        </div>
      </div>
    )
  }

  return (
    <div
      data-theme={theme}
      className='
      card
      bg-base-100
      shadow-2xl
      border
      border-base-300
      w-full
      max-w-xl
      '
    >
      <div className='card-body'>
        {/* USER */}

        <div className='hero bg-base-200 rounded-xl'>
          <div className='hero-content flex-col sm:flex-row'>
            <div className='avatar'>
              <div className='w-24 rounded-full ring ring-primary'>
                <img src={user?.profilePic || '/avatar.png'} alt='' />
              </div>
            </div>

            <div>
              <h1 className='text-2xl font-bold'>{user?.fullName}</h1>

              <p className='py-2 opacity-70'>{user?.bio || 'No bio added'}</p>

              <div className='flex flex-wrap gap-2'>
                <div className='badge badge-primary'>
                  {user?.nativeLanguage}
                </div>

                <div className='badge badge-secondary'>
                  Learning: {user?.learningLanguage}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='divider'></div>

        {/* FRIENDS */}

        <div>
          <div className='flex justify-between items-center'>
            <h2 className='font-bold text-lg'>Friends</h2>

            <Link to='/myfriends' className='btn btn-primary btn-sm'>
              View All
            </Link>
          </div>

          <div className='flex justify-between items-center mt-4'>
            <div className='avatar-group -space-x-5'>
              {friends.slice(0, 3).map(friend => (
                <div key={friend._id} className='avatar'>
                  <div className='w-12 border'>
                    <img src={friend.profilePic || '/avatar.png'} alt='' />
                  </div>
                </div>
              ))}
            </div>

            <div className='badge badge-outline'>{friends.length} Friends</div>
          </div>
        </div>

        <div className='divider'></div>

        {/* PENDING */}

        <div>
          <div className='flex justify-between items-center'>
            <h2 className='font-bold'>Pending Requests</h2>

            <div className='flex gap-2'>
              <div className='badge badge-error'>{requests.length}</div>

              <Link to='/requests' className='btn btn-xs btn-outline btn-error'>
                View All
              </Link>
            </div>
          </div>

          <div className='space-y-3 mt-3'>
            {requests.length === 0 ? (
              <div className='alert'>No pending requests</div>
            ) : (
              requests.slice(0, 2).map(request => (
                <div
                  key={request._id}
                  className='
                card
                bg-base-200
                hover:shadow-lg
                transition-all
                '
                >
                  <div className='card-body p-3'>
                    <div className='flex justify-between items-center'>
                      <div className='flex gap-3'>
                        <div className='avatar'>
                          <div className='w-12 rounded-full'>
                            <img
                              src={request?.sender?.profilePic || '/avatar.png'}
                              alt=''
                            />
                          </div>
                        </div>

                        <div>
                          <p className='font-semibold'>
                            {request?.sender?.fullName}
                          </p>

                          <p className='text-xs opacity-60'>Wants to connect</p>
                        </div>
                      </div>

                      <button
                        className='btn btn-success btn-sm'
                        onClick={() => handleAccept(request._id)}
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className='divider'></div>

        {/* SENT */}

        <div>
          <div className='flex justify-between items-center'>
            <h2 className='font-bold'>Sent Requests</h2>

            <div className='flex gap-2'>
              <div className='badge badge-warning'>
                {outgoingRequests.length}
              </div>

              <Link
                to='/sent-requests'
                className='btn btn-xs btn-outline btn-warning'
              >
                View All
              </Link>
            </div>
          </div>

          <div className='space-y-3 mt-3'>
            {outgoingRequests.length === 0 ? (
              <div className='alert'>No sent requests</div>
            ) : (
              outgoingRequests.slice(0, 2).map(request => (
                <div
                  key={request._id}
                  className='
                  card
                  bg-base-200
                  hover:shadow-lg
                  transition-all
                  '
                >
                  <div className='card-body p-3'>
                    <div className='flex justify-between items-center'>
                      <div className='flex gap-3'>
                        <div className='avatar'>
                          <div className='w-12 rounded-full'>
                            <img
                              src={
                                request?.recipient?.profilePic || '/avatar.png'
                              }
                              alt=''
                            />
                          </div>
                        </div>

                        <div>
                          <p className='font-semibold'>
                            {request?.recipient?.fullName}
                          </p>

                          <p className='text-xs opacity-60'>
                            Waiting for response...
                          </p>
                        </div>
                      </div>

                      <div className='badge badge-warning badge-outline'>
                        Pending
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileCard

import React from 'react'
import { useQuery } from '@tanstack/react-query'

import { getOutgoingFriendReqs } from '../lib/api'

const SentRequestsPage = () => {
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['outgoingRequests'],

    queryFn: getOutgoingFriendReqs
  })

  if (isLoading) {
    return (
      <div
        className='
      flex
      justify-center
      mt-10
      '
      >
        <span
          className='
        loading
        loading-spinner
        loading-lg
        '
        />
      </div>
    )
  }

  return (
    <div
      className='
    p-4
    sm:p-6
    lg:p-8
    container
    mx-auto
    space-y-8
    '
    >
      <div
        className='
      flex
      justify-between
      items-center
      '
      >
        <h2
          className='
        text-2xl
        sm:text-3xl
        font-bold
        '
        >
          Sent Requests
        </h2>

        <div
          className='
        badge
        badge-warning
        badge-lg
        '
        >
          {requests.length}
        </div>
      </div>

      {requests.length === 0 ? (
        <div
          className='
          alert
          '
        >
          No sent requests
        </div>
      ) : (
        <div
          className='
          grid
          grid-cols-1
          sm:grid-cols-2
          md:grid-cols-3
          lg:grid-cols-4
          xl:grid-cols-5
          gap-4
          '
        >
          {requests.map(request => (
            <div
              key={request._id}
              className='
                  card
                  bg-base-200
                  shadow-md
                  hover:shadow-xl
                  hover:-translate-y-1
                  transition-all
                  '
            >
              <div
                className='
                  card-body
                  p-4
                  items-center
                  text-center
                  '
              >
                <div
                  className='
                    avatar
                    '
                >
                  <div
                    className='
                      w-16
                      rounded-full
                      ring
                      ring-warning
                      '
                  >
                    <img
                      src={request?.recipient?.profilePic || '/avatar.png'}
                      alt=''
                    />
                  </div>
                </div>

                <h2
                  className='
                    font-semibold
                    truncate
                    w-full
                    '
                >
                  {request?.recipient?.fullName}
                </h2>

                <div
                  className='
                    badge
                    badge-warning
                    mt-2
                    '
                >
                  Pending
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SentRequestsPage

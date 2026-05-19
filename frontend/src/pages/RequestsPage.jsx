import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { getFriendRequests, acceptFriendRequest } from '../lib/api'

const RequestsPage = () => {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['requests'],
    queryFn: getFriendRequests
  })

  const requests = data?.incomingReqs || []

  const { mutate: acceptReq } = useMutation({
    mutationFn: acceptFriendRequest,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['requests']
      })

      queryClient.invalidateQueries({
        queryKey: ['friends']
      })
    }
  })

  if (isLoading) {
    return (
      <div className='flex justify-center mt-10'>
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
          Friend Requests
        </h2>

        <div
          className='
        badge
        badge-error
        badge-lg
        '
        >
          {requests.length}
        </div>
      </div>

      {requests.length === 0 ? (
        <div className='alert'>No pending requests</div>
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
          {requests.map(request => {
            const sender = request.sender

            return (
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
                        ring-primary
                        '
                    >
                      <img src={sender?.profilePic || '/avatar.png'} alt='' />
                    </div>
                  </div>

                  <h2
                    className='
                      font-semibold
                      truncate
                      w-full
                      '
                  >
                    {sender?.fullName}
                  </h2>

                  <p
                    className='
                      text-xs
                      opacity-60
                      '
                  >
                    Wants to connect
                  </p>

                  <button
                    className='
                        btn
                        btn-success
                        btn-sm
                        w-full
                        mt-2
                        '
                    onClick={() => acceptReq(request._id)}
                  >
                    Accept
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default RequestsPage

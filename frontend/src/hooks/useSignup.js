import React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { signUp } from '../lib/api'
const useSignup = () => {
  const queryClient = useQueryClient()
  const {
    mutate: signUpMutation,
    isPending,
    error
  } = useMutation({
    mutationFn: signUp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authUser'] })
      queryClient.invalidateQueries({ queryKey: ['outgoingFriendReqs'] })
    }
  })

  return { signUpMutation, isPending, error }
}

export default useSignup

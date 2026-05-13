import { LANGUAGE_TO_FLAG } from '../constants'
import { useMutation } from '@tanstack/react-query'
import { getConversationalId } from '../lib/api'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const FriendCard = ({ friend }) => {
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: getConversationalId,

    onSuccess: (data) => {
      toast.success('Conversation opened successfully')

      navigate(`/chat/${data.roomId}`)
    },

    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
        'Failed to open conversation'
      )

      console.log(error)
    }
  })

  return (
    <div className='card bg-base-200 hover:shadow-md transition-shadow'>
      <div className='card-body p-4'>

        {/* USER INFO */}
        <div className='flex items-center gap-3 mb-3'>
          <div className='avatar size-12 rounded-full overflow-hidden'>
            <img
              src={friend.profilePic}
              alt={friend.fullName}
              className='object-cover'
            />
          </div>

          <h3 className='font-semibold truncate'>
            {friend.fullName}
          </h3>
        </div>

        {/* LANGUAGES */}
        <div className='flex flex-wrap gap-1.5 mb-3'>

          <span className='badge badge-secondary text-xs'>
            {getLanguageFlag(friend.nativeLanguage)}
            Native: {friend.nativeLanguage}
          </span>

          <span className='badge badge-outline text-xs'>
            {getLanguageFlag(friend.learningLanguage)}
            Learning: {friend.learningLanguage}
          </span>

        </div>

        {/* BUTTON */}
        <button
          onClick={() => mutation.mutate(friend._id)}
          disabled={mutation.isPending}
          className='btn btn-outline w-full'
        >
          {mutation.isPending ? 'Loading...' : 'Message'}
        </button>

      </div>
    </div>
  )
}

export default FriendCard

export function getLanguageFlag(language) {
  if (!language) return null

  const langLower = language.toLowerCase()
  const countryCode = LANGUAGE_TO_FLAG[langLower]

  if (countryCode) {
    return (
      <img
        src={`https://flagcdn.com/24x18/${countryCode}.png`}
        alt={`${langLower} flag`}
        className='h-3 mr-1 inline-block'
      />
    )
  }

  return null
}
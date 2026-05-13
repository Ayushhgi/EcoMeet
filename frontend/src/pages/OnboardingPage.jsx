import { useState } from 'react'
import useAuthUser from '../hooks/useAuthUser'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { completeOnboarding } from '../lib/api'
import {
  LoaderIcon,
  MapPinIcon,
  ShipWheelIcon,
  ShuffleIcon,
  CameraIcon
} from 'lucide-react'
import { LANGUAGES } from '../constants'

const OnboardingPage = () => {

  const { authUser } = useAuthUser()
  const queryClient = useQueryClient()


   const images = [
    "https://res.cloudinary.com/dpgajzstl/image/upload/v1778589053/androgynous-avatar-non-binary-queer-person_4_ieb3fy.jpg",
    "https://res.cloudinary.com/dpgajzstl/image/upload/v1778589042/androgynous-avatar-non-binary-queer-person_je68il.jpg",
    "https://res.cloudinary.com/dpgajzstl/image/upload/v1778589032/portrait-man-cartoon-style_tlp0c0.jpg",
    "https://res.cloudinary.com/dpgajzstl/image/upload/v1778588976/9_ozp8x1.jpg",
    "https://res.cloudinary.com/dpgajzstl/image/upload/v1778588974/8_gfp2u2.jpg",
    "https://res.cloudinary.com/dpgajzstl/image/upload/v1778588974/8_gfp2u2.jpg",
    "https://res.cloudinary.com/dpgajzstl/image/upload/v1778588957/5_bke1qr.jpg",
    "https://res.cloudinary.com/dpgajzstl/image/upload/v1778588957/6_rlt1w4.jpg",
    "https://res.cloudinary.com/dpgajzstl/image/upload/v1778588956/4_bskymk.jpg",
    "https://res.cloudinary.com/dpgajzstl/image/upload/v1778588955/3_avyi7k.jpg",
    "https://res.cloudinary.com/dpgajzstl/image/upload/v1778588939/1_cbn84t.jpg",
    "https://res.cloudinary.com/dpgajzstl/image/upload/v1778588938/0_cza4nx.jpg",
  ];
  

  const [formState, setFormState] = useState({
    fullName: authUser?.fullName || '',
    bio: authUser?.bio || '',
    nativeLanguage: authUser?.nativeLanguage || '',
    learningLanguage: authUser?.learningLanguage || '',
    location: authUser?.location || '',
    profilePic: authUser?.profilePic || ''
  })

  const { mutate: onboardingMutation, isPending } = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      console.log("hello onBoarded")
      toast.success('Profile onboarded successfully')
      queryClient.invalidateQueries({ queryKey: ['authUser'] }) //"The cached authUser data is outdated.Fetch fresh updated user data again."
    },

    onError: error => {
      // console.log("hello onBoarded")
      toast.error(error.response.data.message)
    }
  })

  const handleSubmit = e => {
    e.preventDefault()

    onboardingMutation(formState)
  }
  const handleRandomAvatar = () => {
    const randomIndex = Math.floor(Math.random() * images.length);
    const randomUrl = images[randomIndex];


    // setSelectedImage(randomUrl);

    setFormState({ ...formState, profilePic: randomUrl })
    toast.success('Random profile picture generated!')
  }

  return (
    <div className='min-h-screen bg-base-100 flex items-center justify-center p-4'>
      <div className='card bg-base-200 w-full max-w-3xl shadow-xl'>
        <div className='card-body p-6 sm:p-8'>
          <h1 className='text-2xl sm:text-3xl font-bold text-center mb-6'>
            Complete Your Profile
          </h1>

          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* PROFILE PIC CONTAINER */}
            <div className='flex flex-col items-center justify-center space-y-4'>
              {/* IMAGE PREVIEW */}
              <div className='size-32 rounded-full bg-base-300 overflow-hidden'>
                {formState.profilePic ? (
                  <img
                    src={formState.profilePic}
                    alt='Profile Preview'
                    className='w-full h-full object-cover'
                  />
                ) : (
                  <div className='flex items-center justify-center h-full'>
                    <CameraIcon className='size-12 text-base-content opacity-40' />
                  </div>
                )}
              </div>

              {/* Generate Random Avatar BTN */}
              <div className='flex items-center gap-2'>
                <button
                  type='button'
                  onClick={handleRandomAvatar}
                  className='btn btn-accent'
                >
                  <ShuffleIcon className='size-4 mr-2' />
                  Generate Random Avatar
                </button>
              </div>
            </div>

            {/* FULL NAME */}
            <div className='form-control'>
              <label className='label'>
                <span className='label-text'>Full Name</span>
              </label>
              <input
                type='text'
                name='fullName'
                value={formState.fullName}
                onChange={e =>
                  setFormState({ ...formState, fullName: e.target.value })
                }
                className='input input-bordered w-full'
                placeholder='Your full name'
              />
            </div>

            {/* BIO */}
            {/* BIO */}
            <div className='form-control'>
              <label className='label pb-1'>
                <span className='label-text font-medium'>Bio</span>

                <span className='label-text-alt text-xs opacity-60'>
                  {formState.bio.length}/120
                </span>
              </label>

              <textarea
                name='bio'
                value={formState.bio}
                maxLength={120}
                onChange={e =>
                  setFormState({
                    ...formState,
                    bio: e.target.value
                  })
                }
                className='
                textarea textarea-bordered
                w-full
                resize-none
                bg-base-100
                text-sm
                leading-5
                focus:outline-none
                focus:border-primary
                transition-all duration-200
              '
                placeholder='Tell people about yourself...'
              />
            </div>

            {/* LANGUAGES */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* NATIVE LANGUAGE */}
              <div className='form-control'>
                <label className='label'>
                  <span className='label-text'>Native Language</span>
                </label>
                <select
                  name='nativeLanguage'
                  value={formState.nativeLanguage}
                  onChange={e =>
                    setFormState({
                      ...formState,
                      nativeLanguage: e.target.value
                    })
                  }
                  className='select select-bordered w-full'
                >
                  <option value=''>Select your native language</option>
                  {LANGUAGES.map(lang => (
                    <option key={`native-${lang}`} value={lang.toLowerCase()}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>

              {/* LEARNING LANGUAGE */}
              <div className='form-control'>
                <label className='label'>
                  <span className='label-text'>Learning Language</span>
                </label>
                <select
                  name='learningLanguage'
                  value={formState.learningLanguage}
                  onChange={e =>
                    setFormState({
                      ...formState,
                      learningLanguage: e.target.value
                    })
                  }
                  className='select select-bordered w-full'
                >
                  <option value=''>Select language you're learning</option>
                  {LANGUAGES.map(lang => (
                    <option key={`learning-${lang}`} value={lang.toLowerCase()}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* LOCATION */}
            <div className='form-control'>
              <label className='label'>
                <span className='label-text'>Location</span>
              </label>
              <div className='relative'>
                <MapPinIcon className='absolute top-1/2 transform -translate-y-1/2 left-3 size-5 text-base-content opacity-70' />
                <input
                  type='text'
                  name='location'
                  value={formState.location}
                  onChange={e =>
                    setFormState({ ...formState, location: e.target.value })
                  }
                  className='input input-bordered w-full pl-10'
                  placeholder='City, Country'
                />
              </div>
            </div>

            {/* SUBMIT BUTTON */}

            <button
              className='btn btn-primary w-full'
              disabled={isPending}
              type='submit'
            >
              {!isPending ? (
                <>
                  <ShipWheelIcon className='size-5 mr-2' />
                  Complete Onboarding
                </>
              ) : (
                <>
                  <LoaderIcon className='animate-spin size-5 mr-2' />
                  Onboarding...
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
export default OnboardingPage

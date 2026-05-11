import { axiosInstance } from './axios'
export const signUp = async signupData => {
  const response = await axiosInstance.post('/auth/register', signupData)
  return response.data
}

export const getAuthUser = async () => {
  try {
    const res = await axiosInstance.get('/auth/me')
    return res.data
  } catch (error) {
    console.log('Error in getAuthUser:', error)
    return null
  }
}
export const login = async (loginData) => {
  const response = await axiosInstance.post("/auth/login", loginData);
  return response.data;
};

export const logout = async () => {
  const response = await axiosInstance.post("/auth/logout");
  return response.data;
};

export const completeOnboarding = async (userData) => {
  const response = await axiosInstance.post("/auth/onboarding", userData);
  return response.data;
};

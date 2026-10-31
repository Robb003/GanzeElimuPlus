
import axios from 'axios';

const BackendBaseUrl = 'http://localhost:5000';
const APIBaseUrl = `${BackendBaseUrl}/api`;

const API = axios.create({
  baseURL: APIBaseUrl,
});

// Attach the saved token to protected API requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Register applicant
export const registerUser = async ({
  phoneNumber,
  password,
  fullName,
  nationalID,
  birthCertificateNumber,
  ward,
  village,
}) => {
  const response = await API.post('/auth/register', {
    phoneNumber,
    password,
    fullName,
    ...(nationalID?.trim()
      ? { nationalID: nationalID.trim() }
      : {}),
    ...(birthCertificateNumber?.trim()
      ? { birthCertificateNumber: birthCertificateNumber.trim() }
      : {}),
    ward,
    village,
  });

  return response.data;
};

// Login
export const loginUser = async ({ phoneNumber, password }) => {
  const response = await API.post('/auth/login', {
    phoneNumber,
    password,
  });

  return response.data;
};


//getting a clycle period
export const getActiveBursaryCycle = async () => {
  const response = await API.get('/admin/active-cycle');
  return response.data;
};

//Submitting an application api
// Submitting an application API
export const submitApplication = async (applicationData) => {
  const response = await API.post(
    '/applications/submit',
    applicationData
  );

  return response.data;
};


export default API;

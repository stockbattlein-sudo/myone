import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '/api';

export const joinWaitlist = async (data) => {
    const res = await axios.post(`${BASE}/waitlist/join`, data);
    return res.data;
};

export const getWaitlistCount = async () => {
    const res = await axios.get(`${BASE}/waitlist/count`);
    return res.data;
};

export const getAdminWaitlist = async (token) => {
    const res = await axios.get(`${BASE}/waitlist/all`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};

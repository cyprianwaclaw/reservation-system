import axios from 'axios'

export default defineNuxtPlugin(() => {
    // const API_URL = 'http://localhost/api'
    const API_URL = 'https://api.fizjoterapia-kaczmarek.pl/api'

    const axiosInstance = axios.create({
        baseURL: API_URL,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        withCredentials: true,
    })

    axiosInstance.interceptors.request.use((config) => {
        const token = useCookie('token').value
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    })

    return {
        provide: {
            axiosInstance,
        },
    }
})
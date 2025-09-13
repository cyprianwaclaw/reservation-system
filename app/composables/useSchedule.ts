// composables/useSchedule.ts
import { ref } from 'vue'

const schedule = ref<any[]>([])
let isFetched = false

export function useSchedule(axiosInstance: any) {
    const fetchSchedule = async () => {
        if (isFetched) return
        try {
            const res = await axiosInstance.get('/available-days')
            schedule.value = res.data
            isFetched = true
        } catch (e) {
            console.error('Błąd pobierania schedule:', e)
        }
    }

    return { schedule, fetchSchedule }
}
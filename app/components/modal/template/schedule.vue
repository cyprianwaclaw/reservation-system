<template>
    <div class="w-full">
        <p class="text-[32px] font-semibold -mt-[8px] mb-[22px]">Grafik pracy</p>
        <div class="flex w-full gap-[54px]">
            <!-- Lista lekarzy -->
            <div class="w-full relative select-none">
                <div v-for="doctor in doctors" :key="doctor.id">
                    <div :class="selectDoctor?.id == doctor.id ? 'active-user' : 'non-active-user'"
                        @click="handleDoctor(doctor.id)">
                        <p class="text-[18px]" :class="selectDoctor?.id == doctor.id ? 'font-semibold primary-color' : ''">
                            {{ doctor.name }} {{ doctor.surname }}
                        </p>
                    </div>
                </div>
            </div>
            <!-- Grafik godzin -->
            <div class="w-full">
                <div v-for="(schedule, index) in doctorSchedule" :key="index"
                    class="flex gap-[10px] w-[380px] justify-between mb-[15px] place-items-center">
                    <p class="text-[18px]">{{ schedule.day }}</p>
                    <div class="flex gap-[10px]">
                        <div class="w-[102px]">
                            <InputSelect type="hour" v-model="schedule.start_time" :options="visitHoursOptions"
                                @change="onStartTimeChange(schedule)" />
                        </div>
                        <div class="w-[102px]">
                            <InputSelect type="hour" v-model="schedule.end_time" :options="getEndOptions(schedule.start_time)" />
                        </div>
                    </div>
                </div>
                <div class="flex place-items-center gap-[12px] mt-[30px]">
                    <LoadingButton :isLoading="isApiLoading" text="Gotowe" @click="saveNewHour()" />
                    <Transition name="fade-slide-confirm">
                        <div v-if="isSuccess" class="flex place-items-center gap-[5px]">
                            <Icon name="ph:check-circle" size="26" class="text-[#37B342]" />
                            <p class="text-[17px] font-medium text-[#37B342]">Zapisano grafik</p>
                        </div>
                    </Transition>
                </div>
            </div>

        </div>
    </div>
</template>

<!-- <script setup lang="ts">
const axiosInstance = useNuxtApp().$axiosInstance as any

const allSchedule = ref<any[]>([])
const doctorSchedule = ref<any[]>([])
const selectDoctor = ref<any>(null)
const isApiLoading = ref(false)
const isSuccess = ref(false)

// Lista lekarzy (możesz później dopasować po API)
const doctors = [
    { id: 1, name: 'Michał', surname: 'Kaczmarek' },
    { id: 2, name: 'Grzegorz', surname: 'Roczniak' },
    { id: 3, name: 'Ola', surname: 'Test' },
    { id: 4, name: 'Asia', surname: 'Test' },
]

// Lista godzin wizyt
const visitHoursOptions = [
    '00:00', '07:30', '08:15', '09:00', '09:45', '10:30', '11:15', '12:00', '12:45', '13:30',
    '14:15', '15:00', '15:45', '16:30', '17:15', '18:00', '18:45', '19:30', '20:15', '21:00', '00:00'
].map(time => ({ value: time, label: time }))

// Funkcja dynamicznie filtrująca end_time względem start_time
const getEndOptions = (startTime: string) => {
    if (!startTime) return visitHoursOptions
    const index = visitHoursOptions.findIndex(opt => opt.value === startTime)
    if (index === -1) return visitHoursOptions
    return visitHoursOptions.slice(index + 1)
}

// Reset end_time jeśli jest wcześniej niż start_time
const onStartTimeChange = (schedule: any) => {
    if (schedule.end_time) {
        const indexStart = visitHoursOptions.findIndex(opt => opt.value === schedule.start_time)
        const indexEnd = visitHoursOptions.findIndex(opt => opt.value === schedule.end_time)
        if (indexEnd <= indexStart) schedule.end_time = ''
    }
}

// Wybór lekarza – ustawia start_time i end_time na wartości z API
const handleDoctor = (id: number) => {
    const foundDoctor = allSchedule.value.find(doc => doc.doctor_id === id)
    if (foundDoctor) {
        // kopiujemy dane godzin do reactive state
        doctorSchedule.value = foundDoctor.hours.map(h => ({
            day: h.day,
            start_time: h.start_time,
            end_time: h.end_time
        }))
    } else {
        doctorSchedule.value = []
    }
    selectDoctor.value = doctors.find(d => d.id === id) || null
}

// Pobranie grafiku z API
onMounted(async () => {
    const res = await axiosInstance.get('/doctor/working-hours')
    allSchedule.value = res.data

    if (allSchedule.value.length > 0) {
        handleDoctor(allSchedule.value[0].doctor_id)
    }
})

const saveNewHour = async () => {
    if (!selectDoctor.value) return

    isApiLoading.value = true

    try {
        // Tworzymy payload w formacie API
        const data = {
            hours: doctorSchedule.value.map(h => ({
                day: h.day,
                start_time: h.start_time,
                end_time: h.end_time
            }))
        }

        // Wywołanie API
        const res = await axiosInstance.put(
            `/doctor/${selectDoctor.value.id}/working-hours`,
            data
        )

        console.log(res.data) // opcjonalnie log dla debugu

        // Status sukcesu
        isSuccess.value = true
        setTimeout(() => {
            isSuccess.value = false
        }, 1200)

    } catch (error: any) {
        console.error(error)
    } finally {
        isApiLoading.value = false
    }
}
</script> -->

<script setup lang="ts">
const axiosInstance = useNuxtApp().$axiosInstance as any

const allSchedule = ref<any[]>([])
const doctorSchedule = ref<any[]>([])
const originalDoctorSchedule = ref<any[]>([]) // 🆕 zapamiętujemy oryginalne dane
const selectDoctor = ref<any>(null)
const isApiLoading = ref(false)
const isSuccess = ref(false)

const doctors = [
    { id: 1, name: 'Michał', surname: 'Kaczmarek' },
    { id: 2, name: 'Grzegorz', surname: 'Roczniak' },
    { id: 3, name: 'Ola', surname: 'Test' },
    { id: 4, name: 'Asia', surname: 'Test' },
]

const visitHoursOptions = [
    '00:00', '07:30', '08:15', '09:00', '09:45', '10:30', '11:15', '12:00', '12:45', '13:30',
    '14:15', '15:00', '15:45', '16:30', '17:15', '18:00', '18:45', '19:30', '20:15', '21:00', '00:00'
].map(time => ({ value: time, label: time }))

const getEndOptions = (startTime: string) => {
    if (!startTime) return visitHoursOptions
    const index = visitHoursOptions.findIndex(opt => opt.value === startTime)
    if (index === -1) return visitHoursOptions
    return visitHoursOptions.slice(index + 1)
}

const onStartTimeChange = (schedule: any) => {
    if (schedule.end_time) {
        const indexStart = visitHoursOptions.findIndex(opt => opt.value === schedule.start_time)
        const indexEnd = visitHoursOptions.findIndex(opt => opt.value === schedule.end_time)
        if (indexEnd <= indexStart) schedule.end_time = ''
    }
}

// 🆕 Funkcja do głębokiego porównania godzin
function areSchedulesEqual(a: any[], b: any[]) {
    if (a.length !== b.length) return false
    return a.every((item, idx) =>
        item.day === b[idx].day &&
        item.start_time === b[idx].start_time &&
        item.end_time === b[idx].end_time
    )
}

const handleDoctor = (id: number) => {
    const foundDoctor = allSchedule.value.find(doc => doc.doctor_id === id)
    if (foundDoctor) {
        const mapped = foundDoctor.hours.map(h => ({
            day: h.day,
            start_time: h.start_time,
            end_time: h.end_time
        }))
        doctorSchedule.value = JSON.parse(JSON.stringify(mapped)) // kopia do edycji
        originalDoctorSchedule.value = JSON.parse(JSON.stringify(mapped)) // 🆕 zapamiętanie oryginału
    } else {
        doctorSchedule.value = []
        originalDoctorSchedule.value = []
    }
    selectDoctor.value = doctors.find(d => d.id === id) || null
}

onMounted(async () => {
    const res = await axiosInstance.get('/doctor/working-hours')
    allSchedule.value = res.data

    if (allSchedule.value.length > 0) {
        handleDoctor(allSchedule.value[0].doctor_id)
    }
})

const saveNewHour = async () => {
    if (!selectDoctor.value) return

    // 🆕 porównanie przed wysyłką
    if (areSchedulesEqual(doctorSchedule.value, originalDoctorSchedule.value)) {
        console.log("Brak zmian – API nie jest wywoływane.")
        return
    }

    isApiLoading.value = true

    try {
        const data = {
            hours: doctorSchedule.value.map(h => ({
                day: h.day,
                start_time: h.start_time,
                end_time: h.end_time
            }))
        }

        const res = await axiosInstance.put(
            `/doctor/${selectDoctor.value.id}/working-hours`,
            data
        )

        console.log(res.data)
        originalDoctorSchedule.value = JSON.parse(JSON.stringify(doctorSchedule.value)) // 🆕 aktualizacja oryginału

        isSuccess.value = true
        setTimeout(() => {
            isSuccess.value = false
        }, 1200)

    } catch (error: any) {
        console.error(error)
    } finally {
        isApiLoading.value = false
    }
}
</script>

<style scoped>
.active-user {
    cursor: default;
    padding: 10px 13px;
    border-radius: 10px;
}

.non-active-user {
    cursor: pointer;
    padding: 10px 13px;
    border-radius: 10px;
}

.non-active-user:hover {
    background-color: #e0f2fe;
}

.fade-slide-confirm-enter-to,
.fade-slide-confirm-leave-from {
    opacity: 1;
    transform: translateY(0);
}

.fade-slide-confirm-enter-active,
.fade-slide-confirm-leave-active {
    transition: all 0.4s ease;
}

.fade-slide-confirm-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

.fade-slide-confirm-enter-from {
    opacity: 0;
    transform: translateY(10px);
}

.fade-slide-confirm-enter-to,
.fade-slide-confirm-leave-from {
    opacity: 1;
    transform: translateY(0);
}
</style>
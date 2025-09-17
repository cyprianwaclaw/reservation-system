<template>
    <div class="w-full">
        <p class="modal-title">Godziny pracy</p>

        <div class="flex w-full md:flex-row flex-col md:gap-[54px]">
            <div class="
    w-full relative select-none
    flex overflow-x-auto whitespace-nowrap space-x-[11px] no-scrollbar
    md:flex-col md:overflow-x-visible md:whitespace-normal md:space-x-0 md:space-y-2
  ">
                <div v-for="doctor in doctors" :key="doctor.id" class="inline-block md:block">
                    <div :class="selectDoctor?.id == doctor.id ? 'active-user' : 'non-active-user'"
                        @click="handleDoctor(doctor.id)">
                        <p class="text-[18px]"
                            :class="selectDoctor?.id == doctor.id ? 'md:font-semibold md:primary-color schedule-button-active' : 'schedule-button'">
                            {{ doctor.name }} {{ doctor.surname }}
                        </p>
                    </div>
                </div>
            </div>
            <div class="w-full md:mt-[0px] mt-[32px] mobile-style">
                <Transition name="modal-slide">
                    <div v-if="isAnimate">
                        <div v-for="(schedule, index) in doctorSchedule" :key="index"
                            class="flex md:gap-[10px] md:w-[380px] justify-between mb-[15px] place-items-center">
                            <p class="md:text-[18px] text-[16px] font-semibold md:font-normal">{{ schedule.day }}</p>
                            <div class="flex md:gap-[10px] gap-[13px]">
                                <div class="md:w-[105px] w-[94px]">
                                    <InputSelect type="hour" v-model="schedule.start_time" :options="visitHoursOptions"
                                        @change="onStartTimeChange(schedule)" />
                                </div>
                                <div class="md:w-[105px] w-[94px]">
                                    <InputSelect type="hour" v-model="schedule.end_time"
                                        :options="getEndOptions(schedule.start_time)" />
                                </div>
                            </div>
                        </div>
                        <div
                            class="flex place-items-center gap-[12px] md:mt-[28px] mt-[34px] mb-[130px] justify-end md:justify-start">
                                      <Transition name="fade-slide-confirm">
                                          <div v-if="isSuccess" class="flex md:hidden place-items-center gap-[5px]">
                                              <Icon name="ph:check-circle" size="26" class="text-[#37B342]" />
                                              <p class="text-[17px] font-medium text-[#37B342]">Zapisano grafik</p>
                                            </div>
                                        </Transition>
                            <LoadingButton :isLoading="isApiLoading" text="Gotowe" @click="saveNewHour()" />
                            <Transition name="fade-slide-confirm">
                                <div v-if="isSuccess" class="md:flex hidden place-items-center gap-[5px]">
                                    <Icon name="ph:check-circle" size="26" class="text-[#37B342]" />
                                    <p class="text-[17px] font-medium text-[#37B342]">Zapisano grafik</p>
                                </div>
                            </Transition>
                        </div>
                    </div>
                </Transition>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
const axiosInstance = useNuxtApp().$axiosInstance as any

const allSchedule = ref<any[]>([])
const doctorSchedule = ref<any[]>([])
const originalDoctorSchedule = ref([]) as any
const selectDoctor = ref<any>(null)
const isApiLoading = ref(false)
const isSuccess = ref(false)
const isAnimate = ref(false)

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

function areSchedulesEqual(a: any[], b: any[]) {
    if (a.length !== b.length) return false
    return a.every((item, idx) =>
        item.day === b[idx].day &&
        item.start_time === b[idx].start_time &&
        item.end_time === b[idx].end_time
    )
}

const handleDoctor = (id: number) => {
    if (isAnimate.value === false) {
        isAnimate.value = true
    } else {
        isAnimate.value = false
        setTimeout(() => {
            isAnimate.value = true
        }, 300)
    }

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
@media (min-width: 768px) {
    .active-user {
        cursor: default;
        padding: 10px 13px;
        border-radius: 10px;
        color: #31a9ce;
    }

    .non-active-user {
        cursor: pointer;
        padding: 10px 13px;
        border-radius: 10px;
    }

    .non-active-user:hover {
        background-color: #e0f2fe;
    }
}

@media (max-width: 768px) {
    .schedule-button {
        padding: 10px 18px;
        border: 1px solid #31a9ce;
        border-radius: 15px;
        font-size: 16px;
    }

    .schedule-button-active {
        padding: 10px 18px;
        border: 1px solid #31a9ce;
        background: #31a9ce;
        color: white;
        border-radius: 15px;
        font-size: 16px;
    }

    .no-scrollbar::-webkit-scrollbar {
        display: none;
    }

    .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
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

.modal-slide-enter-from {
    opacity: 0;
}

.modal-slide-enter-to {
    opacity: 1;
}

.modal-slide-leave-from {
    opacity: 1;
}

.modal-slide-leave-to {
    opacity: 0;
}

.modal-slide-enter-active,
.modal-slide-leave-active {
    transition: transform 0.3s ease, opacity 0.3s ease;
}
</style>
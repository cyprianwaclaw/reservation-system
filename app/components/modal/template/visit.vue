<template>
    <div class="flex w-full gap-[50px] h-full cursor-default" v-if="visitData?.user">
        <div class="w-full relative">
            <p class="primary-color font-semibold text-[13px]">{{ visitData.user.type ? visitData.user.type : 'Zapisany przez panel' }}</p>
            <div class="flex place-items-center gap-[14px]">
                <p class="text-[26px] font-bold">{{ visitData.user.name }} {{ visitData.user.surname }}</p>
            </div>
            <div class="mt-[6px] gap-[4px] flex flex-col">
                <div class="flex place-items-center">
                    <p class="text-[#bababa] text-[15px]">{{ visitData.user.email }}</p>
                    <span v-if="visitData.user.email" class="dot mx-[8px]" />
                    <p class="text-[#bababa] text-[15px]">
                        +48 {{ visitData.user.phone ? visitData.user.phone.replace(/\D/g, '').match(/.{1,3}/g)?.join(' ') :
                            '' }}
                    </p>
                </div>
                <p class="text-[#bababa] text-[15px] -mt-[3px]">{{ visitData.user.age }}</p>
            </div>
            <p class="text-[15px] font-semibold  primary-color  mt-[24px]">Usługa: <span
                    class="font-medium text-black-own">{{ visitData.current_visit.type }}</span></p>
            <div class="w-[270px] bg-[#31a9ce29] rounded-xl p-4 mt-[10px]">
                <div class="flex place-items-center gap-[8px]">
                    <Icon name="ph:clock" size="54" class="primary-color" />
                    <div class="flex flex-col">
                        <p class="primary-color text-[21px] font-semibold">
                            {{ visitData.current_visit.start_time }} - {{ visitData.current_visit.end_time
                            }}
                        </p>
                        <p class="primary-color text-[15px] -mt-[3px]"> {{ visitData.current_visit.date }}
                        </p>
                    </div>
                </div>
            </div>
            <div class="mt-[38px]">
                <p class="text-[16px] font-semibold mb-[8px] primary-color ">O pacjencie</p>
                <div class="max-h-[111px] overflow-y-auto pr-[10px]">
                    <p class="text-[16px]">
                        {{ visitData.user.description }}
                    </p>
                    <div v-if="!visitData.user.description" class="mt-[6px]">
                        <p class="text-[#8b8b8b6a] font-bold text-[22px]">Brak opisu</p>
                    </div>
                </div>
            </div>
            <!-- Blok potwierdzenia odwołania wizyty -->
            <div class="w-full flex items-start gap-[20px] absolute bottom-0" v-if="isDelete">
                <p class="font-semibold mt-[9px]">Czy na pewno odwołać?</p>
                <div class="flex gap-[6px]">
                    <button class="remove-button" @click="confirmDelete()">Tak</button>
                    <button class="primary-button" @click="isDelete = false">Nie</button>
                </div>
            </div>

            <!-- Blok potwierdzenia zmiany daty -->
            <div v-if="isChangeDate" class="change-date-container">
                <div class="w-full flex justify-between mb-[15px]">
                    <p class="flex font-semibold text-[21px] -mt-[6px]">Zmień termin wizyty</p>
                    <Icon name="carbon:close" size="38" class="close-icon -mt-[12px] -mr-[10px]"
                        @click="isChangeDate = false" />
                </div>
                <!-- Data -->
                 <div class="flex flex-col gap-[10px]">
                <InputTest v-model="selectedDate" :available-days="schedule" @select-day="handleSelectDay" />

                     <!-- <InputSelect v-model="newDate" :options="dateOptions" placeholder="Wybierz datę" /> -->
                     <InputSelect v-model="newDoctor" :options="doctorOptions" placeholder="Wybierz lekarza"
                     :disabled="newDate ? false : true" />
                     <InputSelect type='hour' v-model="newTime" :options="timeOptions" placeholder="Wybierz godzinę"
                     :disabled="newDoctor ? false : true" />
                    </div>
                <!-- Przyciski -->
                <div class="absolute bottom-[40px]">
                                        <div class="flex gap-[15px]">
                                            <LoadingButton :isLoading="isApiLoading" text="Gotowe" @click="confirmChangeDate()" />
                                            <Transition name="fade-slide-confirm">
                                                <div v-if="isSuccess" class="flex place-items-center gap-[5px]">
                                                    <Icon name="ph:check-circle" size="28" class="text-[#37B342]" />
                                                    <p class="text-[18px] font-medium text-[#37B342]">Zapisano</p>
                                                </div>
                                            </Transition>
                        </div>
                    <!-- <Button class="remove-button" @click="confirmChangeDate()">Potwierdź</Button> -->
                    <!-- <button class="primary-button" @click="confirmChangeDate()">Zapisz</button> -->
                </div>
            </div>
            <!-- Blok standardowych przycisków -->
            <div class="w-full flex justify-start gap-[6px] absolute bottom-0" v-if="!isDelete && !isChangeDate">
                <button class="primary-button" @click="openChangeDate()">Zmień termin</button>
                <button class="remove-button" @click="isDelete = true">Odwołaj wizytę</button>
            </div>
        </div>
        <div class="w-full relative">
            <div class="w-full mt-[14px]">
                <p class="text-[16px] font-semibold mb-[13px] primary-color ">Poprzednie wizyty</p>
                <div class="max-h-[180px] overflow-y-auto rounded-xl" v-if="visitData?.notes?.length > 0">
                    <div v-for="(single, index) in visitData.notes" :key="index"
                        class="w-full py-[18px] px-[18px] rounded-xl bg-[#f0f0f097]"
                        :class="index === 0 ? 'mt-[0px]' : 'mt-[10px]'">
                        <p class="text-[13px] text-[#aeaeaed5] -mt-[2px]">{{ single.note_date }}</p>
                        <p class="text-[15px] text-[#8b8b8b] mt-[3px]">{{ single.text }}</p>
                    </div>
                </div>
                <div v-else>
                    <p class="text-[#8b8b8b6a] font-bold text-[22px] mb-[30px]">Brak wizyt</p>
                </div>
            </div>
            <div class="relative mt-[14px]">
                <textarea v-model="newNote" placeholder="Dodaj sprawozdanie..." class="add-description"></textarea>
                <button class="primary-button-ghost absolute bottom-[23px] right-[17px]" @click="addNote()">Dodaj</button>
            </div>
            <div class="absolute bottom-0 right-0 w-full">
                <div class="relative mt-[14px]">
                    <textarea class="own-note" v-model="fastNote" placeholder="Notatka..."></textarea>
                    <button class="primary-button-ghost absolute bottom-[20px] right-[20px]"
                        @click="addFastNote()">Ok</button>
                </div>
            </div>
        </div>

    </div>
</template>

<script setup lang="ts">
const isApiLoading = ref(false)
const { closeModal } = useCloseModal()
const axiosInstance = useNuxtApp().$axiosInstance as any;
const { schedule, fetchSchedule } = useSchedule(axiosInstance)


// const {   errors, setErrors, } = useErrors()

const isSuccess = ref()

const props = defineProps({
    vistId: {
        type: Array,
        required: false,
    }
})

const newDate = ref('')
const newDoctor = ref(null as null | number)
const newTime = ref('')
const scheduleApi = ref([]) as any
const selectedDate = ref(null)
const visitData = ref([]) as any
const newNote = ref<string>('')
const fastNote = ref<string>('')
const isDelete = ref<boolean>(false)
const isChangeDate = ref<boolean>(false)
const showModal = ref(false);
const visitDuration = ref<number | null>(null)

onMounted(async () => {
    const res = await axiosInstance.get(`/schedule/visits/${props.vistId}`)
    visitData.value = res.data
    fastNote.value = visitData.value?.fast_note.text || ''
    if (visitData.value?.current_visit?.start_time && visitData.value?.current_visit?.end_time) {
        const [startH, startM] = visitData.value.current_visit.start_time.split(':').map(Number)
        const [endH, endM] = visitData.value.current_visit.end_time.split(':').map(Number)

        const startMinutes = startH * 60 + startM
        const endMinutes = endH * 60 + endM

        visitDuration.value = endMinutes - startMinutes
    }
})

const addNote = async () => {
    if (newNote.value.length > 3) {
        isApiLoading.value = true
        try {
            const newNoteRes = await axiosInstance.post(`/visits/${props.vistId}/notes`, {
                'text': newNote.value
            })
            newNote.value = ''
            const res = await axiosInstance.get(`/schedule/visits/${props.vistId}`)
            visitData.value = res.data
        } finally {
            isApiLoading.value = false
        }
    }
}

const addFastNote = async () => {
    if (fastNote.value.length > 3) {

            const newFastNoteRes = await axiosInstance.post(`/visits/${props.vistId}/notes`, {
                'text': fastNote.value,
                "is_edit": true,
            })
            const res = await axiosInstance.get(`/schedule/visits/${props.vistId}`)
            visitData.value = res.data
        setTimeout(() => {
            closeModal()
        }, 2100)
}
}

const confirmDelete = async () => {
    await axiosInstance.delete(`/schedule/visits/${props.vistId}`)
    closeModal()
}

const openChangeDate = async () => {
    newDate.value = ''
    newDoctor.value = null
    newTime.value = ''
    isChangeDate.value = true
    const res = await axiosInstance.get('/available-days')
    scheduleApi.value = res.data
}

const doctorsForSelectedDate = computed(() => {
    const day = scheduleApi.value.find((d: any) => d.date === newDate.value)
    return day ? day.doctors : []
})

const availableTimes = computed(() => {
    const doc = doctorsForSelectedDate.value.find((d: any) => d.doctor_id === newDoctor.value)
    return doc ? doc.free_slots : []
})

const confirmChangeDate = async () => {
    if (!newDate.value || !newDoctor.value || !newTime.value) return;

     isApiLoading.value = true
    try {
            const res = await axiosInstance.put(`/visits/${props.vistId}/update`, {
            date: newDate.value,
            hour: newTime.value,
            doctor_id: newDoctor.value,
            duration: visitDuration.value
        })

        setTimeout(() => {
            isSuccess.value = res.data?.message == 'Wizyta zaktualizowana' ? true : false
        }, 280)
        setTimeout(() => { 
            closeModal()
        }, 2100)
    } catch (err) {
        console.error('Bd zmiany terminu:', err);
    } finally {
        setTimeout(() => {
            isApiLoading.value = false
        }, 250)
        setTimeout(() => {
            isSuccess.value = false
        }, 1400)
        setTimeout(() => {
            isChangeDate.value = false
        }, 1800)
    }
}

const doctorOptions = computed(() =>
    doctorsForSelectedDate.value.map((doc: any) => ({
        value: doc.doctor_id,
        label: `${doc.name} ${doc.surname}`,
    }))
);

const timeOptions = computed(() =>
    availableTimes.value.map((time: any) => ({
        value: time,
        label: time
    }))
);

// Funkcja formatująca datę dd.mm.yyyy
function formatDateDDMMYYYY(dateStr: string) {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
}

// Computed dla opcji select
const dateOptions = computed(() =>
    scheduleApi.value.map((item: any) => ({
        value: item.date,
        label: formatDateDDMMYYYY(item.date),
    }))
);
function findClosestTime(time, options) {
    if (!time || options.length === 0) return options[0]?.value || ''
    const [h, m] = time.split(':').map(Number)
    let closest = options[0].value
    let minDiff = Math.abs(h * 60 + m - (() => { const [hh, mm] = closest.split(':').map(Number); return hh * 60 + mm })())
    options.forEach(opt => {
        const [hh, mm] = opt.value.split(':').map(Number)
        const diff = Math.abs(h * 60 + m - (hh * 60 + mm))
        if (diff < minDiff) { minDiff = diff; closest = opt.value }
    })
    return closest
}

function handleSelectDay(payload) {
    selectedDate.value = payload.date
    newDate.value = payload.date
    if (payload.doctors.length === 1) {
        newDoctor.value = payload.doctors[0].doctor_id
        if (payload.doctors[0].free_slots?.length) {
            const opts = payload.doctors[0].free_slots.map(t => ({ value: t }))
            newTime.value = findClosestTime('', opts)
        }
    } else {
        newDoctor.value = null
        newTime.value = ''
    }
}

</script>

<style scoped>
.modal-conatiner {
    position: fixed;
    left: 0;
    bottom: 0;
    width: 100%;
    z-index: 50;
}

.close-icon-div {
    width: 100%;
    display: flex;
    justify-content: flex-end;
}

.go-to-icon {
    color: #89c6d9;
}

.go-to-icon:hover {
    color: #31A9CE;
}

.change-date-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 38px;
    background-color: #ffffff;
    border-radius: 10px;
    border: 1px solid #e6e9ef;
    box-shadow: 0 8px 24px rgba(16, 24, 40, 0.12);
    position: absolute;
    bottom: -10px;
    left: -10px;
    width: 430px;
    height: 540px
}

/* tło do modala */
.v-enter-active,
.v-leave-active {
    transition: opacity 0s ease;
}

.v-enter-from,
.v-leave-to {
    opacity: 0;
}

.modal-view {
    background-color: rgb(255, 255, 255);
    width: 950px;
    height: 600px;
    border: solid transparent;
    border-radius: 12px;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 100;
}

.blur-background-update {
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(5px);
    width: 100%;
    height: 100vh;
}

.dot {
    display: inline-block;
    width: 4px;
    height: 4px;
    background-color: #bababa;
    border-radius: 50%;
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
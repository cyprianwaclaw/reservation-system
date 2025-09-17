<template>
    <div class="w-full">
        <p class="modal-title">Dodaj wizytę</p>
        <!-- <p class="text-[32px] font-semibold -mt-[8px] mb-[25px]">Dodaj wizytę</p> -->
        <div class="flex md:flex-row flex-col w-full md:gap-[50px] gap-[12px] mobile-style">
            <div class="w-full relative select-none h-[450px]">
                <p class="md:text-[16px] text-[14px] md:mb-[8px] mb-[4px] font-semibold primary-color">Usługa</p>
                <InputSelect v-model="visitType" :options="visitTypeOptions" placeholder="Wybierz usługę" />
                <p class="md:text-[16px] text-[14px] md:mb-[8px] mb-[4px] font-semibold primary-color mt-[21px]">Pacjent</p>
                <InputSearchSelect :key="selectPatientKey" v-model="selectPatient" :options="options"
                    placeholder="Szukaj pacjenta..." @search="onSearch" />
                <div class="w-full flex place-items-center justify-between mt-[12px] mb-[16px]">
                    <p @click="showPatientInputs = !showPatientInputs"
                        class="primary-color underline cursor-pointer text-[14px]">
                        Wpisz ręcznie
                    </p>
                    <p @click="clearPatientSelection" v-if="selectPatient"
                        class="underline cursor-pointer text-[#f43737] text-[12px]">
                        Wyczyść
                    </p>
                </div>
                <Transition name="fade-slide">
                    <div class="w-full flex flex-col gap-[10px] mb-[16px]" v-if="showPatientInputs">
                        <div class="w-full flex flex-row gap-[10px]">
                            <InputBase v-model="firstName" name="name" placeholder="Imię" :disabled="!!selectPatient" />
                            <InputBase v-model="surName" name="surname" placeholder="Nazwisko"
                                :disabled="!!selectPatient" />
                        </div>
                        <InputBase v-model="email" name="email" placeholder="E-mail" :disabled="!!selectPatient" />
                        <InputBase v-model="phone" name="phone" placeholder="Numer telefonu" :disabled="!!selectPatient" />
                    </div>
                </Transition>
            </div>
            <div class="w-full flex flex-col gap-[10px]">
                <p class="md:text-[16px] text-[14px] md:mb-[8px] -mb-[2px] font-semibold primary-color">Data wizyty</p>
                <InputTest v-model="selectedDate" :available-days="schedule" @select-day="handleSelectDay" />
                <InputSelect v-model="newDoctor" :options="doctorOptions" placeholder="Wybierz lekarza"
                    :disabled="!selectedDate" />
                <InputSelect type='hour' v-model="newTime" :options="timeOptions" placeholder="Wybierz godzinę"
                    :disabled="!newDoctor" />
                <div class="md:absolute bottom-[30px] right-[40px] flex gap-[15px] md:mt-0 mt-[21px] mb-[74px] md:mb-[0px]">

                    <Transition name="fade-slide-confirm">
                        <div v-if="errors?.email" class="flex place-items-center gap-[5px]">
                            <Icon name="ph:warning" size="25" class="text-[#f43737]" />
                            <p class="text-[17px] font-medium text-[#f43737]">Błąd dodania wizyty</p>
                        </div>
                    </Transition>
                    <Transition name="fade-slide-confirm">
                        <div v-if="isSuccess" class="flex place-items-center gap-[5px]">
                            <Icon name="ph:check-circle" size="26" class="text-[#37B342]" />
                            <p class="text-[17px] font-medium text-[#37B342]">Dodano wizytę</p>
                        </div>
                    </Transition>
                    <LoadingButton :isLoading="isApiLoading" text="Dodaj wizytę" @click="addVisit()" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
const axiosInstance = useNuxtApp().$axiosInstance
const { setErrors, errors } = useErrors();
const { closeModal } = useCloseModal();

const props = defineProps({
    visit_data: { type: Array, required: false }
})

const selectPatient = ref(null)
const selectPatientKey = ref(0)
const options = ref([])
const userData = ref(null);
const showPatientInputs = ref(false)
const firstName = ref('')
const surName = ref('')
const email = ref('')
const phone = ref('')

function clearPatientInputs() {
    firstName.value = ''
    surName.value = ''
    email.value = ''
    phone.value = ''
}

function clearPatientSelection() {
    selectPatient.value = null
    selectPatientKey.value++
    clearPatientInputs()
}

let debounceTimeout
const onSearch = (query) => {
    clearTimeout(debounceTimeout)
    if (!query || query.length < 2) return (options.value = [])
    debounceTimeout = setTimeout(async () => {
        try {
            const res = await axiosInstance.get('/allUsers', { params: { search: query, limit: 10 } })
            const grouped = res.data?.data || {}
            options.value = Object.values(grouped).flat().map(u => ({ label: u.name + ' ' + u.surname, value: u.id }))
        } catch (e) { console.error(e) }
    }, 300)
}

watch(selectPatient, async id => {
    if (!id) return clearPatientInputs();
    try {
        const res = await axiosInstance.get(`/users/${id}`);
        userData.value = res.data;
        firstName.value = res.data?.name || '';
        surName.value = res.data?.surname || '';
        email.value = res.data?.email || '';
        phone.value = res.data?.phone || '';
        showPatientInputs.value = true;
    } catch (e) {
        console.error(e);
    }
});
const { schedule, fetchSchedule } = useSchedule(axiosInstance)
const newDate = ref('')
const selectedDate = ref(null)
const newDoctor = ref(null)
const newTime = ref('')
const visitType = ref('')
const visitTypeOptions = ref([
    { value: 'Wkładki do butów', label: 'Wkładki do butów - 400 zł' },
    { value: 'Analiza techniki biegu', label: 'Analiza techniki biegu - 350 zł' },
    { value: 'Terapia manulna', label: 'Terapia manulna - 180 zł' }
])

const doctorsForSelectedDate = computed(() => {
    const day = schedule.value.find(d => d.date === newDate.value)
    return day ? day.doctors : []
})

const availableTimes = computed(() => {
    const doc = doctorsForSelectedDate.value.find(d => d.doctor_id === newDoctor.value)
    return doc ? doc.free_slots : []
})

const doctorOptions = computed(() => doctorsForSelectedDate.value.map(d => ({ value: d.doctor_id, label: `${d.name} ${d.surname}` })))
const timeOptions = computed(() => availableTimes.value.map(t => ({ value: t, label: t })))

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

const pendingVisit = ref(null)
function applyPendingVisit() {
    if (!pendingVisit.value || schedule.value.length === 0) return
    const visit = pendingVisit.value
    newDate.value = visit.date
    selectedDate.value = visit.date
    const day = schedule.value.find(d => d.date === visit.date)
    if (!day) return
    const doc = day.doctors.find(d => d.doctor_id === visit.doctorId)
    if (doc) {
        newDoctor.value = doc.doctor_id
        if (Array.isArray(doc.free_slots) && doc.free_slots.length > 0) {
            const opts = doc.free_slots.map(t => ({ value: t }))
            newTime.value = findClosestTime(visit.time || '', opts)
        }
    }
    pendingVisit.value = null
}

watch(() => props.visit_data, val => {
    if (val && val[0]) {
        pendingVisit.value = val[0]
        applyPendingVisit()
    }
}, { immediate: true })

watch(schedule, () => { if (pendingVisit.value) applyPendingVisit() })

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

const isApiLoading = ref(false)
const isSuccess = ref(false)

async function addVisit() {
    const data = {
        doctor_id: newDoctor.value,
        name: firstName.value.trim(),
        surname: surName.value.trim(),
        phone: phone.value.trim(),
        email: email.value.trim(),
        date: newDate.value,
        type: visitType.value,
        start_time: newTime.value,
        duration: 45
    }
    if (data.doctor_id && data.name && data.surname && data.phone && data.date && data.start_time) {
        isApiLoading.value = true
        try {
            const res = await axiosInstance.post('/reserve', data)
            isSuccess.value = res.data?.message === 'Zarezerwowano'
            clearPatientSelection()
            newDate.value = ''
            newDoctor.value = null
            selectedDate.value = null
            visitType.value = ''
            newTime.value = ''
            showPatientInputs.value = false
        } catch (err) {
            isSuccess.value = false;
            setErrors(err.response.data.errors);
        }
        finally {
            setTimeout(() => { isApiLoading.value = false }, 250)
            setTimeout(() => { isSuccess.value = false }, 1400)
        }
    }
}

onMounted(() => { fetchSchedule() })
</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
    transition: all 0.4s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
    opacity: 0;
    transform: translateY(-5px);
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
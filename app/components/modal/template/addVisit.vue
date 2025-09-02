<template>
    <div class="w-full">
        <p class="text-[32px] font-semibold -mt-[8px] mb-[25px]">Dodaj wizytę</p>
        <div class="flex w-full gap-[50px]">
            <div class="w-full relative select-none h-[450px]">
                <p class="text-[16px] font-semibold primary-color mb-[8px]">Usługa</p>

                <InputSelect v-model="visitType" :options="visitTypeOptions" placeholder="Wybierz usługę" />
                <p class="text-[16px] font-semibold primary-color mb-[8px] mt-[21px]">Pacjent</p>

                <InputSearchSelect :key="selectPatientKey" v-model="selectPatient" :options="options"
                    placeholder="Szukaj pacjenta..." @search="onSearch" />
                <p @click="showPatientInputs = !showPatientInputs"
                    class="primary-color underline cursor-pointer mt-[12px] mb-[16px] text-[14px]">
                    Wpisz ręcznie
                </p>
                <Transition name="fade-slide">
                    <div class="w-full flex flex-col gap-[10px]" v-if="showPatientInputs">
                        <div class="w-full flex flex-row gap-[10px]">
                            <InputBase v-model="firstName" name="name" placeholder="Imię" :disabled="!!selectPatient" />
                            <InputBase v-model="surName" name="surname" placeholder="Nazwisko"
                                :disabled="!!selectPatient" />
                        </div>
                        <div class="w-full flex flex-row gap-[10px]">
                            <InputBase v-model="email" name="email" placeholder="E-mail" :disabled="!!selectPatient" />
                            <InputBase v-model="phone" name="phone" placeholder="Numer telefonu"
                                :disabled="!!selectPatient" />
                        </div>
                        <p @click="clearPatientSelection" v-if="selectPatient"
                            class="underline cursor-pointer text-[#f43737] mt-[5px] text-[12px]">
                            Wyczyść
                        </p>
                    </div>
                </Transition>
            </div>
            <div class="w-full flex flex-col gap-[10px]">
                <p class="text-[16px] font-semibold primary-color">Data wizyty</p>

                <InputSelect v-model="newDate" :options="dateOptions" placeholder="Wybierz datę" />
                <InputSelect v-model="newDoctor" :options="doctorOptions" placeholder="Wybierz lekarza"
                    :disabled="!newDate" />
                <InputSelect v-model="newTime" :options="timeOptions" placeholder="Wybierz godzinę"
                    :disabled="!newDoctor" />
                <div class="absolute bottom-[30px] right-[40px]">
                    <button class="primary-button" @click="addVisit()">Dodaj</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const axiosInstance = useNuxtApp().$axiosInstance as any
const { setErrors } = useErrors()
const { closeModal } = useCloseModal()

const selectPatient = ref<number | null>(null);
const selectPatientKey = ref(0);
const options = ref<{ label: string; value: number }[]>([]);
const userData = ref<any>(null);
const showPatientInputs = ref(false);

const firstName = ref('');
const surName = ref('');
const email = ref('');
const phone = ref('');

const newDate = ref('');
const newDoctor = ref<number | null>(null);
const newTime = ref('');

const schedule = ref<any[]>([]);

const visitType = ref()

const visitTypeOptions = ref<any[]>([
    { value: "Wkładki do butów", label: "Wkładki do butów - 400 zł" },
    { value: "Analiza techniki biegu", label: "Analiza techniki biegu - 350 zł" },
    { value: "Terapia manulna", label: "Terapia manulna - 180 zł" },
    { value: "Terapia manulna + TECAR", label: "Terapia manulna + TECAR - 180 zł" },
    { value: "Terapia manulna + usg", label: "Terapia manulna + usg - 200 zł" },
    { value: "Fala uderzeniowa + terapia manulna", label: "Fala uderzeniowa + terapia manulna - 180 zł" },
    { value: "Wywiad+ badanie+ USG", label: "Wywiad+ badanie+ USG - 250 zł" },
    { value: "Wywiad + elementy badanie funkcjonalne/Analiza techniki biegu", label: "Wywiad + elementy badanie funkcjonalne/Analiza techniki biegu - 250 zł" },
    { value: "Przeskórna elektroliza EPTE+USG", label: "Przeskórna elektroliza EPTE+USG - 250 zł" }
])


onMounted(async () => {
    const res = await axiosInstance.get('/available-days');
    schedule.value = res.data;
});


let debounceTimeout: any = null;
const onSearch = (query: string) => {
    clearTimeout(debounceTimeout);
    if (!query || query.length < 2) {
        options.value = [];
        return;
    }
    debounceTimeout = setTimeout(async () => {
        try {
            const res = await axiosInstance.get('/allUsers', { params: { search: query, limit: 10 } });
            const groupedData = res.data?.data || {};
            options.value = Object.values(groupedData).flat().map((u: any) => ({ label: u.name + ' ' + u.surname, value: u.id }));
        } catch (e) { console.error(e) }
    }, 300);
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
    } catch (e) { console.error(e) }
});

function clearPatientInputs() {
    userData.value = null;
    firstName.value = '';
    surName.value = '';
    email.value = '';
    phone.value = '';
}

function clearPatientSelection() {
    selectPatient.value = null;
    selectPatientKey.value++;
    clearPatientInputs();
}

const doctorsForSelectedDate = computed(() => {
    const day = schedule.value.find(d => d.date === newDate.value);
    return day ? day.doctors : [];
});

const availableTimes = computed(() => {
    const doc = doctorsForSelectedDate.value.find((d: any) => d.doctor_id === newDoctor.value);
    return doc ? doc.free_slots : [];
});

const doctorOptions = computed(() =>
    doctorsForSelectedDate.value.map((d: any) => ({ value: d.doctor_id, label: `${d.name} ${d.surname}` }))
);

const timeOptions = computed(() =>
    availableTimes.value.map((t: any) => ({ value: t, label: t }))
);

function formatDateDDMMYYYY(dateStr: string) {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

const dateOptions = computed(() =>
    schedule.value.map(item => ({ value: item.date, label: formatDateDDMMYYYY(item.date) }))
);

const addVisit = async () => {

    const data = {
        doctor_id: newDoctor.value,
        name: firstName.value.trim(),
        surname: surName.value.trim(),
        phone: phone.value.trim(),
        email: email.value.trim(),
        date: newDate.value,
        type: visitType.value,
        start_time: newTime.value,
        duration: 45,
    };

    if (
        data.doctor_id &&
        data.name &&
        data.surname &&
        data.phone &&
        data.email &&
        data.date &&
        data.start_time
    ) {
        try {
            await axiosInstance.post('/reserve', data);

            clearPatientSelection()
            newDate.value = '';
            newDoctor.value = null;
            newTime.value = '';
            showPatientInputs.value = false;
            closeModal()
        } catch (err: any) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            }
        }
    }
}
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

.fade-slide-enter-to,
.fade-slide-leave-from {
    opacity: 1;
    transform: translateY(0);
}
</style>
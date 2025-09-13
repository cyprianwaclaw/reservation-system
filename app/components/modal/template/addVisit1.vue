<template>
    <div class="w-full">
        <p class="text-[32px] font-semibold -mt-[8px] mb-[25px]">Dodaj wizytę</p>
        <div class="flex w-full gap-[50px]">
            <!-- {{ props }} -->
            <div class="w-full relative select-none h-[450px]">
                <p class="text-[16px] font-semibold primary-color mb-[8px]">Usługa</p>
                <InputSelect v-model="visitType" :options="visitTypeOptions" placeholder="Wybierz usługę" />
                <p class="text-[16px] font-semibold primary-color mb-[8px] mt-[21px]">Pacjent</p>

                <InputSearchSelect :key="selectPatientKey" v-model="selectPatient" :options="options"
                    placeholder="Szukaj pacjenta..." @search="onSearch" />
                <div class="w-full flex place-items-center justify-between mt-[12px] mb-[16px]">
                    <p @click="showPatientInputs = !showPatientInputs"
                        class="primary-color underline cursor-pointer text-[14px]">
                        Wpisz ręcznie
                    </p>
                    <p @click="clearPatientSelection" v-if="selectPatient"
                        class="underline cursor-pointer text-[#f43737]  text-[12px]">
                        Wyczyść
                    </p>
                </div>
                <Transition name="fade-slide">
                    <div class="w-full flex flex-col gap-[10px]" v-if="showPatientInputs">
                        <div class="w-full flex flex-row gap-[10px]">
                            <InputBase v-model="firstName" name="name" placeholder="Imię" :disabled="!!selectPatient" />
                            <InputBase v-model="surName" name="surname" placeholder="Nazwisko"
                                :disabled="!!selectPatient" />
                        </div>
                        <!-- <div class="w-full flex flex-row gap-[10px]"> -->
                        <InputBase v-model="email" name="email" placeholder="E-mail" :disabled="!!selectPatient" />
                        <InputBase v-model="phone" name="phone" placeholder="Numer telefonu" :disabled="!!selectPatient" />
                        <!-- </div> -->
                        <!-- <p @click="clearPatientSelection" v-if="selectPatient"
                            class="underline cursor-pointer text-[#f43737] mt-[5px] text-[12px]">
                            Wyczyść
                        </p> -->
                    </div>
                </Transition>
            </div>
            <div class="w-full flex flex-col gap-[10px]">
                <p class="text-[16px] font-semibold primary-color">Data wizyty</p>
            <!-- <InputCalendar v-model="newDate" /> -->
             <div>

                 <InputCalendar
                 v-model="selectedDate"
                 :available-days="schedule"
                 @select-day="handleSelectDay"
                 />
                 <p v-if="selectedDate" class="mt-4">
                     Wybrałeś: <strong>{{ selectedDate }}</strong>
                    </p>
                </div>
                <!-- <InputSelect v-model="newDate" :options="dateOptions" placeholder="Wybierz datę" /> -->
                <InputSelect v-model="newDoctor" :options="doctorOptions" placeholder="Wybierz lekarza"
                    :disabled="!selectedDate" />
                <InputSelect v-model="newTime" :options="timeOptions" placeholder="Wybierz godzinę"
                    :disabled="!newDoctor" />
                <div class="absolute bottom-[30px] right-[40px]">
                    <div class="flex gap-[15px]">
                        <Transition name="fade-slide-confirm">
                            <div v-if="errors?.email" class="flex place-items-center gap-[5px]">
                                <Icon name="ph:warning" size="26" class="text-[#f43737]" />
                                <p class="text-[18px] font-medium text-[#f43737]">Błąd dodania wizyty</p>                           
                            </div>
                        </Transition>
                        <Transition name="fade-slide-confirm">
                            <div v-if="isSuccess" class="flex place-items-center gap-[5px]">
                                <Icon name="ph:check-circle" size="28" class="text-[#37B342]" />
                                <p class="text-[18px] font-medium text-[#37B342]">Dodano wizytę</p>
                            </div>
                        </Transition>
                        <LoadingButton :isLoading="isApiLoading" text="Dodaj wizytę" @click="addVisit()" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';

const isApiLoading = ref(false);
const isSuccess = ref(false);

const axiosInstance = useNuxtApp().$axiosInstance as any;
const { setErrors, errors } = useErrors();
const { closeModal } = useCloseModal();

const props = defineProps({
    visit_data: {
        type: Array,
        required: false,
    },
}) as any;

// ------------------------- Pacjent -------------------------
const selectPatient = ref<number | null>(null);
const selectPatientKey = ref(0);
const options = ref<{ label: string; value: number }[]>([]);
const userData = ref<any>(null);
const showPatientInputs = ref(false);

const firstName = ref('');
const surName = ref('');
const email = ref('');
const phone = ref('');

function clearPatientInputs() {
    userData.value = null;
    firstName.value = '';
    surName.value = '';
    email.value = '';
    phone.value = '';
    visitType.value = '';
}

function clearPatientSelection() {
    selectPatient.value = null;
    selectPatientKey.value++;
    clearPatientInputs();
}

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
            options.value = Object.values(groupedData)
                .flat()
                .map((u: any) => ({ label: u.name + ' ' + u.surname, value: u.id }));
        } catch (e) {
            console.error(e);
        }
    }, 300);
};

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

// ------------------------- Wizyta -------------------------
const newDate = ref('');
const selectedDate = ref<string | null>(null);
const newDoctor = ref<number | null>(null);
const newTime = ref('');
const schedule = ref<any[]>([]);

const visitType = ref('');
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
]);

onMounted(async () => {
    const res = await axiosInstance.get('/available-days');
    schedule.value = res.data;
    applyPendingVisit(); // jeśli props już przyszedł
});

// ------------------------- Computed -------------------------
const doctorsForSelectedDate = computed(() => {
    const day = schedule.value.find(d => d.date === newDate.value);
    return day ? day.doctors : [];
});

const availableTimes = computed(() => {
    const doc = doctorsForSelectedDate.value.find(d => d.doctor_id === newDoctor.value);
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

// ------------------------- Date Options -------------------------
const dateOptions = computed(() =>
    schedule.value.map(item => ({ value: item.date, label: formatDateDDMMYYYY(item.date) }))
);

// ------------------------- Helpers -------------------------
function findClosestTime(time: string, options: any[]) {
    if (!time || options.length === 0) return options[0]?.value || '';
    const [hours, minutes] = time.split(':').map(Number) as any[];
    const timeInMinutes = hours * 60 + minutes;

    let closest = options[0].value;
    let minDiff = Math.abs(timeInMinutes - (() => {
        const [h, m] = closest.split(':').map(Number);
        return h * 60 + m;
    })());

    options.forEach(opt => {
        const [h, m] = opt.value.split(':').map(Number);
        const diff = Math.abs(timeInMinutes - (h * 60 + m));
        if (diff < minDiff) {
            minDiff = diff;
            closest = opt.value;
        }
    });

    return closest;
}

// ------------------------- Obsługa props visit_data -------------------------
const pendingVisit = ref<any | null>(null);

function applyPendingVisit() {
    const visit = pendingVisit.value;
    if (!visit || !schedule.value || schedule.value.length === 0) return;

    newDate.value = visit.date || '';
    selectedDate.value = visit.date || '';

    const day = schedule.value.find((d: any) => d.date === visit.date);
    if (!day) {
        pendingVisit.value = null;
        return;
    }

    const matchedDoctor = (day.doctors || []).find((doc: any) => doc.doctor_id === visit.doctorId);

    if (matchedDoctor) {
        newDoctor.value = matchedDoctor.doctor_id;

        if (Array.isArray(matchedDoctor.free_slots) && matchedDoctor.free_slots.length > 0) {
            const timesOpts = matchedDoctor.free_slots.map((t: string) => ({ value: t }));
            newTime.value = findClosestTime(visit.time || '', timesOpts);
        }
    }

    pendingVisit.value = null;
}

watch(
    () => props.visit_data,
    (newVal) => {
        if (newVal && newVal[0]) {
            pendingVisit.value = newVal[0];
            applyPendingVisit();
        }
    },
    { immediate: true }
);

watch(
    () => schedule.value,
    (s) => {
        if (pendingVisit.value) applyPendingVisit();
    }
);

// ------------------------- Kalendarz -------------------------
function handleSelectDay(payload: { date: string; doctors: any[] }) {
    console.log('📅 Wybrano dzień:', payload.date);
    console.log('👨‍⚕️ Dostępni lekarze:', payload.doctors);

    selectedDate.value = payload.date;
    newDate.value = payload.date;

    if (payload.doctors && payload.doctors.length === 1) {
        newDoctor.value = payload.doctors[0].doctor_id;
        if (Array.isArray(payload.doctors[0].free_slots) && payload.doctors[0].free_slots.length > 0) {
            const timesOpts = payload.doctors[0].free_slots.map((t: string) => ({ value: t }));
            newTime.value = findClosestTime('', timesOpts);
        }
    } else {
        newDoctor.value = null;
        newTime.value = '';
    }
}

// ------------------------- Dodawanie wizyty -------------------------
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

    if (data.doctor_id && data.name && data.surname && data.phone && data.date && data.start_time) {
        isApiLoading.value = true;
        try {
            const res = await axiosInstance.post('/reserve', data);
            setTimeout(() => {
                isSuccess.value = res.data?.message === 'Zarezerwowano';
            }, 280);
            clearPatientSelection();
            newDate.value = '';
            newDoctor.value = null;
            newTime.value = '';
            showPatientInputs.value = false;
            // closeModal();
        } catch (err: any) {
            isSuccess.value = false;
            setErrors(err.response.data.errors);
        } finally {
            setTimeout(() => { isApiLoading.value = false }, 250);
            setTimeout(() => { isSuccess.value = false }, 1400);
        }
    }
};
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
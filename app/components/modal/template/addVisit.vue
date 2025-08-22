<template>
    <div class="w-full">
        <p class="text-[32px] font-semibold -mt-[8px] mb-[25px]">Dodaj wizytę</p>

        <div class="flex w-full gap-[50px]">
            <div class="w-full relative select-none h-[450px]">
                <InputSearchSelect :key="selectPatientKey" v-model="selectPatient" :options="options"
                    placeholder="Wybierz pacjenta" @search="onSearch" />
                <p @click="showPatientInputs = !showPatientInputs"
                    class="primary-color underline cursor-pointer mt-[12px] mb-[24px] text-[15px]">
                    Wpisz ręcznie
                </p>
                <Transition name="fade-slide">
                    <div class="w-full flex flex-col gap-[10px]" v-if="showPatientInputs">
                        <InputBase v-model="firstName" placeholder="Wpisz imię" :disabled="!!selectPatient" />
                        <InputBase v-model="surName" placeholder="Wpisz nazwisko" :disabled="!!selectPatient" />
                        <InputBase v-model="email" placeholder="Wpisz e-mail" :disabled="!!selectPatient" />
                        <InputBase v-model="phone" placeholder="Wpisz telefon" :disabled="!!selectPatient" />
                        <p @click="clearPatientSelection" v-if="selectPatient"
                            class="underline cursor-pointer text-[#f43737] mt-[5px] text-[15px]">
                            Usuń
                        </p>
                    </div>
                </Transition>
            </div>
            <div class="w-full flex flex-col gap-[10px]">
                <InputSelect v-model="newDate" :options="dateOptions" placeholder="Wybierz datę" />
                <InputSelect v-model="newDoctor" :options="doctorOptions" placeholder="Wybierz lekarza"
                    :disabled="newDate ? false : true" />
                <InputSelect v-model="newTime" :options="timeOptions" placeholder="Wybierz godzinę"
                    :disabled="newDoctor ? false : true" />
                <div class="absolute bottom-[30px] right-[40px]">
                    <Button class="primary-button" @click="addVisit()">Dodaj</Button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useNuxtApp } from "nuxt/app";

const axiosInstance = useNuxtApp().$axiosInstance as any;

const selectPatient = ref<number | null>(null);
const selectPatientKey = ref(0); // wymusza remount InputSearchSelect
const options = ref<{ label: string; value: number }[]>([]);
const userData = ref<any>(null);
const showPatientInputs = ref(false);

// pola formularza
const firstName = ref("");
const surName = ref("");
const email = ref("");
const phone = ref("");

const newDate = ref('')
const newDoctor = ref(null as null | number)
const newTime = ref('')

let debounceTimeout: any = null;
const onSearch = (query: string) => {
    clearTimeout(debounceTimeout);

    if (!query || query.length < 2) {
        options.value = [];
        return;
    }

    debounceTimeout = setTimeout(async () => {
        try {
            const res = await axiosInstance.get("/allUsers", {
                params: { search: query, limit: 10 },
            });

            const groupedData = res.data?.data || {};
            options.value = Object.values(groupedData)
                .flat()
                .map((user: any) => ({
                    label: `${user.name} ${user.surname}`,
                    value: user.id,
                }));
        } catch (err) {
            console.error(err);
        }
    }, 300);
};

// obserwuj wybór pacjenta
watch(selectPatient, async (id) => {
    if (!id) return clearPatientInputs();

    try {
        const res = await axiosInstance.get(`/users/${id}`);
        userData.value = res.data;

        firstName.value = res.data?.name || "";
        surName.value = res.data?.surname || "";
        email.value = res.data?.email || "";
        phone.value = res.data?.phone || "";

        showPatientInputs.value = true;
    } catch (err) {
        console.error(err);
    }
});

function clearPatientInputs() {
    userData.value = null;
    firstName.value = "";
    surName.value = "";
    email.value = "";
    phone.value = "";
}

function clearPatientSelection() {
    selectPatient.value = null;
    selectPatientKey.value++;
    clearPatientInputs();
}

const schedule = ref([]) as any

onMounted(async () => {
    const res = await axiosInstance.get('/schedule/available-days')
    schedule.value = res.data

})
const doctorsForSelectedDate = computed(() => {
    const day = schedule.value.find((d: any) => d.date === newDate.value)
    return day ? day.doctors : []
})

const availableTimes = computed(() => {
    const doc = doctorsForSelectedDate.value.find((d: any) => d.doctor_id === newDoctor.value)
    return doc ? doc.free_slots : []
})
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


function formatDateDDMMYYYY(dateStr: string) {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
}

const dateOptions = computed(() =>
    schedule.value.map((item: any) => ({
        value: item.date,
        label: formatDateDDMMYYYY(item.date),
    }))
);

const addVisit = async () => {
    const data = {
        doctor_id: newDoctor.value,
        name: firstName.value,
        surname: surName.value,
        phone: phone.value,
        email: email.value,
        date: newDate.value,
        start_time: newTime.value,
        duration:45,
    };

    try {
        const res = await axiosInstance.post('/schedule/reserve', data);
        console.log('Wizyta dodana:', res.data);

        clearPatientSelection()
        newDate.value = ""
        newDoctor.value = null
        newTime.value = ""
        showPatientInputs.value = false

    } catch (err) {
        console.error('Błąd podczas dodawania wizyty:', err);
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
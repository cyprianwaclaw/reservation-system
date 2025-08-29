<template>
    <div class="w-full">
        <p class="text-[32px] font-semibold -mt-[8px] mb-[25px]">Dodaj wolne</p>
        <div class="flex w-full gap-[50px]">
            <div class="w-full relative select-none h-[450px]">
                <p class="text-[16px] font-semibold primary-color mb-[8px]">Lekarz</p>
                <InputSelect v-model="selectDoctor" :options="doctorList" placeholder="Wybierz lekarza" />
                <label :class="selectDoctor ? 'checkbox-wrapper' : 'checkbox-wrapper-none'">
                    <input type="checkbox" v-model="allDay" class="checkbox-hidden"
                        :disabled="selectDoctor ? false : true" />
                    <span class="checkbox-custom"></span>
                    <p class="text-[#8a8a8a] mt-[2px]">wolne na cały dzień</p>
                </label>
            </div>
            <div class="w-full flex flex-col gap-[10px] relative">
                <Transition name="fade-slide">
                    <div v-if="isNonAllDay" class="w-full flex flex-col gap-[10px] relative">
                        <p class="text-[16px] font-semibold primary-color  -mt-[2px]">Data oraz godziny wolnego</p>
                        <InputSelect v-model="newDate" :options="dateOptions" placeholder="Wybierz datę"
                            :disabled="selectDoctor ? false : true" />
                        <InputSelect v-model="timeStart" :options="timeOptions" placeholder="Wybierz godzinę rozpoczęcia"
                            :disabled="newDate ? false : true" />
                        <Transition name="fade-slide">
                            <InputSelect v-if="endTimeOptions" v-model="timeEnd" :options="endTimeOptions"
                                placeholder="Wybierz godzinę zakończenia" />
                        </Transition>
                    </div>
                </Transition>
                <Transition name="fade-slide">
                    <div v-if="isAllDay">
                        <p class="text-[16px] font-semibold primary-color  mb-[8px]">Data wolnego</p>

                        <InputSelect v-model="dateEnd" :options="dateEndOptions" placeholder="Dzień urolopu" />
                    </div>
                </Transition>
                <div class="absolute bottom-[0px] right-[0px]">
                    <button class="primary-button" @click="addVacation()">Dodaj</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const axiosInstance = useNuxtApp().$axiosInstance as any;
const { closeModal } = useCloseModal()

const selectDoctor = ref<number | null>(null);
const newDoctor = ref(null) as any
const newDate = ref('');
const dateEnd = ref() as any
const dateEndOptions = ref('');
const timeStart = ref('');
const timeEnd = ref('');
const endTimeOptions = ref() as any
const allDay = ref(false)
const isAllDay = ref(false)
const isNonAllDay = ref(true)

const doctorList = [
    { value: 1, label: 'Michał' },
    { value: 2, label: 'Grzegorz' },
    { value: 3, label: 'Ola' },
    { value: 4, label: 'Asia' },
];

const schedule = ref([]) as any;

watch(selectDoctor, (val) => {
    newDoctor.value = val;
});

watch(timeStart, async (val) => {
    if (val) {
        const data = {
            "doctor_id": selectDoctor.value,
            "date": newDate.value,
            "start": val
        }
        const res = await axiosInstance.post('/end-options', data)
        endTimeOptions.value = res.data
    }
}
)

watch(allDay, async (val) => {
    if (val) {
        const data = {
            doctor_id: selectDoctor.value,
        }

        const res = await axiosInstance.post('/fully-available-days', data)
        dateEndOptions.value = res.data
        isNonAllDay.value = false
        timeStart.value = ''
        timeEnd.value = ''
        setTimeout(() => {
            isAllDay.value = true
        }, 310)
    } else {
        isAllDay.value = false
        endTimeOptions.value = false
        dateEnd.value = ''
        newDate.value = ''
        setTimeout(() => {
            isNonAllDay.value = true
        }, 310)
    }
})

onMounted(async () => {
    try {
        const res = await axiosInstance.get('/available-days');
        schedule.value = res.data;
    } catch (err) {
        console.error(err);
    }
});

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

const doctorsForSelectedDate = computed(() => {
    const day = schedule.value.find((d: any) => d.date === newDate.value);
    return day ? day.doctors : [];
});

const availableTimes = computed(() => {
    const doc = doctorsForSelectedDate.value.find((d: any) => d.doctor_id === newDoctor.value);
    return doc ? doc.free_slots : [];
});

const timeOptions = computed(() =>
    availableTimes.value.map((time: any) => ({ value: time, label: time }))
);

function clearInputs() {
    selectDoctor.value = null
    newDoctor.value = ''
    newDate.value = ''
    allDay.value = false,
        timeStart.value = ''
    timeEnd.value = ''
}


function validateVacationData(data: any) {
    if (!data.doctor_id) return false;
    if (data.all_day) {
        return !!data.date;
    }
    return !!data.start_time && !!data.end_time;
}

const addVacation = async () => {

    const data = {
        doctor_id: newDoctor.value,
        date: newDate.value ? newDate.value : dateEnd.value,
        all_day: allDay.value,
        start_time: timeStart.value,
        end_time: timeEnd.value,
    };

    if (validateVacationData(data)) {
        {
            try {
                const res = await axiosInstance.post('/add-vacations', data);
                clearInputs();
                closeModal()
            } catch (err) {
                console.error('Błąd podczas dodawania wizyty:', err);
            }
        }
    }
}
</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
    transition: all 0.3s ease;
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
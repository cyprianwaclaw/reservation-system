<template>
    <div class="w-full">
        <p class="text-[32px] font-semibold -mt-[8px] mb-[25px]">Dodaj wolne</p>
        <div class="flex w-full gap-[50px]">
            <div class="w-full relative select-none h-[450px]">
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
                        <InputSelect v-model="dateEnd" :options="dateEndOptions" placeholder="Wybierz datę zakończenia" />
                    </div>
                </Transition>
                <div class="absolute bottom-[0px] right-[0px]">
                    <Button class="primary-button" @click="addVacation()">Dodaj</Button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useNuxtApp } from "nuxt/app";

const axiosInstance = useNuxtApp().$axiosInstance as any;

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
    { value: 4, label: 'Kacper' },
];

const schedule = ref([]) as any;

watch(selectDoctor, (val) => {
    newDoctor.value = val;
});

watch(timeStart, async (val) => {
    if (val) {
        console.log(val)
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
            start_date: newDate.value,
        }
        const res = await axiosInstance.post('/fully-available-days', data)

        dateEndOptions.value = res.data
        isNonAllDay.value = false
        setTimeout(() => {
            isAllDay.value = true
        }, 310)
    } else {
        isAllDay.value = false
        setTimeout(() => {
            isNonAllDay.value = true
        }, 310)
    }
})

onMounted(async () => {
    try {
        const res = await axiosInstance.get('/schedule/available-days');
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
    newDoctor.value = ''
    newDate.value = ''
    allDay.value = false,
        timeStart.value = ''
    timeEnd.value = ''
}

const addVacation = async () => {

    const data = {
        doctor_id: newDoctor.value,
        date: newDate.value,
        all_day: allDay.value,
        start_time: timeStart.value,
        end_time: timeEnd.value,
    };

    try {
        const res = await axiosInstance.post('/add-vacations', data);
        console.log('Wizyta dodana:', res.data);

        clearInputs();
    } catch (err) {
        console.error('Błąd podczas dodawania wizyty:', err);
    }
};
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

.checkbox-wrapper {
    display: inline-flex;
    align-items: center;
    cursor: pointer;
    font-size: 16px;
    gap: 8px;
    user-select: none;
    margin-top: 16px
}

.checkbox-wrapper-none {
    display: inline-flex;
    align-items: center;
    cursor: default;
    font-size: 16px;
    gap: 8px;
    user-select: none;
    margin-top: 16px
}

/* ukrywamy natywne pole */
.checkbox-hidden {
    position: absolute;
    opacity: 0;
    cursor: pointer;
}

/* kwadracik */
.checkbox-custom {
    width: 20px;
    height: 20px;
    border: 2px solid #d1d1d1;
    border-radius: 6px;
    display: inline-block;
    position: relative;
    transition: all 0.2s ease;
}

/* zaznaczenie (ptaszek) */
.checkbox-hidden:checked+.checkbox-custom {
    background-color: #31a9ce;
    border-color: #31a9ce;
}

.checkbox-hidden:checked+.checkbox-custom::after {
    content: "";
    position: absolute;
    left: 5px;
    top: 2px;
    width: 5px;
    height: 10px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
}
</style>
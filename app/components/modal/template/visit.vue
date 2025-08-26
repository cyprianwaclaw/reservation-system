<template>
    <div class="flex w-full gap-[50px] h-full cursor-default" v-if="visitData?.user">
        <div class="w-full relative">
            <p class="primary-color font-semibold text-[13px]">Pacjent</p>
            <div class="flex place-items-center gap-[14px]">
                <p class="text-[26px] font-bold">{{ visitData.user.name }} {{ visitData.user.surname }}</p>
            </div>
            <div class="mt-[6px] gap-[4px] flex flex-col">
                <div class="flex place-items-center gap-[8px]">
                    <p class="text-[#bababa] text-[15px]">{{ visitData.user.email }}</p>
                    <span class="dot"/>
                    <p class="text-[#bababa] text-[15px]">{{ visitData.user.phone }}</p>
                </div>
                <p class="text-[#bababa] text-[15px] -mt-[3px]">{{ visitData.user }}</p>
            </div>
            <p class="text-[15px] font-semibold  primary-color  mt-[24px]">Usługa: <span
                    class="font-medium text-black-own">Wizyta u
                    fizjoterapeuty</span></p>
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
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
                        incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                        exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute
                        irure
                        dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
                        pariatur.
                        Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
                        mollit anim id est laborum.
                    </p>
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
                <div class="w-full flex justify-between mb-[6px]">
                    <p class="flex font-semibold text-[17px] -mt-[6px]">Zmień termin wizyty</p>
                    <Icon name="carbon:close" size="32" class="close-icon -mt-[12px] -mr-[10px]"
                        @click="isChangeDate = false" />
                </div>
                <!-- Data -->
                <InputSelect v-model="newDate" :options="dateOptions" placeholder="Wybierz datę" />
                <InputSelect v-model="newDoctor" :options="doctorOptions" placeholder="Wybierz lekarza"
                    :disabled="newDate ? false : true" />
                <InputSelect v-model="newTime" :options="timeOptions" placeholder="Wybierz godzinę"
                    :disabled="newDoctor ? false : true" />
                <!-- Przyciski -->
                <div class="flex mt-[10px]">
                    <!-- <Button class="remove-button" @click="confirmChangeDate()">Potwierdź</Button> -->
                    <button class="primary-button" @click="confirmChangeDate()">Zapisz</button>
                </div>
            </div>
            <!-- Blok standardowych przycisków -->
            <div class="w-full flex justify-start gap-[6px] absolute bottom-0" v-if="!isDelete && !isChangeDate">
                <button class="primary-button" @click="openChangeDate()">Zmień termin</button>
                <button class="remove-button" @click="isDelete = true">Odwołaj wizytę</button>
            </div>
        </div>
        <div class="w-full">
            <div class="w-full mt-[14px]">
                <p class="text-[16px] font-semibold mb-[13px] primary-color ">Poprzednie wizyty</p>
                <div class="max-h-[300px] overflow-y-auto rounded-xl" v-if="visitData.notes.length > 0">
                    <div v-for="(single, index) in visitData.notes" :key="index"
                        class="w-full py-[18px] px-[18px] rounded-xl bg-[#f0f0f097]"
                        :class="index === 0 ? 'mt-[0px]' : 'mt-[10px]'">
                        <p class="text-[13px] text-[#aeaeaed5] -mt-[2px]">{{ single.note_date }}</p>
                        <p class="text-[15px] text-[#8b8b8b] mt-[3px]">{{ single.text }}</p>
                    </div>
                </div>
                <div v-else>
                    <p class="text-[#8b8b8b6a] font-bold text-[22px]">Brak wizyt</p>
                </div>
            </div>
            <div>
                <div class="relative mt-[18px]">
                    <textarea v-model="newNote" placeholder="Dodaj opis..." class="add-description"></textarea>
                    <button class="primary-button-ghost absolute bottom-[23px] right-[17px]" @click="addNote()">Dodaj
                        notatkę</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const { closeModal } = useCloseModal()
const axiosInstance = useNuxtApp().$axiosInstance as any;

const props = defineProps({
    vistId: {
        type: Array,
        required: false,
    }
})

const newDate = ref('')
const newDoctor = ref(null as null | number)
const newTime = ref('')
const schedule = ref([]) as any
const visitData = ref([]) as any
const newNote = ref<string>('')
const isDelete = ref<boolean>(false)
const isChangeDate = ref<boolean>(false)
const showModal = ref(false);

onMounted(async () => {
    const res = await axiosInstance.get(`/schedule/visits/${props.vistId}`)
    visitData.value = res.data
})

const addNote = async () => {
    if (newNote.value.length > 3) {
        const newNoteRes = await axiosInstance.post(`/visits/${props.vistId}/notes`, {
            'text': newNote.value
        })
        newNote.value = ''
        const res = await axiosInstance.get(`/schedule/visits/${props.vistId}`)
        visitData.value = res.data
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
    const res = await axiosInstance.get('/schedule/available-days')
    schedule.value = res.data
}

const doctorsForSelectedDate = computed(() => {
    const day = schedule.value.find((d: any) => d.date === newDate.value)
    return day ? day.doctors : []
})

const availableTimes = computed(() => {
    const doc = doctorsForSelectedDate.value.find((d: any) => d.doctor_id === newDoctor.value)
    return doc ? doc.free_slots : []
})

const confirmChangeDate = async () => {
    if (!newDate.value || !newDoctor.value || !newTime.value) return;

    await axiosInstance.put(`/visits/${props.vistId}/update`, {
        date: newDate.value,
        hour: newTime.value,
        doctor_id: newDoctor.value,
    })
    isChangeDate.value = false
    closeModal()
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
    schedule.value.map((item: any) => ({
        value: item.date,
        label: formatDateDDMMYYYY(item.date),
    }))
);

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
    padding: 34px;
    background-color: #ffffff;
    border-radius: 10px;
    border: 1px solid #e6e9ef;
    box-shadow: 0 8px 24px rgba(16, 24, 40, 0.12);
    position: absolute;
    bottom: 0;
    width: 400px;
    height: 324px
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
</style>
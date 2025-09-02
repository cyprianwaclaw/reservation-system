<template>
    <div class="flex w-full px-[100px] mx-auto" @click="resetErrors()">
        <div v-if="isLoading">
            <LoadingSpinner :isLoading="true" />
        </div>
        <div class="flex w-full mt-[70px] mb-[60px]">
            <Transition name="fade-slide">
                <div v-if="isConfirmed" class="confirmation mt-[60px] w-[450px]">
                    <SuccessCheck />
                    <p class="text-[28px] font-semibold">
                        Zarezerwowano wizytę!
                    </p>
                    <div class="flex flex-col">
                        <p class="mt-[8px] text-[17px]">
                            Dzień dobry
                            <span class="primary-color font-semibold underline">{{ confirmed?.name }}</span>, <br />
                            dziękujemy za umówienie wizyty w naszym gabinecie.
                            Dzień przed wizytą otrzymasz e-maila oraz SMS z przypomnieniem
                        </p>
                        <div class="bg-[#31a9ce29] mt-[32px] mb-[6px] p-[26px] rounded-xl">
                            <p class="text-[21px] font-semibold mb-[8px]">Szczegóły wizyty</p>
                            <div class="flex flex-col gap-[2px]">
                                <p class="text-[17px]">
                                    Termin:
                                    <span class="primary-color font-semibold underline text-[19px]">{{ confirmed?.date
                                    }}</span>
                                </p>
                                <p class="text-[17px]">
                                    Godzina:
                                    <span class="primary-color font-semibold underline text-[19px]">{{ confirmed?.hour
                                    }}</span>
                                </p>
                                <p class="text-[17px]">
                                    Lekarz:
                                    <span class="primary-color font-semibold underline text-[19px]">{{ confirmed?.doctor
                                    }}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </Transition>

            <Transition name="fade-slide">
                <div v-if="isNonConfirmed" class="w-[450px]">
                    <p class="text-[15px] text-[#c2c2c2] mb-[6px] font-semibold h-[20px]">
                        <span v-if="!isLoading">Dzień dobry {{ user?.name }}</span>
                    </p>
                    <h2 class="text-[40px] font-bold mb-[10px]">Zmień termin wizyty</h2>
                    <p class="text-[18px] text-gray-600 mb-[24px]">
                        Tutaj możesz zmienić termin swojej wizyty <br />
                        w naszym gabinecie
                    </p>
                    <Calendar v-model="selectedDate" :available-days="availableDays" />
                    <div class="pb-[160px] mt-[30px]">
                        <div class="person-picker mt-[20px]">
                            <h3>Wybierz lekarza</h3>
                            <div class="persons-grid">
                                <div v-for="person in persons" :key="person.doctor_id"
                                    :class="['person', { selected: selectedPerson === person.doctor_id }]"
                                    @click="selectPerson(person.doctor_id)">
                                    {{ person.name }} {{ person.surname }}
                                </div>
                            </div>
                        </div>

                        <div class="time-picker mt-[20px]">
                            <h3>Dostępne godziny</h3>
                            <div class="time-grid">
                                <div v-for="time in availableTimesForPerson" :key="time"
                                    :class="['time', { selected: selectedTime === time }]" @click="selectTime(time)">
                                    {{ time }}
                                </div>
                            </div>
                        </div>

                        <div class="booking-form mt-[20px]">
                            <h3>Usługa</h3>
                            <InputSelect v-model="selectedType" :options="visitTypeOptions"
                                placeholder="Wybierz usługę, jaka Cię interesuje" class="-mt-[2px]" />
                        </div>
                        <button @click="newTerminSave()" class="reserve-button mt-[52px]">Zmień termin wizyty</button>
                    </div>
                </div>
            </Transition>
        </div>

        <div class="main-photo flex items-center justify-center">
            <img class="hero-photo" src="@/assets/images/hero-photo.png" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

const { resetErrors } = useErrors()
const route = useRoute()
const axiosInstance = useNuxtApp().$axiosInstance as any

const selectedDate = ref<string | null>(null)
const selectedPerson = ref<number | null>(null)
const selectedTime = ref<string | null>(null)
const selectedType = ref<string | null>(null)

const confirmed = ref<null | { date: string; doctor: string; hour: string; name: string }>(null)
const isNonConfirmed = ref(true)
const isConfirmed = ref(false)
const user = ref<any>(null)
const visit = ref<any>(null)

const isLoading = ref(true)

const user_id = Number(route.params.user_id)
const visit_id = Number(route.params.visit_id)

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

const availableDays = ref<any[]>([])

function formatVisitDateToISO(dateStr: string) {
    const [day, month, year] = dateStr.split('.')
    return `${year}-${month}-${day}`
}

async function loadVisitAndAvailableDays(visit_id: number) {
    try {
        const resVisit = await axiosInstance.get(`/visits/${visit_id}`)
        visit.value = resVisit.data

        const resUser = await axiosInstance.get(`/users/${user_id}`)
        user.value = resUser.data

        const today = new Date()
        const daysAhead = 15
        const res = await axiosInstance.get('/available-days', {
            params: { start_date: today.toISOString().split('T')[0], days_ahead: daysAhead }
        })

        const blockedHours = ["07:30", "08:15", "18:00", "18:45", "19:30", "20:15"]

        // availableDays.value = res.data.map((day: any) => ({
        //     ...day,
        //     doctors: day.doctors.map((doc: any) => ({
        //         ...doc,
        //         free_slots: doc.free_slots.filter((slot: string) => !blockedHours.includes(slot))
        //     }))
        // }))
        availableDays.value = res.data.map((day: any) => ({
            ...day,
            doctors: day.doctors.map((doc: any) => {
                // Filtrujemy zablokowane sloty
                let freeSlots = doc.free_slots.filter((slot: string) => !blockedHours.includes(slot))

                // Dodajemy godzinę wizyty, jeśli dotyczy tego doktora i tego dnia
                if (
                    visit.value &&
                    day.date === formatVisitDateToISO(visit.value.date) &&
                    doc.doctor_id === visit.value.doctor &&
                    !freeSlots.includes(visit.value.start_time)
                ) {
                    freeSlots.push(visit.value.start_time)
                    freeSlots.sort() // opcjonalnie, żeby utrzymać kolejność godzin
                }

                return {
                    ...doc,
                    free_slots: freeSlots
                }
            })
        }))

        const visitDateISO = formatVisitDateToISO(visit.value.date)
        const day = availableDays.value.find((d: any) => d.date === visitDateISO)
        if (day) {
            const doctor = day.doctors.find((d: any) => d.doctor_id === visit.value.doctor)
            if (doctor) {
                selectedDate.value = visitDateISO
                selectedPerson.value = visit.value.doctor
                selectedTime.value = visit.value.start_time
                // selectedTime.value = doctor.free_slots.includes(visit.value.start_time)
                //     ? visit.value.start_time
                //     : doctor.free_slots[0] || null
            }
        }

        const matchingType = visitTypeOptions.value.find(
            (opt) => opt.value === visit.value.type || opt.label.includes(visit.value.type)
        )
        selectedType.value = matchingType ? matchingType.value : null

        isLoading.value = false;

    } catch (error) {
        console.error('Błąd ładowania wizyty lub dostępnych dni:', error)
    }
}

const persons = computed(() => {
    const day = availableDays.value.find(d => d.date === selectedDate.value)
    return day ? day.doctors : []
})

const availableTimesForPerson = computed(() => {
    const day = availableDays.value.find(d => d.date === selectedDate.value)
    if (!day) return []
    const doctor = day.doctors.find((d: any) => d.doctor_id === selectedPerson.value) as any
    return doctor ? doctor.free_slots : []
})

function selectPerson(doctor_id: number) {
    selectedPerson.value = doctor_id
    selectedTime.value = null
    confirmed.value = null
}

function selectTime(time: string) {
    selectedTime.value = time
    confirmed.value = null
}

onMounted(() => {
    loadVisitAndAvailableDays(visit_id)
})

const newTerminSave = async (): Promise<any> => {

    // const confirmChangeDate = async () => {
    //     if (!newDate.value || !newDoctor.value || !newTime.value) return;

    // if (!selectedDate.value || !selectedTime.value || !selectedPerson.value) return;
    //     await axiosInstance.put(`/visits/${props.vistId}/update`, {
    //         date: newDate.value,
    //         hour: newTime.value,
    //         doctor_id: newDoctor.value,
    //     })
    //     isChangeDate.value = false
    //     closeModal()
    // }

    await axiosInstance.put(`visits-update/${visit_id}`, {
        date: selectedDate.value,
        hour: selectedTime.value,
        doctor_id: selectedPerson.value,
        duration: 45,
    })

    const doctor: any = persons.value.find((d: any) => d.doctor_id === selectedPerson.value)
    confirmed.value = {
        date: selectedDate.value as any,
        doctor: doctor ? `${doctor.name} ${doctor.surname}` : '',
        hour: selectedTime.value as any,
        name: (user.value as any).name
    } as any;
};

watch(confirmed, async (val) => {
    if (val) {
        isNonConfirmed.value = false
        setTimeout(() => {
            isConfirmed.value = true
        }, 310)
    }
    else {
        isConfirmed.value = false
        setTimeout(() => {
            isNonConfirmed.value = true
        }, 310)
    }
})
</script>

<style scoped>
.persons-grid {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.person {
    padding: 6px 13px;
    border-radius: 10px;
    height: 40px;
    border: 1px solid #31a9ce;
    cursor: pointer;
    background: white;
    transition: all 0.2s;
}

.person.selected,
.person.selected:hover {
    background: #31a9ce;
    color: white;
}

.time-grid {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 12px;
}

.time {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px 12px;
    border-radius: 10px;
    border: 1px solid #31a9ce;
    cursor: pointer;
    height: 36px;
    width: 67px;
    text-align: center;
    background: white;
    transition: all 0.2s;
}

.time.selected,
.time.selected:hover {
    background: #31a9ce;
    color: white;
}

.time:hover,
.person:hover {
    background: #29afd81d;
}

h3 {
    font-size: 17px;
    font-weight: 600;
    margin-top: 45px;
    margin-bottom: 13px;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
    transition: all 0.4s ease;
}

.fade-slide-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

.fade-slide-enter-from {
    opacity: 0;
    transform: translateY(10px);
}

.fade-slide-enter-to,
.fade-slide-leave-from {
    opacity: 1;
    transform: translateY(0);
}
</style>
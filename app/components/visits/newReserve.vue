<template>
    <div class="calendar w-[450px] select-none">
        <Transition name="fade-slide">
            <div v-if="isConfirmed" class="confirmation md:mt-[60px]">
                <!-- <div v-if="true" class="confirmation md:mt-[60px]"> -->
                <div class="w-[57px] md:w-full -mb-[12px] md:mb-[0px]">
                    <SuccessCheck />
                </div>
                <p class="md:text-[28px] text-[21px] font-semibold">
                    Zarezerwowano wizytę!
                </p>
                <div class="flex flex-col">
                    <p class="mt-[12px] text-[17px] md:mt-[8px]">
                        Dzień dobry <span class="primary-color font-semibold underline">{{ confirmed?.name }}</span>,
                    </p>
                    <p class="md:mt-[8px] mt-[5px] text-[17px]">
                        dziękujemy za umówienie wizyty w naszym gabinecie.
                        Dzień przed wizytą otrzymasz e-maila oraz SMS z przypomnieniem
                    </p>
                    <div class="bg-[#31a9ce29] mt-[32px] mb-[6px] p-[26px] rounded-xl">
                        <p class="text-[21px] font-semibold mb-[8px]">Szczegóły wizyty</p>
                        <div class="flex flex-col gap-[2px]">
                            <p class="text-[17px]">
                                Termin: <span class="primary-color font-semibold underline text-[19px]">{{ confirmed?.date
                                }}</span>
                            </p>
                            <p class="text-[17px]">
                                Godzina: <span class="primary-color font-semibold underline text-[19px]">{{ confirmed?.hour
                                }}</span>
                            </p>
                            <p class="text-[17px]">
                                Lekarz: <span class="primary-color font-semibold underline text-[19px]">{{ confirmed?.doctor
                                }}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
        <Transition name="fade-slide">
            <div v-if="isNonConfirmed">
                <h2 class="md:text-[40px] text-[28px] font-bold mb-[4px]">Umów wizytę</h2>
                <p class="text-[18px]  hidden md:flex text-gray-600 mb-[24px]">
                    Wybierz dogodny dla siebie termin z kalendarza poniżej <br>i zarezerwuj wizytę online.
                    To szybkie i wygodne, wystarczy kilka kliknięć
                </p>
                <p class="flex md:hidden text-[16px]  text-gray-600 mb-[24px]">
                    Wybierz dogodny dla siebie termin z kalendarza poniżej i zarezerwuj wizytę online.
                    To szybkie i wygodne, wystarczy kilka kliknięć
                </p>
                <!-- {{  }} -->
                <!-- Kalendarz -->
                <div class="md:w-[370px] w-[340px] border-calendar md:mt-[44px] mt-[32px] p-[25px]">
                    <!-- <div class="mb-2 text-sm text-gray-500">Dostępnych dni: {{ availableDays.length }}</div> -->
                    <div class="calendar-header">
                        <Icon v-if="canGoPrev" @click="prevMonth" name="ph:caret-left-bold" size="27"
                            class="close-icon w-[40px] pl-[30px]" />
                        <!-- <button v-if="canGoPrev" class="nav-btn" @click="prevMonth">‹</button> -->
                        <div v-else class="w-[40px]" />
                        <div class="month-label text-center w-full">{{ monthLabel }}</div>
                        <Icon v-if="canGoNext" @click="nextMonth" name="ph:caret-right-bold" size="27"
                            class="close-icon w-[40px] pr-[30px]" />
                        <!-- <button v-if="canGoNext" class="nav-btn" @click="nextMonth">›</button> -->
                        <div v-else class="w-[40px]" />
                    </div>

                    <div class="weekday-row  mt-[21px]">
                        <div v-for="d in weekdays" :key="d" class="weekday-cell">{{ d }}</div>
                    </div>

                    <div class="days-grid">
                        <button v-for="day in monthDaysWithBlanks" :key="day.date || day.day + '-' + day.isBlank"
                            class="day-cell" :class="{
                                'other-month': day.isBlank,
                                today: day.date === todayDateStr,
                                selected: selectedDate === day.date,
                                disabled: !isAvailable(day.date) || day.isBlank
                            }" @click="!day.isBlank && isAvailable(day.date) && selectDate(day.date)"
                            :aria-pressed="selectedDate === day.date ? 'true' : 'false'">
                            {{ day.isBlank ? '' : day.day }}
                        </button>
                    </div>
                </div>
                <div v-if="selectedDate || selectedPerson || selectedTime" class="md:pb-[160px] pb-[28px]">
                    <!-- Wybór lekarza -->
                    <div v-if="selectedDate" class="person-picker md:mt-[50px]">
                        <h3>Wybierz lekarza</h3>
                        <div class="persons-grid -mt-[3px] md:mt-[0px]">
                            <div v-for="person in persons" :key="person.doctor_id"
                                :class="['person', { selected: selectedPerson === person.doctor_id }]"
                                @click="selectPerson(person.doctor_id)">
                                {{ person.name }} {{ person.surname }}
                            </div>
                        </div>
                    </div>

                    <!-- Wybór godziny -->
                    <div v-if="selectedDate && selectedPerson" class="time-picker">
                        <h3>Dostępne godziny</h3>
                        <div class="time-grid">
                            <div v-for="time in availableTimesForPerson" :key="time"
                                :class="['time', { selected: selectedTime === time }]" @click="selectTime(time)">
                                {{ time }}
                            </div>
                            <div v-if="availableTimesForPerson.length === 0" class="no-times">
                                Brak dostępnych godzin
                            </div>
                        </div>
                    </div>
                    <div v-if="selectedDate && selectedPerson && selectedTime" class="booking-form">
                        <h3>Usługa</h3>
                        <InputSelect v-model="visitType" :options="visitTypeOptions"
                            placeholder="Wybierz usługę, jaka Cię interesuje" class="-mt-[2px]" />
                    </div>

                    <!-- Formularz rezerwacji -->
                    <div v-if="selectedDate && selectedPerson && selectedTime" class="booking-form">
                        <h3>Twoje dane</h3>
                        <div class="md:flex hidden  place-items-center gap-[3px] text-[#4658e3] -mt-[6px] mb-[18px]">
                            <Icon name="ph:warning-circle" size="23" />
                            <p class="text-[14px] ">Wymagamy tylko imienia, nazwiska oraz numeru telefonu</p>
                        </div>

                        <form @submit.prevent="book">
                            <div class="w-full flex flex-col gap-[10px]">
                                <div class="w-full flex md:flex-row flex-col gap-[10px]">
                                    <InputBase v-model="form.name" name="name" placeholder="Imię" />
                                    <InputBase v-model="form.surname" name="surname" placeholder="Nazwisko" />
                                </div>
                                <div class="w-full flex md:flex-row flex-col gap-[10px]">
                                    <!-- <InputBase v-model="form.email" name="email" placeholder="E-mail" /> -->
                                    <div class="w-full flex flex-row gap-[14px] place-items-center">
                                        <p>Ile masz lat?</p>
                                        <div class="w-[114px]">
                                            <InputBase v-model="form.wiek" name="wiek" placeholder="Wiek" />
                                        </div>
                                    </div>
                                    <InputBase v-model="form.phone" name="phone" placeholder="Telefon" />
                                </div>
                                <InputBase v-model="form.email" name="email" placeholder="E-mail" class=",d:my-[12px]" />
                                <textarea v-model="form.description" placeholder="Opisz swoje dolegliwości..."
                                    class="add-description min-h-[170px]"></textarea>
                            </div>
                            <div class="md:mt-[15px] mt-[4px]">
                                <label class="checkbox-wrapper">
                                    <input type="checkbox" v-model="isChecked" class="checkbox-hidden" />
                                    <span class="checkbox-custom"></span>
                                    <p class="text-[#8a8a8a] mt-[2px]">akceptuje regulamin i politykę prywatności</p>
                                </label>
                                <LoadingButton type="submit" class="md:mt-[32px] mt-[21px]" :isLoading="isApiLoading"
                                    text="Zarezerwuj wizytę" />

                                <!-- <button type="submit" class="reserve-button mt-[16px]">Zarezerwuj wizytę</button> -->
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">
const isApiLoading = ref(false)
const hoveredPerson = ref<number | null>(null)
const axiosInstance = useNuxtApp().$axiosInstance as any
const { setErrors } = useErrors()

const emit = defineEmits<{ (e: 'isLoading', value: boolean): void }>()

const isLoading = ref(true)

const today = new Date()
const defaultDate = new Date(today)
defaultDate.setDate(today.getDate() + 15)
const defaultDateStr = formatLocalDate(defaultDate)

const test = ref(false)

interface Doctor {
    doctor_id: number
    name: string
    surname: string
    free_slots: string[]
    phone?: string
    lastNote?: string
}

interface AvailableDay {
    date: string
    doctors: Doctor[]
}

// --- Formatowanie daty YYYY-MM-DD ---
function formatLocalDate(date: Date): string {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
}
// --- Reactive states ---
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth())
// today już zadeklarowane wyżej
const todayDateStr = formatLocalDate(today)
const startYear = today.getFullYear()
const startMonth = today.getMonth()

// const maxMonthsAhead = 1

const selectedDate = ref<string | null>(defaultDateStr)
const selectedPerson = ref<number | null>(null)
const selectedTime = ref<string | null>(null)
const availableDays = ref<AvailableDay[]>([])

const form = ref({ name: '', surname: '', phone: '', email: '', wiek: '', description: '' })
const isChecked = ref(false)
const confirmed = ref<null | { date: string | any; doctor: string | any; hour: string | any, name: string | any }>(null)
const isNonConfirmed = ref(true)
const isConfirmed = ref(false)
const visitType = ref()

const visitTypeOptions = ref([
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

const weekdays = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd']

// Lista lekarzy w wybranym dniu
const persons = computed(() => {
    if (!selectedDate.value) return []
    const day = availableDays.value.find(d => d.date === selectedDate.value)
    // Filtrowanie: nie pokazuj lekarza o imieniu 'Ola'
    return day ? day.doctors.filter(doc => doc.name !== 'Ola') : []
})

// --- Pobierz dostępne dni od dziś do dziś następnego miesiąca +1 ---
async function loadAvailableDays() {
    try {
        const today = new Date()
        const daysAhead = 15

        const res = await axiosInstance.get('/available-days', {
            params: {
                start_date: today.toISOString().split('T')[0],
                days_ahead: daysAhead,
            },
        })

        // godziny które chcesz wycinać
        const blockedHours = ["07:30", "08:15", "18:00", "18:45", "19:30", "20:15"]

        // mapowanie i filtrowanie godzin
        availableDays.value = res.data.map((day: any) => ({
            ...day,
            doctors: day.doctors.map((doc: any) => ({
                ...doc,
                free_slots: doc.free_slots.filter((slot: string) => !blockedHours.includes(slot)),
            })),
        }))
        emit('isLoading', false)
    } catch (error) {
        console.error('Błąd ładowania dostępnych dni:', error)
    }
}


// --- Generowanie dni z pustymi dniami dla wyrównania tygodnia ---
function getAllDatesWithBlanks(year: number, month: number) {
    const daysArr: { day: number; date: string; isBlank: boolean }[] = []
    const firstDayDate = new Date(year, month, 1)
    let firstWeekday = firstDayDate.getDay()
    firstWeekday = firstWeekday === 0 ? 6 : firstWeekday - 1

    for (let i = 0; i < firstWeekday; i++) {
        daysArr.push({ day: 0, date: '', isBlank: true })
    }

    const lastDay = new Date(year, month + 1, 0).getDate()
    for (let day = 1; day <= lastDay; day++) {
        const d = new Date(year, month, day)
        daysArr.push({ day, date: formatLocalDate(d), isBlank: false })
    }

    return daysArr
}

const monthDaysWithBlanks = computed(() => getAllDatesWithBlanks(currentYear.value, currentMonth.value))
const monthLabel = computed(() => {
    const date = new Date(currentYear.value, currentMonth.value)
    return date.toLocaleDateString('pl-PL', { year: 'numeric', month: 'long' })
})

// Sprawdzenie dostępności
function isAvailable(date: string) {
    return availableDays.value.some(day => day.date === date)
}

// Wybór daty
function selectDate(date: string) {
    if (!isAvailable(date)) return
    selectedDate.value = date
    selectedPerson.value = null
    selectedTime.value = null
    confirmed.value = null
}

// Wybór lekarza
function selectPerson(doctor_id: number) {
    selectedPerson.value = doctor_id
    selectedTime.value = null
    confirmed.value = null
}

// Godziny dla wybranego lekarza
const availableTimesForPerson = computed(() => {
    if (!selectedDate.value || !selectedPerson.value) return []
    const day = availableDays.value.find(d => d.date === selectedDate.value)
    if (!day) return []
    const doctor = day.doctors.find(d => d.doctor_id === selectedPerson.value)
    return doctor ? doctor.free_slots : []
})

function selectTime(time: string) {
    selectedTime.value = time
    confirmed.value = null
}

// Rezerwacja
async function book() {
    // if (!selectedDate.value || !selectedPerson.value || !selectedTime.value) return
    if (!form.value.name || !form.value.surname || !form.value.phone || !isChecked.value) return

    isApiLoading.value = true
    try {
        await axiosInstance.post('/reserve', {
            doctor_id: selectedPerson.value,
            name: form.value.name,
            surname: form.value.surname,
            phone: form.value.phone,
            email: form.value.email,
            wiek: form.value.wiek,
            opis: form.value.description,
            date: selectedDate.value,
            type: visitType.value,
            start_time: selectedTime.value,
            duration: 45,
        })

        await loadAvailableDays()

        const doctor = persons.value.find(d => d.doctor_id === selectedPerson.value)

        confirmed.value = {
            date: selectedDate.value,
            doctor: doctor ? `${doctor.name} ${doctor.surname}` : '',
            hour: selectedTime.value,
            name: form.value.name
        }

        selectedDate.value = null
        selectedPerson.value = null
        selectedTime.value = null
        isChecked.value = false

        form.value = { name: '', surname: '', phone: '', email: '', wiek: '', description: '' }

    } catch (err: any) {
        if (err.response?.data?.errors) {
            setErrors(err.response.data.errors);
        }
    } finally {
        setTimeout(() => {
            isApiLoading.value = false
        }, 250)
    }
}

// Nawigacja miesięcy
const canGoPrev = computed(() => {
    return (
        currentYear.value > startYear ||
        (currentYear.value === startYear && currentMonth.value > startMonth)
    )
})
const canGoNext = computed(() => {
    // Strzałka do kolejnego miesiąca tylko jeśli defaultDate wypada w następnym miesiącu
    const defaultMonth = defaultDate.getMonth()
    const defaultYear = defaultDate.getFullYear()
    const currentMonthNumber = currentYear.value * 12 + currentMonth.value
    const defaultMonthNumber = defaultYear * 12 + defaultMonth
    // Pokazuj strzałkę tylko jeśli defaultDate jest w kolejnym miesiącu względem startMonth
    return currentMonthNumber < defaultMonthNumber
})

function prevMonth() {
    if (!canGoPrev.value) return
    if (currentMonth.value === 0) {
        currentMonth.value = 11
        currentYear.value -= 1
    } else currentMonth.value -= 1
}

function nextMonth() {
    if (!canGoNext.value) return
    if (currentMonth.value === 11) {
        currentMonth.value = 0
        currentYear.value += 1
    } else currentMonth.value += 1
}

// Watch na zmianę miesiąca
watch([currentYear, currentMonth], () => {
    loadAvailableDays()
    selectedDate.value = null
    selectedPerson.value = null
    selectedTime.value = null
    confirmed.value = null
}, { immediate: true })

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
.days-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 6px;
    margin-bottom: 12px;
}

.day-cell {
    width: 36px;
    height: 36px;
    border-radius: 999px;
    border: none;
    background: transparent;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 500;
}

.day-cell:hover {
    background: #29afd81d;
}

.day-cell.other-month {
    color: #9ca3af;
    opacity: 0.6;
}

.day-cell.today {
    box-shadow: inset 0 0 0 1px #31a9ce;
}

.day-cell.selected {
    background: #31a9ce;
    color: #fff;
}

.day-cell.disabled {
    color: #d1d5db;
    cursor: not-allowed;
    pointer-events: none;
}

.calendar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
}

.month-label {
    font-weight: 700;
    margin-top: 1px;
    text-transform: capitalize;
    /* color: #31a9ce9f; */
    font-size: 20px;
}

.nav-btn {
    background: none;
    border: none;
    font-size: 18px;
    width: 40px;
    height: 40px;
    border-radius: 999px;
    cursor: pointer;
}

.nav-btn:hover {
    background: #29afd81d;
}

.weekday-row {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    text-align: center;
    font-size: 0.85rem;
    color: #6b7280;
    margin-bottom: 6px;
}

.weekday-cell {
    padding: 4px 0;
    color: #31a9ce9f;
    font-weight: 600;
    margin-bottom: 8px;
    font-size: 16px;
}

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

@media (max-width: 768px) {

    h3 {
        font-size: 16px;
        font-weight: 600;
        margin-top: 36px;
        margin-bottom: 12px;
    }
}

@media (min-width: 768px) {

    h3 {
        font-size: 17px;
        font-weight: 600;
        margin-top: 45px;
        margin-bottom: 13px;
    }
}

.border-calendar {
    border: 2px solid #31a9ce;
    border-radius: 12px;
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
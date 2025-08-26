<template>
    <div class="calendar w-[450px]">
        <h class="text-[40px] font-bold">Rezerwuj termin</h>
        <!-- <button type="submit" class="reserve-button">Zarezerwuj</button> -->

        <!-- Kalendarz -->
        <div class="w-[370px] border-calendar mt-[44px] p-[25px] ">
            <div class="calendar-header">
                <Icon  v-if="canGoPrev" @click="prevMonth" name="ph:caret-left-bold" size="27" class="close-icon w-[40px] pl-[30px]"/>
                <!-- <button v-if="canGoPrev" class="nav-btn" @click="prevMonth">‹</button> -->
                <div v-else class="w-[40px]" />
                <div class="month-label text-center w-full">{{ monthLabel }}</div>
                    <Icon  v-if="canGoNext" @click="nextMonth" name="ph:caret-right-bold" size="27" class="close-icon w-[40px] pr-[30px]"/>
                <!-- <button v-if="canGoNext" class="nav-btn" @click="nextMonth">›</button> -->
                <div v-else class="w-[40px]" />
            </div>
            
            <div class="weekday-row  mt-[21px]">
                <div v-for="d in weekdays" :key="d" class="weekday-cell">{{ d }}</div>
            </div>
            
            <div class="days-grid">
                <button v-for="day in monthDaysWithBlanks" :key="day.date || day.day + '-' + day.isBlank" class="day-cell"
                :class="{
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

        <!-- Wybór lekarza -->
        <div v-if="selectedDate" class="person-picker mt-[50px]">
            <h3>Wybierz lekarza</h3>
            <div class="persons-grid">
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

        <!-- Formularz rezerwacji -->
        <div v-if="selectedDate && selectedPerson && selectedTime" class="booking-form">
            <h3>Twoje dane</h3>
            <form @submit.prevent="book">
                <div class="w-full flex flex-col gap-[10px]">
                    <InputBase v-model="form.name" placeholder="Imię" />
                    <InputBase v-model="form.surname" placeholder="Nazwisko" />
                    <InputBase v-model="form.email" placeholder="E-mail" />
                    <InputBase v-model="form.phone" placeholder="Telefon" />
                </div>
                <button type="submit" class="reserve-button mt-[24px]">Zarezerwuj wizytę</button>
            </form>
        </div>

        <!-- Potwierdzenie -->
        <div v-if="confirmed" class="confirmation">
            Zarezerwowano termin: <strong>{{ confirmed.date }}</strong>, lekarz: <strong>{{ confirmed.personName }}</strong>
            o godzinie
            <strong>{{ confirmed.hour }}</strong>
        </div>
    </div>
</template>

<script setup lang="ts">
const axiosInstance = useNuxtApp().$axiosInstance as any

interface Doctor {
    doctor_id: number
    name: string
    surname: string
    free_slots: string[]
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
const today = new Date()
const todayDateStr = formatLocalDate(today)
const startYear = today.getFullYear()
const startMonth = today.getMonth()

const maxMonthsAhead = 1

const selectedDate = ref<string | null>(null)
const selectedPerson = ref<number | null>(null)
const selectedTime = ref<string | null>(null)
const confirmed = ref<null | { date: string; personName: string; hour: string }>(null)
const availableDays = ref<AvailableDay[]>([])

const form = ref({ name: '', surname: '', phone: '', email: '' })

const weekdays = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd']

// Lista lekarzy w wybranym dniu
const persons = computed(() => {
    if (!selectedDate.value) return []
    const day = availableDays.value.find(d => d.date === selectedDate.value)
    return day ? day.doctors : []
})

// --- Pobierz dostępne dni od dziś do dziś następnego miesiąca +1 ---
async function loadAvailableDays() {
    try {
        const today = new Date()
        const nextMonthSameDay = new Date(today)
        nextMonthSameDay.setMonth(today.getMonth() + 1)
        const diffTime = nextMonthSameDay.getTime() - today.getTime()
        const daysAhead = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

        const res = await axiosInstance.get('/schedule/available-days', {
            params: {
                start_date: today.toISOString().split('T')[0],
                days_ahead: daysAhead,
            },
        })

        // godziny które chcesz wycinać
        const blockedHours = ["07:30", "18:45", "19:30", "20:15"]

        // mapowanie i filtrowanie godzin
        availableDays.value = res.data.map((day: any) => ({
            ...day,
            doctors: day.doctors.map((doc: any) => ({
                ...doc,
                free_slots: doc.free_slots.filter((slot: string) => !blockedHours.includes(slot)),
            })),
        }))
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
    if (!selectedDate.value || !selectedPerson.value || !selectedTime.value) return
    if (!form.value.name || !form.value.surname || !form.value.phone || !form.value.email) return alert('Wypełnij wszystkie pola formularza')

    try {
        await axiosInstance.post('/schedule/reserve', {
            doctor_id: selectedPerson.value,
            name: form.value.name,
            surname: form.value.surname,
            phone: form.value.phone,
            email: form.value.email,
            date: selectedDate.value,
            hour: selectedTime.value,
        })

        const doctor = persons.value.find(d => d.doctor_id === selectedPerson.value)
        confirmed.value = {
            date: selectedDate.value,
            personName: doctor ? `${doctor.name} ${doctor.surname}` : '',
            hour: selectedTime.value,
        }

        // Odśwież dane
        await loadAvailableDays()

        // Reset formularza
        selectedDate.value = null
        selectedPerson.value = null
        selectedTime.value = null
        form.value = { name: '', surname: '', phone: '', email: '' }
    } catch (error) {
        alert('Błąd rezerwacji: ' + error)
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
    const maxMonth = startYear * 12 + startMonth + maxMonthsAhead
    const currentMonthNumber = currentYear.value * 12 + currentMonth.value
    return currentMonthNumber < maxMonth
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

h3 {
    font-size: 17px;
    font-weight: 600;
    margin-top: 40px;
    margin-bottom: 13px;
}

.border-calendar{
    border: 2px solid #31a9ce;
    border-radius: 12px;
}
</style>
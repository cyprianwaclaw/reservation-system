<template>
    <div class="calendar">
        <h2>Wybierz termin wizyty</h2>

        <div class="month-navigation">
            <button @click="prevMonth" :disabled="!canGoPrev">Poprzedni miesiąc</button>
            <span class="month-label">{{ monthLabel }}</span>
            <button @click="nextMonth" :disabled="!canGoNext">Następny miesiąc</button>
        </div>

        <div class="calendar-grid">
            <div v-for="(day, index) in monthDaysWithBlanks" :key="index" :class="[
                'day',
                day.isBlank ? 'blank' : '',
                !day.isBlank && isAvailable(day.date) ? 'available' : '',
                !day.isBlank && selectedDate === day.date ? 'selected' : '',
            ]" @click="!day.isBlank && isAvailable(day.date) && selectDate(day.date)">
                {{ day.isBlank ? '' : day.day }}
            </div>
        </div>

        <div v-if="selectedDate" class="person-picker">
            <h3>Wybierz lekarza</h3>
            <div class="persons-grid">
                <div v-for="person in persons" :key="person.doctor_id"
                    :class="['person', { selected: selectedPerson === person.doctor_id }]"
                    @click="selectPerson(person.doctor_id)">
                    {{ person.name }} {{ person.surname }}
                </div>
            </div>
        </div>

        <div v-if="selectedDate && selectedPerson" class="time-picker">
            <h3>Dostępne godziny dla lekarza w dniu {{ selectedDate }}</h3>
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
            <h3>Formularz rezerwacji</h3>
            <form @submit.prevent="book">
                <input v-model="form.name" placeholder="Imię" required />
                <input v-model="form.surname" placeholder="Nazwisko" required />
                <input v-model="form.phone" placeholder="Telefon" required />
                <input v-model="form.email" type="email" placeholder="Email" required />
                <button type="submit" class="btn-book">Zarezerwuj</button>
            </form>
        </div>

        <div v-if="confirmed" class="confirmation">
            Zarezerwowano termin: <strong>{{ confirmed.date }}</strong>, lekarz: <strong>{{ confirmed.personName }}</strong>
            o godzinie
            <strong>{{ confirmed.hour }}</strong>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

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

// --- Funkcja do generowania lokalnej daty YYYY-MM-DD bez przesunięć ---
function formatLocalDate(date: Date): string {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
}

// --- Reactive states ---
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth())

const maxMonthsAhead = 2
const today = new Date()
const startYear = today.getFullYear()
const startMonth = today.getMonth()

const selectedDate = ref<string | null>(null)
const selectedPerson = ref<number | null>(null) // doctor_id
const selectedTime = ref<string | null>(null)
const confirmed = ref<null | { date: string; personName: string; hour: string }>(null)

const availableDays = ref<AvailableDay[]>([])

// Lista lekarzy dostępnych w aktualnym miesiącu i dniu
const persons = computed(() => {
    if (!selectedDate.value) return []
    const day = availableDays.value.find(d => d.date === selectedDate.value)
    return day ? day.doctors : []
})

// --- Pobierz dostępne dni z API ---
async function loadAvailableDays(year: number, month: number) {
    try {
        const res = await axiosInstance.get('/schedule/available-days', {
            params: {
                year,
                month: month + 1, // jeśli API liczy miesiące 1-12
            },
        })
        availableDays.value = res.data
    } catch (error) {
        console.error('Błąd ładowania dostępnych dni:', error)
    }
}

// --- Generuj kalendarz z pustymi dniami dla wyrównania tygodnia ---
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

// Sprawdzenie czy dany dzień jest dostępny (czy jest w availableDays)
function isAvailable(date: string) {
    return availableDays.value.some(day => day.date === date)
}

function selectDate(date: string) {
    if (!isAvailable(date)) return
    selectedDate.value = date
    selectedPerson.value = null
    selectedTime.value = null
    confirmed.value = null
}

function selectPerson(doctor_id: number) {
    selectedPerson.value = doctor_id
    selectedTime.value = null
    confirmed.value = null
}

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

const form = ref({
    name: '',
    surname: '',
    phone: '',
    email: '',
})

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

        // Odśwież dane z API po rezerwacji
        await loadAvailableDays(currentYear.value, currentMonth.value)

        // Reset wyborów i formularza
        selectedDate.value = null
        selectedPerson.value = null
        selectedTime.value = null
        form.value = { name: '', surname: '', phone: '', email: '' }
    } catch (error) {
        alert('Błąd rezerwacji: ' + error)
    }
}

// Kontrola nawigacji miesięcy
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
    } else {
        currentMonth.value -= 1
    }
}

function nextMonth() {
    if (!canGoNext.value) return
    if (currentMonth.value === 11) {
        currentMonth.value = 0
        currentYear.value += 1
    } else {
        currentMonth.value += 1
    }
}

// Watch na zmianę miesiąca, aby załadować dostępne dni
watch(
    [currentYear, currentMonth],
    () => {
        loadAvailableDays(currentYear.value, currentMonth.value)
        selectedDate.value = null
        selectedPerson.value = null
        selectedTime.value = null
        confirmed.value = null
    },
    { immediate: true }
)
</script>

<style scoped>
/* style według Twoich poprzednich założeń */

.calendar {
    max-width: 350px;
    margin: auto;
    font-family: sans-serif;
    user-select: none;
}

.month-navigation {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
}

.month-navigation button {
    background-color: #31a9ce;
    border: none;
    padding: 6px 12px;
    color: white;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
}

.month-navigation button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.month-navigation button:hover:not(:disabled) {
    background-color: #2691b8;
}

.month-label {
    font-weight: 600;
    font-size: 1.1em;
}

.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 6px;
}

.day {
    padding: 8px;
    text-align: center;
    background: #eee;
    border-radius: 4px;
    cursor: not-allowed;
    color: #aaa;
    user-select: none;
}

.day.available {
    background: #dff0d8;
    color: #2d572c;
    cursor: pointer;
}

.day.available:hover {
    background: #bde5a1;
}

.day.selected {
    background: #31a9ce;
    color: white;
}

.day.blank {
    background: transparent;
    cursor: default;
}

.person-picker {
    margin-top: 15px;
}

.persons-grid {
    display: flex;
    gap: 10px;
    margin-top: 5px;
    flex-wrap: wrap;
}

.person {
    background: #eee;
    padding: 6px 10px;
    border-radius: 4px;
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
}

.person.selected {
    background: #31a9ce;
    color: white;
}

.time-picker {
    margin-top: 15px;
}

.time-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 5px;
}

.time {
    background: #eee;
    padding: 6px 10px;
    border-radius: 4px;
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
}

.time:hover {
    background: #ddd;
}

.time.selected {
    background: #31a9ce;
    color: white;
}

.user-data {
    margin-top: 15px;
    display: flex;
    gap: 8px;
    flex-direction: column;
}

.user-data input {
    padding: 6px 10px;
    border-radius: 4px;
    border: 1px solid #ccc;
    font-size: 1em;
}

.btn-book {
    background-color: #31a9ce;
    border: none;
    padding: 8px 15px;
    color: white;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    max-width: 150px;
}

.btn-book:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.confirmation {
    margin-top: 15px;
    font-size: 14px;
    color: green;
    font-weight: 600;
    text-align: center;
}
</style>
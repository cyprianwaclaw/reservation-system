<template>
  <div class="calendar">
    <h2>Wybierz termin wizyty</h2>

    <div class="month-navigation">
      <button @click="prevMonth" :disabled="!canGoPrev">Poprzedni miesiąc</button>
      <span class="month-label">{{ monthLabel }}</span>
      <button @click="nextMonth" :disabled="!canGoNext">Następny miesiąc</button>
    </div>

    <div class="calendar-grid">
      <div
        v-for="(day, index) in monthDaysWithBlanks"
        :key="index"
        :class="[
          'day',
          day.isBlank ? 'blank' : '',
          !day.isBlank && isAvailable(day.date) ? 'available' : '',
          !day.isBlank && selectedDate === day.date ? 'selected' : '',
        ]"
        @click="!day.isBlank && isAvailable(day.date) && selectDate(day.date)"
      >
        {{ day.isBlank ? '' : day.day }}
      </div>
    </div>

    <div v-if="selectedDate" class="person-picker">
      <h3>Wybierz osobę</h3>
      <div class="persons-grid">
        <div
          v-for="person in persons"
          :key="person"
          :class="['person', { selected: selectedPerson === person }]"
          @click="selectPerson(person)"
        >
          {{ person }}
        </div>
      </div>
    </div>

    <div v-if="selectedDate && selectedPerson" class="time-picker">
      <h3>Dostępne godziny dla {{ selectedPerson }} w dniu {{ selectedDate }}</h3>
      <div class="time-grid">
        <div
          v-for="time in availableTimesForPerson"
          :key="time"
          :class="['time', { selected: selectedTime === time }]"
          @click="selectTime(time)"
        >
          {{ time }}
        </div>
        <div v-if="availableTimesForPerson.length === 0" class="no-times">
          Brak dostępnych godzin
        </div>
      </div>
    </div>

    <div v-if="selectedDate && selectedPerson && selectedTime" class="booking-actions">
      <button @click="book" class="btn-book">Zarezerwuj</button>
    </div>

    <div v-if="confirmed" class="confirmation">
      Zarezerwowano termin: <strong>{{ confirmed.date }}</strong>, osoba: <strong>{{ confirmed.person }}</strong> o
      <strong>{{ confirmed.hour }}</strong>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { getFreeSlots, reserveSlot, persons } from '~/composables/useSchedule'

const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth())

// Limit na ile miesięcy w przód można iść (np. 2)
const maxMonthsAhead = 2
const today = new Date()
const startYear = today.getFullYear()
const startMonth = today.getMonth()

const selectedDate = ref<string | null>(null)
const selectedPerson = ref<string | null>(null)
const selectedTime = ref<string | null>(null)
const confirmed = ref<{ date: string; person: string; hour: string } | null>(null)

const availableTimes = ref<Record<string, Record<string, string[]>>>({})

// Załaduj dostępne sloty dla aktualnego miesiąca przy starcie i przy zmianie miesiąca
watch(
  [currentYear, currentMonth],
  () => {
    availableTimes.value = getFreeSlots(currentYear.value, currentMonth.value)
    // Reset wyborów
    selectedDate.value = null
    selectedPerson.value = null
    selectedTime.value = null
    confirmed.value = null
  },
  { immediate: true }
)

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
    daysArr.push({ day, date: d.toISOString().split('T')[0], isBlank: false })
  }

  return daysArr
}

const monthDaysWithBlanks = computed(() => getAllDatesWithBlanks(currentYear.value, currentMonth.value))

const monthLabel = computed(() => {
  const date = new Date(currentYear.value, currentMonth.value)
  return date.toLocaleDateString('pl-PL', { year: 'numeric', month: 'long' })
})

const personsList = persons

const isAvailable = (date: string) => Object.keys(availableTimes.value).includes(date)

function selectDate(date: string) {
  if (!isAvailable(date)) return
  selectedDate.value = date
  selectedPerson.value = null
  selectedTime.value = null
  confirmed.value = null
}

function selectPerson(person: string) {
  selectedPerson.value = person
  selectedTime.value = null
  confirmed.value = null
}

const availableTimesForPerson = computed(() => {
  if (!selectedDate.value || !selectedPerson.value) return []
  return availableTimes.value[selectedDate.value]?.[selectedPerson.value] || []
})

function selectTime(time: string) {
  selectedTime.value = time
  confirmed.value = null
}

function book() {
  if (!selectedDate.value || !selectedPerson.value || !selectedTime.value) return

  reserveSlot(selectedDate.value, selectedPerson.value, selectedTime.value)
  confirmed.value = {
    date: selectedDate.value,
    person: selectedPerson.value,
    hour: selectedTime.value,
  }
  // Po rezerwacji odśwież dostępne sloty (ponownie załaduj miesiąc)
  availableTimes.value = getFreeSlots(currentYear.value, currentMonth.value)

  selectedDate.value = null
  selectedPerson.value = null
  selectedTime.value = null
}

// Kontrola, czy można przejść do poprzedniego miesiąca (nie wyjść przed dzisiejszy)
const canGoPrev = computed(() => {
  return (
    currentYear.value > startYear ||
    (currentYear.value === startYear && currentMonth.value > startMonth)
  )
})

// Kontrola, czy można przejść do następnego miesiąca (maksymalnie 2 miesiące do przodu)
const canGoNext = computed(() => {
  const maxMonth = (startYear * 12 + startMonth) + maxMonthsAhead
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
</script>

<style scoped>
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
}

.person {
  background: #eee;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
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
}

.time:hover {
  background: #ddd;
}

.time.selected {
  background: #31a9ce;
  color: white;
}

.booking-actions {
  margin-top: 15px;
  text-align: center;
}

.btn-book {
  background-color: #31a9ce;
  border: none;
  padding: 8px 15px;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.btn-book:hover {
  background-color: #2691b8;
}

.confirmation {
  margin-top: 15px;
  font-size: 14px;
  color: green;
  font-weight: 600;
  text-align: center;
}
</style>
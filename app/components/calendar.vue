<template>
  <div class="w-[370px] border-calendar mt-[44px] p-[25px]">
    <div class="calendar-header">
      <Icon
        v-if="canGoPrev"
        @click="prevMonth"
        name="ph:caret-left-bold"
        size="27"
        class="close-icon w-[40px] pl-[30px]"
      />
      <div v-else class="w-[40px]" />
      <div class="month-label text-center w-full">{{ monthLabel }}</div>
      <Icon
        v-if="canGoNext"
        @click="nextMonth"
        name="ph:caret-right-bold"
        size="27"
        class="close-icon w-[40px] pr-[30px]"
      />
      <div v-else class="w-[40px]" />
    </div>

    <div class="weekday-row mt-[21px]">
      <div v-for="d in weekdays" :key="d" class="weekday-cell">{{ d }}</div>
    </div>

    <div class="days-grid">
      <button
        v-for="day in monthDaysWithBlanks"
        :key="day.date || day.day + '-' + day.isBlank"
        class="day-cell"
        :class="{
          'other-month': day.isBlank,
          today: day.date === todayDateStr,
          selected: modelValue === day.date,
          disabled: !isAvailable(day.date) || day.isBlank
        }"
        @click="!day.isBlank && isAvailable(day.date) && selectDate(day.date)"
        :aria-pressed="modelValue === day.date ? 'true' : 'false'"
      >
        {{ day.isBlank ? '' : day.day }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string | null
  availableDays: { date: string }[]
}>()

const emit = defineEmits(["update:modelValue"])

const weekdays = ["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"]

// --- daty ---
const today = new Date()
const todayDateStr = formatLocalDate(today)
const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth())
const startYear = today.getFullYear()
const startMonth = today.getMonth()

function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")
  return `${year}-${month}-${day}`
}

function getAllDatesWithBlanks(year: number, month: number) {
  const daysArr: { day: number; date: string; isBlank: boolean }[] = []
  const firstDayDate = new Date(year, month, 1)
  let firstWeekday = firstDayDate.getDay()
  firstWeekday = firstWeekday === 0 ? 6 : firstWeekday - 1

  for (let i = 0; i < firstWeekday; i++) {
    daysArr.push({ day: 0, date: "", isBlank: true })
  }

  const lastDay = new Date(year, month + 1, 0).getDate()
  for (let day = 1; day <= lastDay; day++) {
    const d = new Date(year, month, day)
    daysArr.push({ day, date: formatLocalDate(d), isBlank: false })
  }

  return daysArr
}

const monthDaysWithBlanks = computed(() =>
  getAllDatesWithBlanks(currentYear.value, currentMonth.value)
)

const monthLabel = computed(() => {
  const date = new Date(currentYear.value, currentMonth.value)
  return date.toLocaleDateString("pl-PL", { year: "numeric", month: "long" })
})

// --- nawigacja ---
const canGoPrev = computed(() => {
  return (
    currentYear.value > startYear ||
    (currentYear.value === startYear && currentMonth.value > startMonth)
  )
})

const canGoNext = computed(() => {
  const maxMonthsAhead = 1
  const maxDate = new Date(startYear, startMonth + maxMonthsAhead)
  return (
    currentYear.value < maxDate.getFullYear() ||
    (currentYear.value === maxDate.getFullYear() &&
      currentMonth.value < maxDate.getMonth())
  )
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

// --- sprawdzanie dostępności ---
function isAvailable(date: string) {
  return props.availableDays.some((day) => day.date === date)
}

function selectDate(date: string) {
  emit("update:modelValue", date)
}

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
    margin-top: 45px;
    margin-bottom: 13px;
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
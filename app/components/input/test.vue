<template>
    <div class="calendar-input select-none" ref="root">
        <div :class="open ? 'base-input-focus' : 'base-input'" role="button" tabindex="0" @click="toggle"
            @keydown.enter.prevent="toggle" @keydown.space.prevent="toggle" :aria-expanded="open.toString()"
            aria-haspopup="dialog">
            <div class="flex place-items-center">
                <Icon name="ph:calendar-blank" size="28"
                    :class="open ? 'input-calendar-icon-focus' : 'input-calendar-icon'" />
                <span class="text-black-own mt-[10px]" v-if="selectedLabel">{{ selectedLabel }}</span>
                <span class="placeholder-calendar mt-[10px]" v-else>Wybierz date</span>

            </div>
        </div>

        <div v-if="open" class="calendar-popover cursor-default" role="dialog" aria-modal="false"
            :aria-label="'Wybór daty'">
            <div class="calendar-header">
                <button class="nav-btn" @click="prevMonth" aria-label="Poprzedni miesiąc">‹</button>
                <div class="month-label">{{ currentMonth.format('MMMM YYYY') }}</div>
                <button class="nav-btn" @click="nextMonth" aria-label="Następny miesiąc">›</button>
            </div>

            <div class="weekday-row">
                <div v-for="d in weekdays" :key="d" class="weekday-cell">{{ d }}</div>
            </div>

            <div class="days-grid" role="grid">
                <button v-for="day in days" :key="day.key" class="day-cell"
                    :class="{ selected: day.isSelected, disabled: !day.isAvailable }" @click="select(day.date)"
                    :aria-pressed="day.isSelected ? 'true' : 'false'">
                    <p class="text-[15px] mt-[2px]">
                        {{ day.date.date() }}
                    </p>
                </button>
            </div>

            <!-- <div class="calendar-footer">
                <button class="primary-button-ghost" @click="selectToday">Dziś</button>
            </div> -->
        </div>
    </div>
</template>

<script setup lang="ts">
import dayjs, { Dayjs } from 'dayjs'
import 'dayjs/locale/pl'
dayjs.locale('pl')

const props = defineProps<{
    modelValue?: string | null
    format?: string
    availableDays?: { date: string; doctors: any[] }[]
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', v: string | null): void
    (e: 'select-day', payload: { date: string; doctors: any[] }): void
}>()

const format = props.format ?? 'DD.MM.YYYY'

const open = ref(false)
const root = ref<HTMLElement | null>(null)

const selected = ref<Dayjs | null>(props.modelValue ? dayjs(props.modelValue) : null)
const currentMonth = ref<Dayjs>(selected.value ? selected.value.startOf('month') : dayjs().startOf('month'))
const weekdays = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd']

watch(() => props.modelValue, val => {
    selected.value = val ? dayjs(val) : null
    if (selected.value) currentMonth.value = selected.value.startOf('month')
})

function toggle() { open.value = !open.value }

function handleOutside(e: MouseEvent) {
    if (!root.value) return
    if (!(e.target instanceof Node)) return
    if (!root.value.contains(e.target)) open.value = false
}

onMounted(() => document.addEventListener('click', handleOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleOutside))

function prevMonth() { currentMonth.value = currentMonth.value.subtract(1, 'month') }
function nextMonth() { currentMonth.value = currentMonth.value.add(1, 'month') }

// ✅ Tworzymy Mapę tylko z dostępnych dni, bezpiecznie
const availableDaysMap = computed(() => {
    const map = new Map<string, any[]>()
    if (props.availableDays && Array.isArray(props.availableDays)) {
        props.availableDays.forEach(d => {
            if (d.date) {
                map.set(dayjs(d.date).format('YYYY-MM-DD'), d.doctors ?? [])
            }
        })
    }
    return map
})

// ✅ Generowanie wszystkich dni w siatce kalendarza
const days = computed(() => {
    const startOfMonth = currentMonth.value.startOf('month')
    const startWeekday = startOfMonth.day()
    const daysToSubtract = (startWeekday + 6) % 7
    const gridStart = startOfMonth.subtract(daysToSubtract, 'day')

    const arr: {
        key: string
        date: Dayjs
        inMonth: boolean
        isToday: boolean
        isSelected: boolean
        isAvailable: boolean
    }[] = []

    for (let i = 0; i < 42; i++) {
        const d = gridStart.add(i, 'day')
        const key = d.format('YYYY-MM-DD')
        const isAvailable = availableDaysMap.value.has(key) // ✅ .value jest Mapą

        arr.push({
            key,
            date: d,
            inMonth: d.month() === currentMonth.value.month(),
            isToday: d.isSame(dayjs(), 'day'),
            isSelected: selected.value ? d.isSame(selected.value, 'day') : false,
            isAvailable
        })
    }

    return arr
})

function select(d: Dayjs) {
    const key = d.format('YYYY-MM-DD')
    if (!availableDaysMap.value.has(key)) return // niedostępny dzień
    selected.value = d.startOf('day')
    emit('update:modelValue', selected.value.format('YYYY-MM-DD'))
    emit('select-day', { date: key, doctors: availableDaysMap.value.get(key) ?? [] })
    open.value = false
}

function selectToday() {
    const t = dayjs().startOf('day')
    const todayCell = days.value.find(x => x.date.isSame(t, 'day'))
    if (!todayCell || !todayCell.isAvailable) return
    currentMonth.value = t.startOf('month')
    select(t)
}

const selectedLabel = computed(() => selected.value ? selected.value.format(format) : '')
</script>

<style scoped>
.day-cell.disabled {
    color: #d1d5db;
    cursor: not-allowed;
    pointer-events: none;
    background: transparent;
}

.day-cell:not(.disabled):hover {
    background: #33a7ca21;
}

.day-cell {
    width: 32px;
    height: 32px;
    border-radius: 999px;
    border: none;
    background: transparent;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 500;
}

.day-cell.selected {
    background: #31a9ce;
    color: #fff;
    border-radius: 999px;
}

.day-cell.selected:hover {
    background: #31a9ce;
    cursor: default;
}

.calendar-input {
    position: relative;
    display: inline-block;
}
@media (max-width: 768px) {
    .day-cell {
    width: 40px;
    height: 40px;
    border-radius: 999px;
    border: none;
    background: transparent;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 500;
}
.calendar-popover {
    left: 0px;
    margin-top: 8px;
    width: 80%;
    background: #ffffff;
    border-radius: 10px;
    border: 1px solid #e6e9ef;
    margin-bottom: 24px;
    /* box-shadow: 0 8px 24px rgba(16, 24, 40, 0.12); */
    padding: 15px;
    z-index: 9999;
}
}
@media (min-width: 768px) {
.calendar-popover {
    position: absolute;
    left: 0px;
    margin-top: 8px;
    width: 330px;
    background: #ffffff;
    border-radius: 10px;
    border: 1px solid #e6e9ef;
    box-shadow: 0 8px 24px rgba(16, 24, 40, 0.12);
    padding: 15px;
    z-index: 9999;
}
}
.calendar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
}

.month-label {
    font-weight: 700;
    text-transform: capitalize;
}

.nav-btn {
    background: none;
    border: none;
    font-size: 18px;
    width: 34px;
    height: 34px;
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
    font-size: 15px;
    color: #6b7280;
    margin-bottom: 6px;
}

.weekday-cell {
    padding: 4px 0;
}

.days-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
}

.calendar-footer {
    display: flex;
    margin: 14px 3px 12px 5px;
}



.base-input {
    cursor: pointer;
    width: 100%;
    border-radius: 10px;
    border: 2px solid #dedede;
    height: 48px;
    /* padding: 12px 16px 12px 16px; */
    transition: 0.25s all;
    outline: none;
    resize: none;
}

.base-input-focus {
    width: 100%;
    border-radius: 10px;
    height: 48px;
    /* padding: 12px 16px 12px 16px; */
    transition: 0.25s all;
    outline: none;
    resize: none;
    border: 2px solid #31a9ce;
}

.input-calendar-icon {
    margin: 8px 8px 0px 12px;
    color: rgba(181, 181, 181, 0.721);
    transition: all 0.2s;
}

.input-calendar-icon-focus {
    margin: 8px 8px 0px 12px;
    color: #31a9ce;
    transition: all 0.2s;
}

.placeholder-calendar {
    color: #cacaca;
    font-size: 15px;
}
</style>
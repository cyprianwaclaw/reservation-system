<template>
    <div class="calendar-input" ref="root">
        <div class="calendar-trigger" role="button" tabindex="0" @click="toggle" @keydown.enter.prevent="toggle"
            @keydown.space.prevent="toggle" :aria-expanded="open.toString()" aria-haspopup="dialog">
            <Icon name="ph:calendar-blank-bold" size="25" class="primary-color" />
            <span class="value text-black-own" v-if="selectedLabel">{{ selectedLabel }}</span>
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
                <button v-for="day in days" :key="day.key" class="day-cell" :class="{
                    'other-month': !day.inMonth,
                    today: day.isToday,
                    selected: day.isSelected,
                    disabled: day.isDisabled
                }" @click="select(day.date)" :aria-pressed="day.isSelected ? 'true' : 'false'">
                    {{ day.date.date() }}
                </button>
            </div>
            <div class="calendar-footer">
                <button class="primary-button-ghost " @click="selectToday">Dziś</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/pl';
dayjs.locale('pl');

const props = defineProps<{
    modelValue?: string | null;
    format?: string;
    disabledDates?: string[];
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', v: string | null): void;
}>();

const format = props.format ?? 'DD.MM.YYYY';

// święta przykładowe
const disabledDatesSet = computed(() => new Set(props.disabledDates ?? [
    '2025-01-01', // Nowy Rok
    '2025-05-01', // Święto Pracy
    '2025-05-03', // Konstytucja 3 maja
    '2025-12-25', // Boże Narodzenie
    '2025-12-26', // Drugi dzień BN
]));

const open = ref(false) as any
const root = ref(null) as any

const selected = ref<Dayjs | null>(props.modelValue ? dayjs(props.modelValue) : null);
const currentMonth = ref<Dayjs>(selected.value ? selected.value.startOf('month') : dayjs().startOf('month'));

const weekdays = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'];

watch(
    () => props.modelValue,
    (val) => {
        selected.value = val ? dayjs(val) : null;
        if (selected.value) currentMonth.value = selected.value.startOf('month');
    }
);

function toggle() { open.value = !open.value; }

function handleOutside(e: MouseEvent) {
    if (!root.value) return;
    if (!(e.target instanceof Node)) return;
    if (!root.value.contains(e.target)) open.value = false;
}

onMounted(() => document.addEventListener('click', handleOutside));
onBeforeUnmount(() => document.removeEventListener('click', handleOutside));

function prevMonth() { currentMonth.value = currentMonth.value.subtract(1, 'month'); }
function nextMonth() { currentMonth.value = currentMonth.value.add(1, 'month'); }

const days = computed(() => {
    const startOfMonth = currentMonth.value.startOf('month');
    const startWeekday = startOfMonth.day();
    const daysToSubtract = (startWeekday + 6) % 7;
    const gridStart = startOfMonth.subtract(daysToSubtract, 'day');

    const arr: {
        key: string;
        date: Dayjs;
        inMonth: boolean;
        isToday: boolean;
        isSelected: boolean;
        isDisabled: boolean; // ⛔
    }[] = [];

    for (let i = 0; i < 42; i++) {
        const d = gridStart.add(i, 'day');

        const isWeekend = d.day() === 0 || d.day() === 6; // niedziela=0, sobota=6
        const isHoliday = disabledDatesSet.value.has(d.format('YYYY-MM-DD'));

        arr.push({
            key: d.format('YYYY-MM-DD'),
            date: d,
            inMonth: d.month() === currentMonth.value.month(),
            isToday: d.isSame(dayjs(), 'day'),
            isSelected: selected.value ? d.isSame(selected.value, 'day') : false,
            isDisabled: isWeekend || isHoliday, // ⛔
        });
    }
    return arr;
});

function select(d: Dayjs) {
    const day = days.value.find(x => x.date.isSame(d, 'day'));
    if (!day || day.isDisabled) return; // ⛔ blokada
    selected.value = d.startOf('day');
    emit('update:modelValue', selected.value.format('YYYY-MM-DD'));
    open.value = false;
}

function selectToday() {
    const t = dayjs().startOf('day');
    if (days.value.find(x => x.date.isSame(t, 'day') && x.isDisabled)) return; // ⛔ jeśli dziś święto/weekend
    currentMonth.value = t.startOf('month');
    select(t);
}

const selectedLabel = computed(() => (selected.value ? selected.value.format(format) : ''));
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

.calendar-input {
    position: relative;
    display: inline-block;
}

.calendar-trigger {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 120px;
    padding: 10px 15px;
    border-radius: 999px;
    border: 1px solid #31a9ce9f;
    cursor: pointer;
    transition: all 0.3s;
}

.calendar-trigger:hover {
    background: #29afd81d;
}

.calendar-trigger:focus {
    outline: none;
}

.value {
    width: 87px;
    font-weight: 500;
}

.calendar-popover {
    position: absolute;
    left: -176px;
    margin-top: 8px;
    width: 330px;
    background: #ffffff;
    border-radius: 10px;
    border: 1px solid #e6e9ef;
    box-shadow: 0 8px 24px rgba(16, 24, 40, 0.12);
    padding: 12px;
    z-index: 9999;
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
    font-size: 0.85rem;
    color: #6b7280;
    margin-bottom: 6px;
}

.weekday-cell {
    padding: 4px 0;
}

.days-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 6px;
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
    opacity: 0.9;
}

.day-cell.today {
    box-shadow: inset 0 0 0 1px #31a9ce;
    border-radius: 999px;
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

.calendar-footer {
    display: flex;
    margin: 14px 3px 12px 5px;
}
</style>
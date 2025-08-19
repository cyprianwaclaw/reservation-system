<template>
    <div>
        <ModalVists :modalActive="showModal" :vistId="vistId" @close="handleModalClose" />
    </div>

    <div class="main-window mt-[100px]">
        <div class="controls">
            <input type="date" v-model="selectedDate" @change="onDateChange" />
            <button @click="goToday">Dziś</button>
            <div><strong>Zakres: {{ weekRange }}</strong></div>
        </div>

        <div ref="scheduleScrollEl" class="schedule-scroll">
            <div class="schedule-inner"
                :style="{ minWidth: weekDays.length * doctors.length * columnWidth + timeColWidth + 'px' }">
                <!-- Nagłówki dni -->
                <div class="header-row">
                    <div class="time-col-test"></div>
                    <div v-for="(day, di) in weekDays" :key="day.date" class="day-col" :ref="el => dayColumns[di] = el"
                        :class="{ 'alt-bg': di % 2 === 1, bold: day.date === todayDate }"
                        :style="{ width: doctors.length * columnWidth + 'px' }">
                        {{ day.label }}
                    </div>
                </div>

                <!-- Lekarze -->
                <div class="subheader-row">
                    <div class="time-col-test"></div>
                    <template v-for="(day, di) in weekDays" :key="day.date + '-doctors'">
                        <div v-for="doctor in doctors" :key="day.date + '-doctor-' + doctor.id" class="doctor-col"
                            :class="{ 'alt-bg': di % 2 === 1, bold: day.date === todayDate }"
                            :style="{ width: columnWidth + 'px' }">
                            {{ doctor.name }}
                        </div>
                    </template>
                </div>

                <!-- Sloty godzin -->
                <div class="body">
                    <div v-for="(hour) in hours" :key="hour" class="hour-row">
                        <div class="time-cell">{{ hour }}</div>
                        <template v-for="(day, di) in weekDays" :key="day.date + '-slots-' + hour">
                            <div v-for="doctor in doctors" :key="day.date + '-slot-' + doctor.id + '-' + hour"
                                class="slot-cell" :class="{ 'alt-bg': di % 2 === 1 }"
                                :style="{ width: columnWidth + 'px' }"></div>
                        </template>
                    </div>
                </div>

                <!-- Eventy -->
                <div class="events-layer" :style="{
                    width: weekDays.length * doctors.length * columnWidth + 'px',
                    left: timeColWidth + 'px',
                    height: hours.length * rowHeight + 'px',
                }">
                    <div v-for="e in eventsForWeek" :key="e.id + '-' + e.type" class="event" :class="e.type"
                        :style="getEventPosition(e)" :title="eLabel(e)" @click="onEventClick(e)">
                        {{ eLabel(e) }}
                    </div>
                </div>

                <!-- Linia aktualnego czasu -->
                <div v-if="currentTimeLinePosition >= 0" class="current-time-overlay">
                    <template v-for="(day, di) in weekDays" :key="'line-' + day.date">
                        <template v-for="(doctor, doctorIndex) in doctors" :key="'line-' + day.date + '-' + doctor.id">
                            <div class="current-time-line" :style="{
                                position: 'absolute',
                                top: currentTimeLinePosition + 'px',
                                left: ((di * doctors.length + doctorIndex) * columnWidth) + 'px',
                                width: columnWidth + 'px',
                                height: '2px'
                            }"></div>
                        </template>
                    </template>

                    <!-- Box z godziną tylko nad dzisiejszym dniem i pierwszym lekarzem -->
                    <div class="current-time-box" :style="{
                        top: currentTimeLinePosition + 'px',
                        left: (weekDays.findIndex(d => d.date === todayDate) * doctors.length * columnWidth) + 'px',
                        width: columnWidth + 'px',
                        position: 'absolute'
                    }">
                        {{ currentTime }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import dayjs, { Dayjs } from 'dayjs';
import isBetweenPlugin from 'dayjs/plugin/isBetween';
import 'dayjs/locale/pl';
dayjs.locale('pl');
dayjs.extend(isBetweenPlugin);

const axiosInstance = useNuxtApp().$axiosInstance as any;

const rowHeight = 50;
const startHour = 7;
const endHour = 22;
const columnWidth = 100;
const timeColWidth = 60;

const currentWeekCookie = useCookie('currentWeekStart');

const doctors = [
    { id: 1, name: 'Dr. A' },
    { id: 2, name: 'Dr. B' },
    { id: 3, name: 'Dr. C' },
    { id: 4, name: 'Dr. D' },
];

const today = dayjs();
const todayDate = today.format('YYYY-MM-DD');
const weekStart = ref<Dayjs>(today);

const selectedDate = ref(todayDate);

const hours = Array.from({ length: endHour - startHour }, (_, i) =>
    `${String(i + startHour).padStart(2, '0')}:00`
);

const weekDays = computed(() => {
    const dOW = weekStart.value.day();
    const toMonday = (dOW + 6) % 7;
    const mondayThisWeek = weekStart.value.subtract(toMonday, 'day').startOf('day');
    return Array.from({ length: 15 }).map((_, i) => {
        const d = mondayThisWeek.add(i - 5, 'day');
        return { date: d.format('YYYY-MM-DD'), label: d.format('dddd (DD.MM)').replace(/^./, s => s.toUpperCase()) };
    });
});

const weekRange = computed(() => {
    const start = weekDays.value[0].date;
    const end = weekDays.value[weekDays.value.length - 1].date;
    return `${dayjs(start).format('DD.MM.YYYY')} - ${dayjs(end).format('DD.MM.YYYY')}`;
});

interface Event { id: number; type: 'visit' | 'vacation'; date: string; start_time: string; end_time: string; label: string; doctor_id: number; }
const visits = ref<Event[]>([]);
const vacations = ref<Event[]>([]);

async function fetchData() {
    visits.value = []; vacations.value = [];
    // tu pobierasz dane
}

const showModal = ref(false);
const vistId = ref();
function onEventClick(e: Event) { showModal.value = true; vistId.value = e.id; }
const handleModalClose = (payload: any) => { showModal.value = false; if (payload?.reload) fetchData(); }

function goToday() {
    const now = dayjs();
    weekStart.value = now.startOf('day'); selectedDate.value = now.format('YYYY-MM-DD');
    nextTick(() => scrollDayToCenter(selectedDate.value));
}

// --- scroll do dnia i detekcja dnia w centrum ---
const scheduleScrollEl = ref<HTMLElement | null>(null);
const dayColumns = ref<HTMLElement[]>([]);

function scrollDayToCenter(day: string) {
    const wrapper = scheduleScrollEl.value; const columns = dayColumns.value;
    if (!wrapper || !columns.length) return;
    const targetIndex = weekDays.value.findIndex(d => d.date === day);
    if (targetIndex === -1) return;
    const targetEl = columns[targetIndex];
    const scrollLeft = targetEl.offsetLeft - wrapper.clientWidth / 2 + targetEl.clientWidth / 2;
    wrapper.scrollTo({ left: scrollLeft, behavior: 'smooth' });
}

function getDayInCenter(): string | null {
    const wrapper = scheduleScrollEl.value; const columns = dayColumns.value;
    if (!wrapper || !columns.length) return null;
    const wrapperCenter = wrapper.scrollLeft + wrapper.clientWidth / 2;
    let closestDay: string | null = null, minDiff = Infinity;
    columns.forEach((col, i) => {
        const colCenter = col.offsetLeft + col.clientWidth / 2;
        const diff = Math.abs(wrapperCenter - colCenter);
        if (diff < minDiff) { minDiff = diff; closestDay = weekDays.value[i].date; }
    })
    return closestDay;
}

function onDateChange() { scrollDayToCenter(selectedDate.value); }

// --- linia aktualnego czasu ---
const currentTime = ref(dayjs().format('HH:mm'));
const currentTimeLinePosition = ref(-1);
function updateCurrentTime() {
    const now = dayjs(); currentTime.value = now.format('HH:mm');
    if (now.hour() < startHour || now.hour() > endHour) { currentTimeLinePosition.value = -1; return; }
    const minsSinceStart = (now.hour() - startHour) * 60 + now.minute();
    currentTimeLinePosition.value = (minsSinceStart / 60) * rowHeight + getHeaderHeight() + getSubHeaderHeight();
}

// --- boczny scroll przy przewijaniu myszką ---
function onWheelScroll(e: WheelEvent) {
    if (!scheduleScrollEl.value) return;
    const target = e.target as HTMLElement;
    if (target.closest('.time-cell') || target.closest('.time-col-test')) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { e.preventDefault(); scheduleScrollEl.value.scrollLeft += e.deltaY; }
}

function getHeaderHeight() { return 30; }
function getSubHeaderHeight() { return 30; }

onMounted(() => {
    scheduleScrollEl.value = document.querySelector('.schedule-scroll') as HTMLElement;
    nextTick(() => scrollDayToCenter(selectedDate.value));
    scheduleScrollEl.value?.addEventListener('wheel', onWheelScroll, { passive: false });
    updateCurrentTime(); const interval = setInterval(updateCurrentTime, 1000);
    onBeforeUnmount(() => { clearInterval(interval); scheduleScrollEl.value?.removeEventListener('wheel', onWheelScroll); });
});
</script>

<style scoped>
.main-window {
    width: 100vw;
    max-height: 80vh;
    overflow-y: auto;
    position: relative;
    background: #fafafa
}

.controls {
    margin-bottom: 1rem;
    display: flex;
    gap: 1rem;
    align-items: center
}

.schedule-scroll {
    width: 100vw;
    overflow-x: auto;
    overflow-y: hidden;
    background: #fafafa;
    min-height: 400px
}

.schedule-inner {
    position: relative;
    background: #fff;
    user-select: none;
    border: 1px solid #ddd;
    display: flex;
    flex-direction: column
}

.header-row,
.subheader-row {
    display: flex;
    width: 100%
}

.header-row {
    height: 30px;
    background-color: #f0f0f0;
    font-weight: bold;
    align-items: center;
    border-bottom: 1px solid #ddd
}

.time-col-test,
.time-cell {
    position: sticky;
    left: 0;
    background: #fafafa;
    z-index: 30
}

.time-col-test {
    width: 60px;
    border-right: 1px solid #ccc
}

.day-col {
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    user-select: none;
    height: 30px;
    background: #fff;
    border-left: 1px solid #ccc
}

.day-col.alt-bg {
    background: #f5f5f5
}

.doctor-col {
    width: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    user-select: none;
    height: 30px;
    background: #fff;
    border-left: 1px solid #ccc
}

.doctor-col.alt-bg {
    background: #f5f5f5
}

.body {
    display: flex;
    flex-direction: column;
    width: 100%
}

.hour-row {
    display: flex;
    height: 50px;
    border-top: 1px solid #eee;
    width: 100%;
    box-sizing: border-box
}

.time-cell {
    width: 60px;
    border-right: 1px solid #ccc;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 50px;
    box-sizing: border-box
}

.slot-cell {
    width: 100px;
    border-left: 1px solid #eee;
    border-bottom: 1px solid #eee;
    position: relative;
    height: 50px;
    background: #fff
}

.slot-cell.alt-bg {
    background: #f7f7f7
}

.events-layer {
    position: absolute;
    top: 0;
    left: 60px;
    pointer-events: none;
    user-select: none;
    z-index: 10
}

.event {
    position: absolute;
    color: white;
    font-size: 0.8rem;
    margin-top: 2px;
    white-space: nowrap;
    text-overflow: ellipsis;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    overflow: hidden;
    padding: 0 4px;
    pointer-events: auto
}

.event.visit {
    background-color: #4caf50;
    border-radius: 6px !important
}

.event.vacation {
    border-radius: 0px !important;
    background-color: #ccc;
    user-select: none !important;
    cursor: default !important
}

.event.visit:hover {
    filter: brightness(1.1)
}

.current-time-overlay {
    position: absolute;
    pointer-events: none;
    z-index: 20
}

.current-time-line {
    position: absolute;
    height: 2px;
    background: red
}

.current-time-box {
    position: absolute;
    background: red;
    color: white;
    padding: 2px 6px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: bold;
    user-select: none;
    pointer-events: none
}</style>
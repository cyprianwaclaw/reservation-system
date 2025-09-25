<template>
    <div class="api-header flex items-center gap-4">
        <h1 class="font-semibold md:text-[32px] text-[25px]">Grafik</h1>
        <input type="date" v-model="centerDate" @change="updateWeekDays" class="border p-1 rounded" />
        <div class="md:flex hidden place-items-center gap-2 ml-auto">
            <div class="arrow-icon" @click="scrollLeftBtn">
                <Icon name="ph:caret-left-bold" size="28" />
            </div>
            <div class="arrow-icon" @click="scrollRightBtn">
                <Icon name="ph:caret-right-bold" size="28" />
            </div>
        </div>
        <p>Wyświetlana w centrum {{ centerDate }}</p>
    </div>

    <div class="main-window">
        <div class="schedule-scroll" ref="scrollContainer" @scroll="onScroll">
            <div class="track" :style="{ width: totalWidthPx + 'px', position: 'relative' }">
                <!-- Nagłówek: dni -->
                <div class="header-row" :style="{ display: 'flex', transform: `translateX(${translateXPx}px)` }">
                    <div class="time-col-start" :style="{ width: timeColWidth + 'px' }"></div>
                    <div class="offset-col" :style="{ width: leftOffset + 'px' }"></div>
                    <div v-for="(day, di) in visibleDays" :key="'hdr-' + day.date" class="day-col"
                        :class="{ 'alt-bg': ((startRenderIndex + di) % 2) === 1, 'today-class': day.date === todayDate }"
                        :style="{ width: dayWidth + 'px' }">
                        <p>
                            {{ day.labelMain }}
                            <span class="text-gray-200">({{ day.labelDate }})</span>
                        </p>
                    </div>
                </div>

                <!-- Subheader: lekarze -->
                <div class="subheader-row" :style="{ display: 'flex', transform: `translateX(${translateXPx}px)` }">
                    <div class="time-col-test" :style="{ width: timeColWidth + 'px' }"></div>
                    <div class="offset-col" :style="{ width: leftOffset + 'px' }"></div>
                    <template v-for="(day, di) in visibleDays" :key="'sub-' + day.date">
                        <div v-for="doctor in doctorsList" :key="'sub-' + day.date + '-' + doctor.id" class="doctor-col"
                            :class="{ 'alt-bg': ((startRenderIndex + di) % 2) === 1 }"
                            :style="{ width: columnWidth + 'px' }">
                            <p class="doctor-text">{{ doctor.name }}</p>
                        </div>
                    </template>
                </div>

                <!-- Body -->
                <div class="body">
                    <div v-for="hour in hours" :key="'hr-' + hour" class="hour-row" :style="{ display: 'flex' }">
                        <div class="time-cell" :style="{ width: timeColWidth + 'px', height: slotHeight + 'px' }">{{ hour }}
                        </div>
                        <div class="offset-col" :style="{ width: leftOffset + 'px' }"></div>
                        <div class="row-content" :style="{ display: 'flex', transform: `translateX(${translateXPx}px)` }">
                            <template v-for="(day, di) in visibleDays" :key="'slots-' + day.date + '-' + hour">
                                <div v-for="doctor in doctorsList" :key="'slot-' + day.date + '-' + doctor.id + '-' + hour"
                                    class="slot-cell" :class="{ 'alt-bg': ((startRenderIndex + di) % 2) === 1 }"
                                    :style="{ width: columnWidth + 'px', height: slotHeight + 'px' }"></div>
                            </template>
                        </div>
                    </div>
                </div>
            </div> <!-- /track -->
        </div> <!-- /schedule-scroll -->
    </div> <!-- /main-window -->
</template>

<script setup lang="ts">
import dayjs from "dayjs";
import "dayjs/locale/pl";
import { computed, nextTick, onMounted, ref } from "vue";

dayjs.locale("pl");

// 📐 Layout
const columnWidth = 100;
const timeColWidth = 75;
const leftOffset = 200;
const slotHeight = 50;

// ⏩ Scroll step
const stepDaysFixed = 3;

// 🧑‍⚕️ Lekarze
const doctors = ref([
    { id: 1, name: "Michał" },
    { id: 2, name: "Grzegorz" },
    { id: 3, name: "Ola" },
    { id: 4, name: "Asia" },
]);
const doctorsList = computed(() => doctors.value ?? []);
const doctorsCount = computed(() => doctorsList.value.length);
const dayWidth = computed(() => doctorsCount.value * columnWidth);

// 🕒 Godziny
const startHour = 7;
const endHour = 21;
const hours = Array.from({ length: endHour - startHour }, (_, i) =>
    `${String(i + startHour).padStart(2, "0")}:00`
);

// 📅 Dziś
const today = dayjs();
const todayDate = today.format("YYYY-MM-DD");
const selectedDate = ref(todayDate);
const centerDate = ref(todayDate);

// Typ dnia
type DayItem = { date: string; label: string; labelMain: string; labelDate: string };

// ✅ Helpers
const isWeekday = (d: dayjs.Dayjs) => ![0, 6].includes(d.day());

function makeLabels(d: dayjs.Dayjs) {
    const full = d.format("dddd (DD.MM)").replace(/^./, s => s.toUpperCase());
    const [main, rest] = full.split(" (");
    return {
        label: full,
        labelMain: main,
        labelDate: rest?.replace(")", "") ?? d.format("DD.MM"),
    };
}

function buildDaysAround(center: string, before = 10, after = 10): DayItem[] {
    const c = dayjs(center);
    const days: DayItem[] = [];

    // cofanie
    let d = c.clone();
    while (days.length < before) {
        d = d.subtract(1, "day");
        if (isWeekday(d)) days.unshift({ date: d.format("YYYY-MM-DD"), ...makeLabels(d) });
    }

    // środek
    days.push({ date: c.format("YYYY-MM-DD"), ...makeLabels(c) });

    // w przód
    d = c.clone();
    while (days.length < before + after + 1) {
        d = d.add(1, "day");
        if (isWeekday(d)) days.push({ date: d.format("YYYY-MM-DD"), ...makeLabels(d) });
    }

    return days;
}

// 🔄 Virtual scroll
const scrollContainer = ref<HTMLDivElement | null>(null);
const allDays = ref<DayItem[]>(buildDaysAround(selectedDate.value));
const startIndex = ref(0);
const visibleCount = ref(14);
const overscan = 2;

const totalWidthPx = computed(() => leftOffset + allDays.value.length * dayWidth.value);

const visibleDays = computed(() => {
    const start = Math.max(0, startIndex.value - overscan);
    const end = Math.min(allDays.value.length, start + visibleCount.value + overscan * 2);
    return allDays.value.slice(start, end);
});

const startRenderIndex = computed(() => Math.max(0, startIndex.value - overscan));
const translateXPx = computed(() => leftOffset + startRenderIndex.value * dayWidth.value);

function indexFromScroll(scrollLeft: number) {
    const dw = dayWidth.value;
    const x = Math.max(0, scrollLeft - leftOffset);
    return Math.min(Math.floor(x / dw), allDays.value.length - 1);
}

function syncCenterDate(scrollLeft: number) {
    const idx = indexFromScroll(scrollLeft);
    centerDate.value = allDays.value[idx]?.date ?? centerDate.value;
}

// 🟢 Dodawanie dni
function prependDays(count: number) {
    const firstDate = dayjs(allDays.value[0]?.date);
    const newDays: DayItem[] = [];

    let d = firstDate.clone();
    while (newDays.length < count) {
        d = d.subtract(1, "day");
        if (isWeekday(d)) newDays.unshift({ date: d.format("YYYY-MM-DD"), ...makeLabels(d) });
    }

    const sc = scrollContainer.value;
    const beforeLeft = sc?.scrollLeft ?? 0;
    allDays.value = [...newDays, ...allDays.value];

    nextTick(() => {
        if (sc) {
            sc.scrollLeft = beforeLeft + newDays.length * dayWidth.value;
            startIndex.value += newDays.length;
            syncCenterDate(sc.scrollLeft);
        }
    });
}

function appendDays(count: number) {
    const lastDate = dayjs(allDays.value[allDays.value.length - 1]?.date);
    const newDays: DayItem[] = [];

    let d = lastDate.clone();
    while (newDays.length < count) {
        d = d.add(1, "day");
        if (isWeekday(d)) newDays.push({ date: d.format("YYYY-MM-DD"), ...makeLabels(d) });
    }
    allDays.value = [...allDays.value, ...newDays];
}

// 📜 Scroll obsługa
let scrollTimeout: number | null = null;

function onScroll() {
    const sc = scrollContainer.value;
    if (!sc) return;

    // aktualizacja centerDate
    syncCenterDate(sc.scrollLeft);

    // lazy-load
    const idx = indexFromScroll(sc.scrollLeft);
    startIndex.value = idx;
    if (idx <= 3) prependDays(10);
    if (idx + visibleCount.value >= allDays.value.length - 3) appendDays(5);

    // snap po zakończeniu scrolla
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = window.setTimeout(() => {
        const nearestIndex = indexFromScroll(sc.scrollLeft);
        const snapLeft = leftOffset + nearestIndex * dayWidth.value;
        sc.scrollTo({ left: snapLeft, behavior: "smooth" });
    }, 120); // 120ms po zatrzymaniu
}

// 🔀 Scroll ręczny
function scrollByDays(days: number) {
    const sc = scrollContainer.value;
    if (!sc) return;

    const currentIndex = indexFromScroll(sc.scrollLeft); // obecny dzień
    const targetIndex = Math.max(0, currentIndex + days); // nowy dzień
    const targetLeft = leftOffset + targetIndex * dayWidth.value;

    sc.scrollTo({ left: targetLeft, behavior: "smooth" });
}

const scrollLeftBtn = () => scrollByDays(-stepDaysFixed * 3);
const scrollRightBtn = () => scrollByDays(stepDaysFixed);

// 🔧 Update dni po zmianie daty
function updateWeekDays() {
    allDays.value = buildDaysAround(centerDate.value);
    nextTick(() => {
        const sc = scrollContainer.value;
        if (!sc) return;
        const index = allDays.value.findIndex(d => d.date === centerDate.value);
        const dw = dayWidth.value;
        sc.scrollLeft = leftOffset + Math.max(0, index - 1) * dw;
        startIndex.value = Math.max(0, index - 1);
        syncCenterDate(sc.scrollLeft);
    });
}

// 🚀 Inicjalizacja
onMounted(() => {
    nextTick(() => {
        const sc = scrollContainer.value;
        if (!sc) return;

        const vw = sc.clientWidth;
        visibleCount.value = Math.max(6, Math.ceil((vw - leftOffset) / dayWidth.value) + 2);

        const index = allDays.value.findIndex(d => d.date === selectedDate.value);
        sc.scrollLeft = leftOffset + Math.max(0, index - 1) * dayWidth.value;
        startIndex.value = Math.max(0, index - 1);
        syncCenterDate(sc.scrollLeft);
    });
});
</script>
<template>
    <div>
        <ModalVists :modalActive="showModal" :vistId="vistId" @close="handleModalClose" />
    </div>

    <!-- {{ currentWeekCookie }}
    {{ isLoading }} -->
    <div v-if="isLoading">
        ładowanie
    </div>
    <div class="main-window mt-[100px] " :class="isLoading == true ? 'test-window' : ''">
        <input type="date" v-model="displayDate" />
        <!-- {{ displayDate }} -->
        <div class="controls">
            <!-- <button @click="prevWeek">← Poprzedni tydzień</button>
            <button @click="goToday">Dziś</button>
            <button @click="nextWeek">Następny tydzień →</button>
            <div><strong>Tydzień: {{ weekRange }}</strong></div> -->
            <!-- <input type="date" v-model="selectedDate" @change="onDateChange" /> -->
            <!-- <button @click="goToday">Dziś</button> -->
            <div><strong>{{ weekRange }}</strong></div>

            <div v-if="centerDay" class="center-info">
                <strong>Środek ekranu:</strong> {{ centerDay }}
            </div>

        </div>
        <!-- <div class="flex gap-2">
            <button v-for="(day, index) in weekDays1" :key="day.date" @click="scrollDayToCenter(index)"
                class="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300">
                {{ day.date }}
            </button>
        </div> -->
        <button @click="scrollTodayToCenter">Dzisiaj</button>

        <div class="schedule-scroll">
            <div class="schedule-inner" :style="{
                minWidth: weekDays.length * doctors.length * columnWidth + timeColWidth + 'px',
            }">
                <!-- Dni tygodnia -->
                <div class="header-row">
                    <div class="time-col-test"></div>
                    <div v-for="(day, di) in weekDays" :key="day.date" class="day-col"
                        :class="{ 'alt-bg': di % 2 === 1, bold: day.date === todayDate }"
                        :style="{ width: doctors.length * columnWidth + 'px' }">
                        {{ day.label }}
                    </div>
                </div>

                <!-- Lekarze pod dniami -->
                <!-- <div class="subheader-row">
                    <div class="time-col-test"></div> -->
                <div class="subheader-row">
                    <div class="time-col-test"></div>
                    <!-- <div class="doctors-header"> -->
                    <template v-for="(day, di) in weekDays" :key="day.date + '-doctors'">
                        <div v-for="doctor in doctors" :key="day.date + '-doctor-' + doctor.id" class="doctor-col"
                            :class="{ 'alt-bg': di % 2 === 1, bold: day.date === todayDate }"
                            :style="{ width: columnWidth + 'px' }">
                            {{ doctor.name }}
                        </div>
                    </template>
                    <!-- </div> -->
                </div>

                <!-- Wiersze godzin -->
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

                <!-- Linie aktualnego czasu na każdy dzień i lekarza -->
                <div class="current-time-overlay" :style="{ top: currentTimeLinePosition + 'px' }"
                    v-if="currentTimeLinePosition >= 0">
                    <template v-for="(day, di) in weekDays" :key="'line-' + day.date">
                        <template v-for="(doctor, doctorIndex) in doctors" :key="'line-' + day.date + '-' + doctor.id">
                            <div class="current-time-line" :class="{ faded: day.date !== todayDate }" :style="{
                                position: 'absolute',
                                left: ((di * doctors.length + doctorIndex) * columnWidth) + 'px',
                                width: columnWidth + 'px',
                                height: '2px',
                                top: '0px',
                            }"></div>
                        </template>
                    </template>
                </div>

                <!-- Pudełko z godziną aktualnego czasu tylko nad dzisiejszym dniem i pierwszym lekarzem -->
                <div v-if="currentTimeLinePosition >= 0" class="current-time-overlay" :style="{
                    top: currentTimeLinePosition + 'px',
                    left: (weekDays.findIndex((d) => d.date === todayDate) * doctors.length * columnWidth) + 'px',
                    width: columnWidth + 'px',
                    height: '20px',
                    pointerEvents: 'none',
                    position: 'absolute',
                    zIndex: 21,
                }">
                    <div class="current-time-box">{{ currentTime }}</div>
                </div>
            </div>
        </div>
    </div>
</template>


<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import dayjs, { Dayjs } from 'dayjs';
import isBetweenPlugin from 'dayjs/plugin/isBetween';
import 'dayjs/locale/pl';

dayjs.locale('pl');
dayjs.extend(isBetweenPlugin);

const axiosInstance = useNuxtApp().$axiosInstance as any;
const centerDayCookie = useCookie('centerDay'); // np. "2025-08-12"
const rowHeight = 50;
const startHour = 7;
const endHour = 22;
const columnWidth = 100;
const timeColWidth = 60;
const isLoading = ref(true)
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

const hours = Array.from({ length: endHour - startHour }, (_, i) =>
    `${String(i + startHour).padStart(2, '0')}:00`
);

// const selectedDate = ref(today.format("YYYY-MM-DD"));

// function onDateChange() {
//     const chosen = dayjs(selectedDate.value);
//     if (!chosen.isValid()) return;

//     // ustawiamy weekStart tak, żeby bazował na wybranym dniu
//     weekStart.value = chosen.startOf("day");
//     saveWeekStartToCookie();
//     fetchData();
// }

// const weekDays = computed(() => {
//     // startujemy od poniedziałku bieżącego tygodnia
//     const dOW = weekStart.value.day();
//     const toMonday = (dOW + 6) % 7;
//     const mondayThisWeek = weekStart.value.subtract(toMonday, 'day').startOf('day');

//     // Generujemy 15 dni (poprzedni, bieżący, następny tydzień)
//     const allDays = Array.from({ length: 15 }).map((_, i) => {
//         const d = mondayThisWeek.add(i - 5, 'day'); // -5 = cofamy tydzień, +0 = bieżący, +5 = następny
//         return {
//             date: d.format('YYYY-MM-DD'),
//             label: d.format('dddd (DD.MM)').replace(/^./, (s) => s.toUpperCase()),
//         };
//     });

//     // Filtrujemy weekendy (0 = niedziela, 6 = sobota)
//     return allDays.filter(d => {
//         const dayOfWeek = dayjs(d.date).day();
//         return dayOfWeek !== 0 && dayOfWeek !== 6;
//     });
// }) as any
const weekDays = computed(() => {
    // start od poniedziałku
    const dOW = weekStart.value.day();
    const toMonday = (dOW + 6) % 7;
    const mondayThisWeek = weekStart.value.subtract(toMonday, 'day').startOf('day');

    // 👉 zwiększamy zakres np. do 60 dni
    const allDays = Array.from({ length: 60 }).map((_, i) => {
        const d = mondayThisWeek.add(i - 30, 'day'); // -30 = miesiąc wstecz, +30 = miesiąc w przód
        return {
            date: d.format('YYYY-MM-DD'),
            label: d.format('dddd (DD.MM)').replace(/^./, (s) => s.toUpperCase()),
        };
    });

    // Filtr weekendów
    return allDays.filter(d => {
        const dayOfWeek = dayjs(d.date).day();
        return dayOfWeek !== 0 && dayOfWeek !== 6;
    });
}) as any



const weekRange = computed(() => {
    const start = weekDays.value[0].date as any
    const end = weekDays.value[weekDays.value.length - 1].date;
    return `${dayjs(start).format('DD.MM.YYYY')} - ${dayjs(end).format('DD.MM.YYYY')}`;
});

interface Visit {
    visit_id: number;
    doctor_id: number;
    user_name: string;
    user_surname: string;
    date: string;
    start_time: string;
    end_time: string;
}

interface Vacation {
    id: number;
    doctor_id: number;
    start_date: string;
    end_date: string;
    start_time: string;
    end_time: string;
}

type EventType = 'visit' | 'vacation';
interface Event {
    id: number;
    type: EventType;
    date: string;
    start_time: string;
    end_time: string;
    label: string;
    doctor_id: number;
}

const visits = ref<Visit[]>([]);
const vacations = ref<Vacation[]>([]);

async function fetchData() {
    const range = weekRange.value;
    const resVisits = await axiosInstance.get(`/schedule/all-visits?week=${encodeURIComponent(range)}`);
    visits.value = resVisits.data;
    const resVacations = await axiosInstance.get(`/vacations?week=${encodeURIComponent(range)}`);
    vacations.value = resVacations.data;
}

const showModal = ref(false);
const vistId = ref();

function onEventClick(event: Event) {
    if (event.type === 'visit') {
        vistId.value = event.id;
        showModal.value = !showModal.value;
    }
}

const handleModalClose = (payload: any) => {
    showModal.value = false;
    if (payload?.reload) {
        fetchData();
    }
};

function setWeekStartFromCookieOrToday() {
    if (currentWeekCookie.value) {
        const cookieDate = dayjs(currentWeekCookie.value);
        if (cookieDate.isValid()) {
            weekStart.value = cookieDate;
            return;
        }
    }
    const dOW = today.day();
    const toMonday = (dOW + 6) % 7;
    weekStart.value = today.subtract(toMonday, 'day').startOf('day');
}

function saveWeekStartToCookie() {
    currentWeekCookie.value = weekStart.value.format('YYYY-MM-DD');
}

const prevWeek = async () => {
    weekStart.value = weekStart.value.subtract(1, 'week');
    saveWeekStartToCookie();
    await fetchData();
};
const nextWeek = async () => {
    weekStart.value = weekStart.value.add(1, 'week');
    saveWeekStartToCookie();
    await fetchData();
};
function goToday() {
    const now = dayjs();
    const dOW = now.day();
    const toMonday = (dOW + 6) % 7;
    weekStart.value = now.subtract(toMonday, 'day').startOf('day');
    saveWeekStartToCookie();
    fetchData();
}

const eventsForWeek = computed<Event[]>(() => {
    const start = weekStart.value.startOf('day');
    const end = weekStart.value.add(4, 'day').endOf('day');
    const events: Event[] = [];

    visits.value.forEach((v) => {
        const eventDate = dayjs(v.date);
        if (eventDate.isBetween(start, end, 'day', '[]')) {
            events.push({
                id: v.visit_id,
                type: 'visit',
                date: v.date,
                start_time: v.start_time,
                end_time: v.end_time,
                label: `${v.user_name} ${v.user_surname}`,
                doctor_id: v.doctor_id,
            });
        }
    });

    vacations.value.forEach((v) => {
        const startDate = dayjs(v.start_date);
        if (startDate.isBetween(start, end, 'day', '[]')) {
            events.push({
                id: v.id,
                type: 'vacation',
                date: v.start_date,
                start_time: v.start_time,
                end_time: v.end_time,
                label: '',
                doctor_id: v.doctor_id,
            });
        }
    });

    return events;
});

function toMinutes(hms: string) {
    const [h, m, s] = hms.split(':').map(Number) as any;
    return h * 60 + m + (s > 0 ? 1 : 0);
}

function getEventPosition(e: Event): Record<string, string> {
    const dayIndex = weekDays.value.findIndex((d) => d.date === e.date);
    if (dayIndex === -1) return { display: 'none' };

    const doctorIndex = doctors.findIndex((d) => d.id === e.doctor_id);
    if (doctorIndex === -1) return { display: 'none' };

    const startMins = toMinutes(e.start_time) - startHour * 60;
    const endMins = toMinutes(e.end_time) - startHour * 60;
    if (startMins < 0 || endMins > (endHour - startHour) * 60) return { display: 'none' };

    const topPx = Math.round((startMins / 60) * rowHeight);
    const heightPx = Math.round(((endMins - startMins) / 60) * rowHeight);

    return {
        position: 'absolute',
        top: `${getHeaderHeight() + getSubHeaderHeight() + topPx}px`,
        left: `${(dayIndex * doctors.length + doctorIndex) * columnWidth}px`,
        height: `${heightPx}px`,
        width: `${columnWidth}px`,
        borderRadius: '4px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        textAlign: 'center',
        color: 'white',
        cursor: 'pointer',
    };
}

function eLabel(e: Event): string {
    if (e.type === 'visit') return e.label;
    if (e.type === 'vacation') return '';
    return '';
}

const currentTime = ref(dayjs().format('HH:mm'));
const currentTimeLinePosition = ref(-1);

function updateCurrentTime() {
    const now = dayjs();
    currentTime.value = now.format('HH:mm');
    if (now.hour() < startHour || now.hour() > endHour) {
        currentTimeLinePosition.value = -1;
        return;
    }
    const minsSinceStart = (now.hour() - startHour) * 60 + now.minute();
    currentTimeLinePosition.value = getHeaderHeight() + getSubHeaderHeight() + (minsSinceStart / 60) * rowHeight;
}

function getHeaderHeight(): number {
    return 30;
}
function getSubHeaderHeight(): number {
    return 30;
}


// --- Nowa funkcja: scroll w dół => przesuwanie w lewo ---
const scheduleScrollEl = ref<HTMLElement | null>(null);

function onWheelScroll(e: WheelEvent) {
    if (!scheduleScrollEl.value) return;
    const target = e.target as HTMLElement;

    // jeśli lewa kolumna (godziny) → pozwól na pionowy scroll
    if (target.closest('.time-cell') || target.closest('.time-col-test')) {
        return;
    }

    // dla reszty kalendarza → zamień Y na X
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault(); // działa tylko jeśli passive: false
        scheduleScrollEl.value.scrollLeft += e.deltaY;
    }
}
let interval: any = null;

const centerDay = ref(null) as any

// function updateCenterDay() {
//     if (!scheduleScrollEl.value) return;
//     const scrollCenter = scheduleScrollEl.value.scrollLeft + scheduleScrollEl.value.clientWidth / 2;

//     const dayWidth = doctors.length * columnWidth;
//     const dayIndex = Math.floor((scrollCenter - timeColWidth) / dayWidth);

//     if (dayIndex >= 0 && dayIndex < weekDays.value.length) {
//         centerDay.value = weekDays.value[dayIndex];
//     } else {
//         centerDay.value = null;
//     }
// }

function updateCenterDay() {
    if (!scheduleScrollEl.value) return;
    const scrollCenter = scheduleScrollEl.value.scrollLeft + scheduleScrollEl.value.clientWidth / 2;
    const dayWidth = doctors.length * columnWidth;
    const dayIndex = Math.floor((scrollCenter - timeColWidth) / dayWidth);

    if (dayIndex >= 0 && dayIndex < weekDays.value.length) {
        centerDay.value = weekDays.value[dayIndex];

        // zapis do ciasteczka
        centerDayCookie.value = centerDay.value.date;
    } else {
        centerDay.value = null;
    }

    // aktualizacja inputa tylko jeśli użytkownik nie wybrał ręcznie daty
    if (!userSelectedDate.value && centerDay.value) {
        selectedDate.value = centerDay.value.date;
    }
}

function scrollToDate(date: string) {
    if (!scheduleScrollEl.value) return;

    // znajdź indeks dnia w weekDays
    const dayIndex = weekDays.value.findIndex(d => d.date === date);
    if (dayIndex === -1) return; // jeśli nie ma tej daty w zakresie, kończymy

    const dayWidth = doctors.length * columnWidth;

    // początek dnia w scrollu
    const dayStart = timeColWidth + dayIndex * dayWidth;

    // środek dnia
    const dayCenter = dayStart + dayWidth / 2;

    // środek widoku
    const viewportCenter = scheduleScrollEl.value.clientWidth / 2;

    const targetScroll = dayCenter - viewportCenter;

    scheduleScrollEl.value.scrollTo({
        left: targetScroll,
        behavior: "smooth",
    });

    // ustawiamy centerDay na wybraną datę
    centerDay.value = weekDays.value[dayIndex];
    selectedDate.value = weekDays.value[dayIndex].date;
}


onMounted(async () => {
    // setTimeout(() => {
    isLoading.value = true;
    //     }, 150)
    // 1️⃣ Najpierw inicjalizacja danych z cookies lub domyślnie
    setWeekStartFromCookieOrToday();

    // 2️⃣ Pobierz dane dla tego tygodnia (nie nadpisuj cookies tutaj)
    await fetchData();

    scheduleScrollEl.value = document.querySelector('.schedule-scroll') as HTMLElement;

    // 3️⃣ Inicjalizacja scrolla na podstawie zapisanej daty środka lub today
    const initialDate = centerDayCookie.value || todayDate;
    const dayIndex = weekDays.value.findIndex(d => d.date === initialDate);

    if (scheduleScrollEl.value && dayIndex >= 0) {
        setTimeout(() => {
            scrollDayToCenterNotSmmoth(dayIndex);
        }, 50);
    } else {
        // Jeżeli dzień nie jest w zakresie, ustaw na today
        if (scheduleScrollEl.value) {
            const todayIndex = weekDays.value.findIndex(d => d.date === todayDate);
            if (todayIndex >= 0) {
                setTimeout(() => {
                    scrollDayToCenterNotSmmoth(todayIndex);
                }, 50);
            }
        }
    }

    // 4️⃣ Dopiero teraz ustaw obserwatory i event listeners, itp.
    scheduleScrollEl.value?.addEventListener('wheel', onWheelScroll, { passive: false });
    scheduleScrollEl.value?.addEventListener("scroll", updateCenterDay);

    updateCurrentTime();
    interval = setInterval(updateCurrentTime, 100);

    setTimeout(() => {
        isLoading.value = false;
    }, 150)

});

// onMounted(async () => {
//     // isLoading.value = true;
//     setTimeout(() => {
//         isLoading.value = false;
//     }, 150)
//     setWeekStartFromCookieOrToday();
//     saveWeekStartToCookie();

//     await fetchData();
//     scheduleScrollEl.value = document.querySelector('.schedule-scroll') as HTMLElement;

//     // 1️⃣ Wczytaj datę z ciasteczka, jeśli istnieje
//     const initialDate = centerDayCookie.value || todayDate;

//     // 2️⃣ Scroll do tej daty
//     const dayIndex = weekDays.value.findIndex(d => d.date === initialDate);
//     if (scheduleScrollEl.value && dayIndex >= 0) {
//         setTimeout(() => {
//             scrollDayToCenterNotSmmoth(dayIndex);
//         }, 50);
//     }

//     // eventy scrolla i wheel
//     scheduleScrollEl.value?.addEventListener('wheel', onWheelScroll, { passive: false });
//     scheduleScrollEl.value?.addEventListener("scroll", updateCenterDay);

//     updateCurrentTime();
//     interval = setInterval(updateCurrentTime, 100);

//     onBeforeUnmount(() => {
//         clearInterval(interval);
//         scheduleScrollEl.value?.removeEventListener('wheel', onWheelScroll);
//         scheduleScrollEl.value?.removeEventListener('scroll', updateCenterDay);
//     });
//     // isLoading.value = false;
// });

onBeforeUnmount(() => {
    if (interval) clearInterval(interval);
    scheduleScrollEl.value?.removeEventListener('wheel', onWheelScroll);
    scheduleScrollEl.value?.removeEventListener('scroll', updateCenterDay);
});

function scrollDayToCenter(dayIndex: number) {
    if (!scheduleScrollEl.value) return;

    const dayWidth = doctors.length * columnWidth;

    // faktyczny początek dnia w układzie scrolla
    const dayStart = timeColWidth + dayIndex * dayWidth;

    // środek dnia
    const dayCenter = dayStart + dayWidth / 2;

    // środek widoku
    const viewportCenter = scheduleScrollEl.value.clientWidth / 2;

    const targetScroll = dayCenter - viewportCenter;

    scheduleScrollEl.value.scrollTo({
        left: targetScroll,
        behavior: "smooth",
    });
}

function scrollDayToCenterNotSmmoth(dayIndex: number) {
    if (!scheduleScrollEl.value) return;

    const dayWidth = doctors.length * columnWidth;

    // faktyczny początek dnia w układzie scrolla
    const dayStart = timeColWidth + dayIndex * dayWidth;

    // środek dnia
    const dayCenter = dayStart + dayWidth / 2;

    // środek widoku
    const viewportCenter = scheduleScrollEl.value.clientWidth / 2;

    const targetScroll = dayCenter - viewportCenter;

    scheduleScrollEl.value.scrollTo({
        left: targetScroll,
        // behavior: "smooth",
    });
}

function scrollTodayToCenter() {
    const todayIndex = weekDays.value.findIndex(d => d.date === todayDate);

    if (todayIndex >= 0) {
        // normalny smooth scroll jeśli dziś jest w zakresie
        scrollDayToCenter(todayIndex);
    } else {
        // 👉 jeśli "dziś" jest poza zakresem → reset widoku
        weekStart.value = today.startOf("day");
        saveWeekStartToCookie();
        fetchData().then(() => {
            const newIndex = weekDays.value.findIndex(d => d.date === todayDate);
            if (newIndex >= 0) {
                setTimeout(() => scrollDayToCenter(newIndex), 50);
            }
        });
    }
}

// function scrollTodayToCenter() {
//     const todayIndex = weekDays.value.findIndex(d => d.date === todayDate);
//     if (todayIndex >= 0) {
//         scrollDayToCenter(todayIndex);
//     }
// }

// const weekDays1 = ref([
//     { date: '2025-08-18' },
//     { date: '2025-08-19' },
//     { date: '2025-08-20' },
//     // itd.
// ]);


// function onDateChange() {
//     const chosen = dayjs(selectedDate.value);
//     if (!chosen.isValid()) return;

//     // ustawiamy weekStart tak, żeby bazował na wybranym dniu
//     weekStart.value = chosen.startOf("day");
//     saveWeekStartToCookie();
//     fetchData();

//     // 👇 przewijanie do wybranej daty
//     const dayIndex = weekDays.value.findIndex(d => d.date === chosen.format("YYYY-MM-DD"));
//     if (dayIndex >= 0) {
//         // mały timeout żeby Vue zdążyło odświeżyć DOM po zmianie tygodnia
//         setTimeout(() => {
//             scrollDayToCenter(dayIndex);
//         }, 50);
//     }
// }

// function onDateChange() {
//     const chosen = dayjs(selectedDate.value);
//     if (!chosen.isValid()) return;

//     // ustawiamy weekStart na wybrany dzień
//     weekStart.value = chosen.startOf("day");
//     saveWeekStartToCookie();
//     fetchData().then(() => {
//         const dayIndex = weekDays.value.findIndex(d => d.date === chosen.format("YYYY-MM-DD"));
//         if (dayIndex >= 0) {
//             setTimeout(() => scrollDayToCenter(dayIndex), 50);
//         } else {
//             // 👇 jeśli data spoza zakresu → scrollujemy do "dziś"
//             scrollTodayToCenter();
//         }
//     });
// }

const selectedDate = ref(today.format("YYYY-MM-DD"));
const userSelectedDate = ref<string | null>(null); // jeśli użytkownik wybierze datę ręcznie

// computed dla inputa
const displayDate = computed({
    get() {
        return userSelectedDate.value || (centerDay.value ? centerDay.value.date : todayDate);
    },
    set(val: string) {
        userSelectedDate.value = val;  // jeśli użytkownik zmienia input
        selectedDate.value = val;
        onDateChange();
    }
});

// w onDateChange po wyborze daty ręcznej resetujemy userSelectedDate
function onDateChange() {
    const chosen = dayjs(selectedDate.value);
    if (!chosen.isValid()) return;

    weekStart.value = chosen.startOf("day");
    saveWeekStartToCookie();
    fetchData().then(() => {
        const dayIndex = weekDays.value.findIndex(d => d.date === chosen.format("YYYY-MM-DD"));
        if (dayIndex >= 0) {
            setTimeout(() => scrollDayToCenter(dayIndex), 50);
        } else {
            scrollTodayToCenter();
        }
    });

    userSelectedDate.value = selectedDate.value; // oznaczamy że użytkownik wybrał datę
}

// obserwacja scrolla – aktualizujemy input tylko jeśli użytkownik nie wybrał ręcznie
watch(centerDay, (val) => {
    if (!userSelectedDate.value && val) {
        selectedDate.value = val.date;
    }
})

</script>


<style scoped>
.test-window {
    opacity: 0 !important;
}

.main-window {
    width: 100vw;
    max-height: 80vh;
    /* przykładowa wysokość */
    overflow-y: auto;
    /* pionowy scroll dla całego kalendarza */
    position: relative;
    background: #fafafa;
}

.controls {
    margin-bottom: 1rem;
    display: flex;
    gap: 1rem;
    align-items: center;
}

.controls button {
    cursor: pointer;
}

.schedule-scroll {
    width: 100vw;
    max-width: 100vw;
    overflow-x: auto !important;
    overflow-y: hidden;
    background: #fafafa;
    min-height: 400px;
}

.schedule-scroll::-webkit-scrollbar {
    height: 14px;
    background: #eee;
}

.schedule-scroll::-webkit-scrollbar-thumb {
    background: #bbb;
    border-radius: 7px;
}

.schedule-scroll {
    scrollbar-width: thin;
    scrollbar-color: #bbb #eee;
}

.schedule-inner {
    width: auto;
    min-width: 860px;
    position: relative;
    background: #fff;
    user-select: none;
    border: 1px solid #ddd;
}

.header-row,
.subheader-row {
    display: flex;
    width: 100%;
}

.header-row {
    height: 30px;
    background-color: #f0f0f0;
    font-weight: bold;
    align-items: center;
    border-bottom: 1px solid #ddd;
}

.subheader-row {
    display: flex;
    position: sticky;
    top: 30px;
    background: #fff;
    z-index: 40;
}

.time-col-test,
.time-cell {
    position: sticky;
    left: 0;
    background: #fafafa;
    /* tło aby nie prześwitywały eventy */
    z-index: 30;
    /* większe niż reszta, aby przykrywało */
}

.time-col-test {
    width: 60px;
    min-width: 60px;
    max-width: 60px;
    box-sizing: border-box;
    border-right: 1px solid #ccc;
}

.day-col {
    width: 400px;
    min-width: 400px;
    max-width: 400px;
    box-sizing: border-box;
    border-left: 1px solid #ccc;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    user-select: none;
    height: 30px;
    background: #fff;
}

.day-col.alt-bg {
    background: #f5f5f5;
}

.doctor-col {
    width: 100px;
    min-width: 100px;
    max-width: 100px;
    box-sizing: border-box;
    border-left: 1px solid #ccc;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    user-select: none;
    height: 30px;
    white-space: nowrap;
    padding: 0 4px;
    background: #fff;
}

.doctor-col.alt-bg {
    background: #f5f5f5;
}

.body {
    display: flex;
    flex-direction: column;
    user-select: none;
    width: 100%;
}

.hour-row {
    display: flex;
    height: 50px;
    border-top: 1px solid #eee;
    width: 100%;
    box-sizing: border-box;
}

.time-cell {
    width: 60px;
    min-width: 60px;
    max-width: 60px;
    border-right: 1px solid #ccc;
    text-align: center;
    background: #fafafa;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 50px;
    box-sizing: border-box;
}

.slot-cell {
    width: 100px;
    min-width: 100px;
    max-width: 100px;
    box-sizing: border-box;
    border-left: 1px solid #eee;
    border-bottom: 1px solid #eee;
    position: relative;
    height: 50px;
    background: #fff;
}

.slot-cell.alt-bg {
    background: #f7f7f7;
}

.events-layer {
    position: absolute;
    top: 0px;
    left: 60px;
    pointer-events: none;
    user-select: none;
    z-index: 10;
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
    transition: background-color 0.3s ease;
    pointer-events: auto;
}

.event.visit {
    background-color: #4caf50;
    border-radius: 6px !important;
}

.event.vacation {
    border-radius: 0px !important;
    background-color: #ccc;
    user-select: none !important;
    cursor: default !important;
}

.event.visit:hover {
    filter: brightness(1.2);
}

.current-time-overlay {
    position: absolute;
    pointer-events: none;
    z-index: 20;
}

.current-time-line {
    position: absolute;
    margin-left: 60px;
    left: 0;
    height: 1px;
    background-color: rgb(255, 0, 0);
    width: 100%;
    opacity: 1;
    transition: opacity 0.3s;
}

.current-time-line.faded {
    opacity: 0.2;
}

.current-time-box {
    position: absolute;
    left: 16px;
    transform: translateY(-50%);
    background-color: red;
    color: white;
    padding: 3px 8px;
    border-radius: 10px;
    font-weight: bold;
    font-size: 0.75rem;
    user-select: none;
    pointer-events: none;
}
</style>
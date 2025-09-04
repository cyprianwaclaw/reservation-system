<template>
    <Modal component="visit" :modalActive="showModal" :data="vistId" @close="handleModalClose" />
    <div v-if="isLoading">
        <LoadingSpinner :isLoading="true" class="-mt-[120px]" />
    </div>
    <div class="flex place-items-center w-full justify-between px-[30px] pb-[24px] mt-[30px]"
        :class="isLoading == true ? 'window-loading' : ''">
        <div v-if="hoverEvent && hoverPosition" class="event-tooltip"
            :class="[tooltipAbove ? 'event-tooltip--top' : '', tooltipLeft ? 'event-tooltip-arrow--left' : '']"
            :style="tooltipStyle">
            <div class="event-tooltip-arrow"
                :class="[tooltipAbove ? 'event-tooltip-arrow--top' : '', tooltipLeft ? 'event-tooltip-arrow--left' : '']">
            </div>
            <div class="flex w-full justify-between">
                <div>
                    <p class="text-white font-semibold">{{ hoverEvent.name }}</p>
                    <p class="text-white text-[13px]  mt-[2px]">{{ hoverEvent.phone }}</p>
                </div>
                <p class="text-white font-semibold">{{ hoverEvent.time }}</p>
            </div>
            <p class="text-white font-semibold text-[13px] mt-[12px]">Notatka</p>
            <p class="text-white">{{ hoverEvent?.fast_note }}</p>
            <p class="text-white font-semibold text-[13px]  mt-[12px]">Ostatnia wizyta</p>
            <p class="text-white">{{ hoverEvent?.notes }}</p>
        </div>
        <h1 class="font-semibold text-[32px] ml-[80px]">Planowane wizyty</h1>
        <InputCalendar v-model="displayDate" />
    </div>
    <div :class="isLoading == true ? 'window-loading' : 'main-window'">
        <div class="schedule-scroll">
            <div class="schedule-inner" :style="{
                minWidth: weekDays.length * doctors.length * columnWidth + timeColWidth + 'px',
            }">
                <div class="header-row">
                    <div class="time-col-start"></div>
                    <div v-for="(day, di) in weekDays" :key="day.date" class="day-col"
                        :class="{ 'alt-bg': di % 2 === 1, 'today-class': day.date === todayDate }"
                        :style="{ width: doctors.length * columnWidth + 'px' }">
                        <p>{{ day.label.split("(")[0] }} <span class="text-gray-400"
                                :class="{ 'today-class': day.date === todayDate }"> ({{
                                    day.label.split("(")[1] }}</span></p>
                    </div>
                </div>
                <div class="subheader-row">
                    <div class="time-col-test"></div>
                    <template v-for="(day, di) in weekDays" :key="day.date + '-doctors'">
                        <div v-for="doctor in doctors" :key="day.date + '-doctor-' + doctor.id" class="doctor-col"
                            :class="{ 'alt-bg': di % 2 === 1, }" :style="{ width: columnWidth + 'px' }">
                            <p class="doctor-text">{{ doctor.name }}</p>
                        </div>
                    </template>
                </div>
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
                <div class="events-layer" :style="{
                    width: weekDays.length * doctors.length * columnWidth + 'px',
                    left: timeColWidth + 'px',
                    height: hours.length * rowHeight + 'px',
                }">
                    <div v-for="e in eventsForWeek" :key="e.id + '-' + e.type" class="event"
                        :class="[e.type, e.isPast ? 'event-past' : 'event-future', 'doctor-' + e.doctor_id]"
                        :style="getEventPosition(e)" :title="eLabel(e)" @click="onEventClick(e)"
                        @mousemove="onEventHover($event, e)" @mouseleave="clearHover">
                        <p :class="'text-' + e.user_type" class="select-none">
                            {{ eLabel(e) }}
                        </p>
                    </div>
                </div>
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
                <div v-if="currentTime < '21' || currentTime > '7'">
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
    </div>
</template>

<script setup lang="ts">
import dayjs, { Dayjs } from 'dayjs';
import isBetweenPlugin from 'dayjs/plugin/isBetween';
import 'dayjs/locale/pl';
const { isModalOpen } = useCloseModal()

dayjs.locale('pl');
dayjs.extend(isBetweenPlugin);

const axiosInstance = useNuxtApp().$axiosInstance as any;
const centerDayCookie = useCookie('centerDay');
const rowHeight = 50;
const startHour = 7;
const endHour = 21;
const columnWidth = 100;
const timeColWidth = 75;
const isLoading = ref(true)
const currentWeekCookie = useCookie('currentWeekStart');
const hoverEvent = ref<any>(null)
const hoverPosition = ref<{ x: number, y: number } | null>(null)
const tooltipAbove = ref(false)
const tooltipLeft = ref(false)

const tooltipStyle = computed(() => {
    if (!hoverPosition.value) return {};
    const tooltipWidth = 260;
    const tooltipHeight = 110;
    const margin = 10;
    let top = hoverPosition.value.y;
    let left = hoverPosition.value.x;
    let zIndex = 100;
    tooltipAbove.value = false;
    tooltipLeft.value = false;
    if (window.innerHeight < top + tooltipHeight + margin) {
        top = hoverPosition.value.y - tooltipHeight - margin;
        tooltipAbove.value = true;
    }
    if (window.innerWidth < left + tooltipWidth + margin) {
        left = hoverPosition.value.x - tooltipWidth - margin;
        tooltipLeft.value = true;
    }
    return { position: 'absolute', left: left + 'px', top: top + 'px', zIndex };
}) as any;


function onEventHover(ev: MouseEvent, event: any) {
    const target = ev.currentTarget as HTMLElement; // currentTarget zamiast target
    const rect = target.getBoundingClientRect();
    const tooltipWidth = 300;
    const tooltipHeight = 220;
    const margin = 10;

    let x = rect.right + margin + window.scrollX;
    let y = rect.top + window.scrollY;

    let showLeft = false;
    let showAbove = false;

    if (window.innerWidth < x + tooltipWidth) {
        x = rect.left - tooltipWidth - margin + window.scrollX;
        showLeft = true;
    }
    if (window.innerHeight < y + tooltipHeight) {
        y = rect.bottom - tooltipHeight - margin + window.scrollY; // używamy rect.bottom
        showAbove = true;
    }

    hoverPosition.value = { x, y };
    tooltipAbove.value = showAbove;
    tooltipLeft.value = showLeft;
    hoverEvent.value = event;
}

function clearHover() {
    hoverEvent.value = null;
    hoverPosition.value = null;
}
watch(isModalOpen, async (newValue: any) => {
    if (newValue === false) {
        showModal.value = false;
        await fetchData()
    }
})


const doctors = [
    { id: 1, name: 'Michał' },
    { id: 2, name: 'Grzegorz' },
    { id: 3, name: 'Ola' },
    { id: 4, name: 'Asia' },
];

const today = dayjs();
const todayDate = today.format('YYYY-MM-DD');
const weekStart = ref<Dayjs>(today);

const hours = Array.from({ length: endHour - startHour }, (_, i) =>
    `${String(i + startHour).padStart(2, '0')}:00`
);

const weekDays = computed<any[]>(() => {
    const dOW = weekStart.value.day();
    const toMonday = (dOW + 6) % 7;
    const mondayThisWeek = weekStart.value.subtract(toMonday, 'day').startOf('day');
    const allDays = Array.from({ length: 60 }).map((_, i) => {
        const d = mondayThisWeek.add(i - 30, 'day') as any
        return {
            date: d.format('YYYY-MM-DD'),
            label: d.format('dddd (DD.MM)').replace(/^./, (s: any) => s.toUpperCase()),
        };
    });
    return allDays.filter(d => {
        const dayOfWeek = dayjs(d.date).day();
        return dayOfWeek !== 0 && dayOfWeek !== 6;
    });
})

const weekRange = computed(() => {
    const start = weekDays.value[0].date as any
    const end = weekDays.value[weekDays.value.length - 1].date;
    return `${dayjs(start).format('DD.MM.YYYY')} - ${dayjs(end).format('DD.MM.YYYY')}`;
})

const visits = ref([]) as any
const vacations = ref([]) as any

async function fetchData() {
    const range = weekRange.value;
    const resVisits = await axiosInstance.get(`/schedule/all-visits?week=${encodeURIComponent(range)}`);
    visits.value = resVisits.data;
    console.log(visits.value)
    const resVacations = await axiosInstance.get(`/vacations?week=${encodeURIComponent(range)}`);
    vacations.value = resVacations.data;
}

const showModal = ref(false);
const vistId = ref() as any

function onEventClick(event: any) {
    hoverEvent.value = null
    hoverPosition.value = null
    if (event.type === 'visit') {
        vistId.value = event.id;
        showModal.value = !showModal.value;
    }
}

const handleModalClose = () => {
    showModal.value = false;
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

const eventsForWeek = computed(() => {
    const start = dayjs(weekDays.value[0].date).startOf('day');
    const end = dayjs(weekDays.value[weekDays.value.length - 1].date).endOf('day');
    const events = [] as any[];


    visits.value.forEach((v: any) => {
        const eventDate = dayjs(`${v.date} ${v.end_time}`);
        if (eventDate.isBetween(start, end, 'day', '[]')) {
            const formatTime = (t: string) => t.endsWith(':00') ? t.slice(0, -3) : t;

            events.push({
                id: v.visit_id,
                type: 'visit',
                date: v.date,
                start_time: v.start_time,
                end_time: v.end_time,
                time: `${formatTime(v.start_time)}-${formatTime(v.end_time)}`, // <-- bez :00
                label: `${v.user_name.charAt(0)}. ${v.user_surname}`,
                name: `${v.user_name} ${v.user_surname}`,
                user_type: v.user_type,
                phone: v.phone,
                notes: v.last_user_note?.text,
                fast_note: v.fast_note?.text,
                doctor_id: v.doctor_id,
                isPast: eventDate.isBefore(dayjs()),
            });
        }
    });

    vacations.value.forEach((v: any) => {
        const eventDate = dayjs(`${v.start_date} ${v.end_time}`);
        if (eventDate.isBetween(start, end, 'day', '[]')) {
            events.push({
                id: v.id,
                type: 'vacation',
                date: v.start_date,
                start_time: v.start_time,
                end_time: v.end_time,
                label: '',
                doctor_id: v.doctor_id,
                isPast: eventDate.isBefore(dayjs()),
            });
        }
    });

    return events;
});

function toMinutes(hms: string) {
    const [h, m, s] = hms.split(':').map(Number) as any;
    return h * 60 + m + (s > 0 ? 1 : 0);
}

function getEventPosition(e: any): any {
    const dayIndex = weekDays.value.findIndex((d: any) => d.date === e.date);
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

function eLabel(e: any) {
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

const scheduleScrollEl = ref<HTMLElement | null>(null);

function onWheelScroll(e: WheelEvent) {
    if (!scheduleScrollEl.value) return;
    const target = e.target as HTMLElement;
    if (target.closest('.time-cell') || target.closest('.time-col-test')) {
        return;
    }
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        scheduleScrollEl.value.scrollLeft += e.deltaY;
    }
}
let interval: any = null;

const centerDay = ref(null) as any

function updateCenterDay() {
    if (!scheduleScrollEl.value) return;
    const scrollCenter = scheduleScrollEl.value.scrollLeft + scheduleScrollEl.value.clientWidth / 2;
    const dayWidth = doctors.length * columnWidth;
    const dayIndex = Math.floor((scrollCenter - timeColWidth) / dayWidth);

    if (dayIndex >= 0 && dayIndex < weekDays.value.length) {
        centerDay.value = weekDays.value[dayIndex];

        // zapisujemy displayDate zamiast surowego selectedDate
        let dateToSave = dayjs(centerDay.value.date).subtract(1, "day");
        while (dateToSave.day() === 0 || dateToSave.day() === 6) {
            dateToSave = dateToSave.subtract(1, "day");
        }
        centerDayCookie.value = dateToSave.format("YYYY-MM-DD");
    } else {
        centerDay.value = null;
    }

    if (!userSelectedDate.value && centerDay.value) {
        selectedDate.value = centerDay.value.date;
    }
}

onMounted(async () => {
    isLoading.value = true;
    setWeekStartFromCookieOrToday();
    await fetchData();
    scheduleScrollEl.value = document.querySelector('.schedule-scroll') as HTMLElement;

    const initialDate = centerDayCookie.value || todayDate;
    const dayIndex = weekDays.value.findIndex((d: any) => d.date === initialDate);

    if (scheduleScrollEl.value && dayIndex >= 0) {
        setTimeout(() => {
            scrollDayToLeft(dayIndex);
        }, 50);
    }

    scheduleScrollEl.value?.addEventListener('wheel', onWheelScroll, { passive: false });
    scheduleScrollEl.value?.addEventListener("scroll", updateCenterDay);
    updateCurrentTime();
    interval = setInterval(updateCurrentTime, 100);
    setTimeout(() => {
        isLoading.value = false;
    }, 900)
});


onBeforeUnmount(() => {
    if (interval) clearInterval(interval);
    scheduleScrollEl.value?.removeEventListener('wheel', onWheelScroll);
    scheduleScrollEl.value?.removeEventListener('scroll', updateCenterDay);
});

function scrollDayToLeft(dayIndex: number) {
    if (!scheduleScrollEl.value) return;
    const dayWidth = doctors.length * columnWidth;
    const dayStart = timeColWidth + dayIndex * dayWidth;
    const targetScroll = dayStart - 130;
    scheduleScrollEl.value.scrollTo({
        left: targetScroll,
        behavior: "smooth",
    });
}

function scrollTodayToLeft() {
    resetUserSelected()
    const todayIndex = weekDays.value.findIndex((d: any) => d.date === todayDate);
    if (todayIndex >= 0) {
        scrollDayToLeft(todayIndex);
    } else {
        weekStart.value = today.startOf("day");
        saveWeekStartToCookie();
        fetchData().then(() => {
            const newIndex = weekDays.value.findIndex((d: any) => d.date === todayDate);
            if (newIndex >= 0) {
                setTimeout(() => scrollDayToLeft(newIndex), 50);
            }
        });
    }
}

const selectedDate = ref(today.format("YYYY-MM-DD"));
const userSelectedDate = ref<string | null>(null);

// const displayDate = computed({
//     get() {
//         return selectedDate.value
//     },
//     set(val: string) {
//         selectedDate.value = val
//         onDateChange()
//     }
// })

const displayDate = computed({
    get() {
        let date = dayjs(selectedDate.value).subtract(1, "day");
        // jeśli wpadnie na weekend, cofamy aż do piątku
        while (date.day() === 0 || date.day() === 6) {
            date = date.subtract(1, "day");
        }
        return date.format("YYYY-MM-DD");
    },
    set(val: string) {
        selectedDate.value = val;
        onDateChange();
    }
});

function onDateChange() {
    const chosen = dayjs(selectedDate.value);
    if (!chosen.isValid()) return;
    // log tylko dla ręcznej zmiany
    if (userSelectedDate.value !== selectedDate.value) {
        console.log('now data', selectedDate.value);
    }
    weekStart.value = chosen.startOf("day");
    saveWeekStartToCookie();
    fetchData().then(() => {
        const dayIndex = weekDays.value.findIndex((d: any) => d.date === chosen.format("YYYY-MM-DD"));
        if (dayIndex >= 0) {
            setTimeout(() => scrollDayToLeft(dayIndex), 50);
        } else {
            scrollTodayToLeft();
        }
    });
    userSelectedDate.value = selectedDate.value;
}

watch(centerDay, (val) => {
    if (!userSelectedDate.value && val) {
        selectedDate.value = val.date;
    }
})

function resetUserSelected() {
    userSelectedDate.value = null;
}
watch(centerDay, (val) => {
    if (val) {
        selectedDate.value = val.date;
    }
})
</script>

<style scoped>
/* Michał */
.event.doctor-1 {
    background-color: #27a4709e !important;
    /* czerwony */
}

/* Grzegorz*/
.event.doctor-2 {
    background-color: #bf6b118f !important;
    /* niebieski */
}

/* Ola */
.event.doctor-3 {
    background-color: #9f1edb76 !important;
    /* zielony */
}

/* Asia */
.event.doctor-4 {
    background-color: #f507dd6f !important;
    /* żółty */
}

.text-prywatny {
    color: #000000 !important;
    /* czarny */
}

.text-AWF {
    color: #ff0000 !important;
    /* czerwony */
}

.text-Klub.gimnastyki {
    color: #0000ff !important;
    /* niebieski */
}

.text-Od.Grzegorza {
    color: #ffff00 !important;
    /* żółty */
}

.text-Od.Asi {
    color: #008000 !important;
    /* zielony */
}

.text-null {
    color: #8b4513 !important;
    /* brązowy */
}

.event-tooltip {
    background: #333333d2;
    color: #fff;
    padding: 10px 16px;
    border-radius: 6px;
    white-space: pre-line;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    font-size: 15px;
    pointer-events: none;
    height: 220px;
    position: absolute;
    width: 300px;
    line-height: 1.4;
    display: flex;
    flex-direction: column;

}
</style>
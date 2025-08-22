<template>
    <Modal component="visit" :modalActive="showModal" :data="vistId" @close="handleModalClose" />
    <div v-if="isLoading">
        <LoadingSpinner :isLoading="true" />
    </div>
    <div class="flex place-items-center w-full justify-between px-[30px] pb-[24px] mt-[60px]"
        :class="isLoading == true ? 'window-loading' : ''">
        <h1 class="font-semibold text-[32px]">Kalendarz z wizytami</h1>
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
                        :class="[e.type, e.isPast ? 'event-past' : 'event-future']" :style="getEventPosition(e)"
                        :title="eLabel(e)" @click="onEventClick(e)">
                        {{ eLabel(e) }}
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
                </div>z
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useNuxtApp, useCookie } from 'nuxt/app';
import dayjs, { Dayjs } from 'dayjs';
import isBetweenPlugin from 'dayjs/plugin/isBetween';
import 'dayjs/locale/pl';

dayjs.locale('pl');
dayjs.extend(isBetweenPlugin);

const axiosInstance = useNuxtApp().$axiosInstance as any;
const centerDayCookie = useCookie('centerDay');
const rowHeight = 50;
const startHour = 7;
const endHour = 22;
const columnWidth = 100;
const timeColWidth = 75;
const isLoading = ref(true)
const currentWeekCookie = useCookie('currentWeekStart');


const doctors = [
    { id: 1, name: 'Michał' },
    { id: 2, name: 'Grzegorz' },
    { id: 3, name: 'Ola' },
    { id: 4, name: 'Kacper' },
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
    const resVacations = await axiosInstance.get(`/vacations?week=${encodeURIComponent(range)}`);
    vacations.value = resVacations.data;
}

const showModal = ref(false);
const vistId = ref();

function onEventClick(event: any) {
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

const eventsForWeek = computed(() => {
    const start = dayjs(weekDays.value[0].date).startOf('day');
    const end = dayjs(weekDays.value[weekDays.value.length - 1].date).endOf('day');
    const events = [] as any[];

    visits.value.forEach((v: any) => {
        const eventDate = dayjs(`${v.date} ${v.end_time}`);
        if (eventDate.isBetween(start, end, 'day', '[]')) {
            events.push({
                id: v.visit_id,
                type: 'visit',
                date: v.date,
                start_time: v.start_time,
                end_time: v.end_time,
                label: `${v.user_name.charAt(0)}. ${v.user_surname}`,
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
        centerDayCookie.value = centerDay.value.date;
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
            scrollDayToCenter(dayIndex);
        }, 50);
    } else {
        if (scheduleScrollEl.value) {
            const todayIndex = weekDays.value.findIndex((d: any) => d.date === todayDate);
            if (todayIndex >= 0) {
                setTimeout(() => {
                    scrollDayToCenter(todayIndex);
                }, 50);
            }
        }
    }
    scheduleScrollEl.value?.addEventListener('wheel', onWheelScroll, { passive: false });
    scheduleScrollEl.value?.addEventListener("scroll", updateCenterDay);
    updateCurrentTime();
    interval = setInterval(updateCurrentTime, 100);
    setTimeout(() => {
        isLoading.value = false;
    }, 800)
});

onBeforeUnmount(() => {
    if (interval) clearInterval(interval);
    scheduleScrollEl.value?.removeEventListener('wheel', onWheelScroll);
    scheduleScrollEl.value?.removeEventListener('scroll', updateCenterDay);
});

function scrollDayToCenter(dayIndex: number) {
    if (!scheduleScrollEl.value) return;
    const dayWidth = doctors.length * columnWidth;
    const dayStart = timeColWidth + dayIndex * dayWidth;
    const dayCenter = dayStart + dayWidth / 2;
    const viewportCenter = scheduleScrollEl.value.clientWidth / 2;
    const targetScroll = dayCenter - viewportCenter;
    scheduleScrollEl.value.scrollTo({
        left: targetScroll,
        behavior: "smooth",
    });
}

function scrollTodayToCenter() {
    resetUserSelected()
    const todayIndex = weekDays.value.findIndex((d: any) => d.date === todayDate);
    if (todayIndex >= 0) {
        scrollDayToCenter(todayIndex);
    } else {
        weekStart.value = today.startOf("day");
        saveWeekStartToCookie();
        fetchData().then(() => {
            const newIndex = weekDays.value.findIndex((d: any) => d.date === todayDate);
            if (newIndex >= 0) {
                setTimeout(() => scrollDayToCenter(newIndex), 50);
            }
        });
    }
}

const selectedDate = ref(today.format("YYYY-MM-DD"));
const userSelectedDate = ref<string | null>(null);

const displayDate = computed({
    get() {
        return selectedDate.value
    },
    set(val: string) {
        selectedDate.value = val
        onDateChange()
    }
})

function onDateChange() {
    const chosen = dayjs(selectedDate.value);
    if (!chosen.isValid()) return;
    weekStart.value = chosen.startOf("day");
    saveWeekStartToCookie();
    fetchData().then(() => {
        const dayIndex = weekDays.value.findIndex((d: any) => d.date === chosen.format("YYYY-MM-DD"));
        if (dayIndex >= 0) {
            setTimeout(() => scrollDayToCenter(dayIndex), 50);
        } else {
            scrollTodayToCenter();
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
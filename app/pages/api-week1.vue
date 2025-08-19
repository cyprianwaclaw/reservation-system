<template>
    <div class="calendar-container" ref="calendarContainer">
        <!-- Header -->
        <div class="header-row">
            <div class="time-col-header">Godziny</div>
            <div class="days-header">
                <div v-for="day in days" :key="day.date" class="day-cell">
                    {{ day.label }}
                </div>
            </div>
        </div>

        <!-- Subheader (np. lekarze) -->
        <div class="subheader-row">
            <div class="time-col-subheader"></div>
            <div class="doctors-header">
                <div v-for="doctor in doctors" :key="doctor.id" class="doctor-cell">
                    {{ doctor.name }}
                </div>
            </div>
        </div>

        <!-- Główna siatka -->
        <div class="grid-container">
            <!-- Kolumna godzin -->
            <div class="time-col" ref="timeCol">
                <div v-for="hour in hours" :key="hour" class="time-cell">
                    {{ hour }}
                </div>
            </div>

            <!-- Komórki dni -->
            <div class="cells" ref="cells">
                <div v-for="day in days" :key="day.date" class="day-column">
                    <div v-for="hour in hours" :key="day.date + hour" class="cell"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";

const calendarContainer = ref(null);
const timeCol = ref(null);
const cells = ref(null);

const days = [
    { date: "2025-08-11", label: "Poniedziałek" },
    { date: "2025-08-12", label: "Wtorek" },
    { date: "2025-08-13", label: "Środa" },
    { date: "2025-08-14", label: "Czwartek" },
    { date: "2025-08-15", label: "Piątek" },
    { date: "2025-08-16", label: "Sobota" },
    { date: "2025-08-17", label: "Niedziela" },
];

const doctors = [
    { id: 1, name: "Dr Kowalski" },
    { id: 2, name: "Dr Nowak" },
];

const hours = [
    "07:00", "08:00", "09:00", "10:00", "11:00",
    "12:00", "13:00", "14:00", "15:00", "16:00",
    "17:00", "18:00", "19:00", "20:00"
];

function handleWheel(e) {
    const target = e.target;

    // Jeśli najedziemy na kolumnę godzin → scroll pionowy
    if (timeCol.value && timeCol.value.contains(target)) {
        // normalne zachowanie
        return;
    }

    // Jeśli najedziemy na komórki dni → scroll zamieniamy na poziomy
    if (cells.value && cells.value.contains(target)) {
        e.preventDefault();
        calendarContainer.value.scrollLeft += e.deltaY;
    }
}

onMounted(() => {
    calendarContainer.value.addEventListener("wheel", handleWheel, {
        passive: false,
    });
});

onBeforeUnmount(() => {
    calendarContainer.value.removeEventListener("wheel", handleWheel);
});
</script>

<style scoped>
.calendar-container {
    width: 100%;
    height: 600px;
    overflow: auto;
    border: 1px solid #ddd;
    display: flex;
    flex-direction: column;
}

/* header dni */
.header-row {
    display: flex;
    position: sticky;
    top: 0;
    background: #f0f0f0;
    z-index: 50;
}

.time-col-header {
    width: 80px;
    border-right: 1px solid #ddd;
}

.days-header {
    display: flex;
    flex: 1;
}

.day-cell {
    flex: 1;
    text-align: center;
    border-right: 1px solid #ddd;
}

/* subheader lekarzy */
.subheader-row {
    display: flex;
    position: sticky;
    top: 30px;
    background: #fff;
    z-index: 40;
}

.time-col-subheader {
    width: 80px;
    border-right: 1px solid #ddd;
}

.doctors-header {
    display: flex;
    flex: 1;
}

.doctor-cell {
    flex: 1;
    text-align: center;
    border-right: 1px solid #ddd;
}

/* grid */
.grid-container {
    display: flex;
    flex: 1;
}

.time-col {
    width: 80px;
    background: #fafafa;
    border-right: 1px solid #ddd;
    position: sticky;
    left: 0;
    z-index: 60;
}

.time-cell {
    height: 60px;
    border-bottom: 1px solid #ddd;
    display: flex;
    align-items: center;
    justify-content: center;
}

.cells {
    display: flex;
    flex: 1;
}

.day-column {
    flex: 1;
    border-right: 1px solid #ddd;
}

.cell {
    height: 60px;
    border-bottom: 1px solid #eee;
}</style>
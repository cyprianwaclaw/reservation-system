<template>
    <div>
        <!-- Modal (jeśli chcesz go użyć później) -->
        <Modal component="visit" :modalActive="showModal" :data="visitId" @close="handleModalClose" />

        <!-- Loader -->
        <div v-if="isLoading" class="text-center py-8">
            Ładowanie dostępnych terminów...
        </div>

        <!-- Nagłówek -->
        <div v-else class="flex justify-between items-center px-6 py-4 border-b">
            <h1 class="text-2xl font-semibold">Planowane wizyty</h1>
            <InputCalendar v-model="displayDate" />
        </div>

        <!-- Tabela dni i godzin -->
        <div class="schedule-scroll overflow-auto relative" ref="scheduleScrollEl">
            <div class="schedule-inner min-w-max">
                <div class="grid grid-cols-[75px_repeat(auto-fill,_100px)] gap-0">
                    <!-- Pusta kolumna czasu -->
                    <div></div>

                    <!-- Nagłówek dni -->
                    <div v-for="day in weekDays" :key="day.date"
                        class="px-2 py-1 font-semibold text-center border-b border-gray-200 bg-gray-100">
                        {{ day.label }}
                    </div>

                    <!-- Czas slotów -->
                    <template v-for="hour in hours" :key="hour">
                        <div class="px-2 py-1 border-t border-gray-200 bg-gray-50 font-medium text-right">
                            {{ hour }}
                        </div>
                        <template v-for="day in weekDays" :key="day.date + '-' + hour">
                            <div class="px-2 py-1 border-t border-l border-gray-200">
                                <button v-if="isSlotAvailable(day.date, hour)" @click="handleClick(day.date, hour)"
                                    class="w-full py-1 bg-green-500 text-white rounded hover:bg-green-600 transition">
                                    Wolny
                                </button>
                            </div>
                        </template>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from "vue"
import dayjs, { Dayjs } from "dayjs"
import 'dayjs/locale/pl'
// import InputCalendar from "@/components/InputCalendar.vue"
// import Modal from "@/components/Modal.vue"
// import axiosInstance from "@/axios"

dayjs.locale('pl')

const isLoading = ref(true)
const scheduleScrollEl = ref<HTMLElement | null>(null)

const startHour = 7
const endHour = 21
const columnWidth = 100
const timeColWidth = 75
const rowHeight = 50

// ---- Dane ----
interface Slot {
    date: string
    hours: string[]
}

const slots = ref<Slot[]>([])
const weekStart = ref<Dayjs>(dayjs())
const today = dayjs()
const todayDate = today.format("YYYY-MM-DD")

const showModal = ref(false)
const visitId = ref<number | null>(null)

// ---- Wyświetlane godziny ----
const hours = Array.from({ length: endHour - startHour }, (_, i) =>
    `${String(i + startHour).padStart(2, "0")}:00`
)

// ---- Wyliczone dni tygodnia (5 dni roboczych) ----
const weekDays = computed(() => {
    const start = weekStart.value.startOf("week").add(1, "day") // poniedziałek
    return Array.from({ length: 5 }).map((_, i) => {
        const d = start.add(i, "day")
        return {
            date: d.format("YYYY-MM-DD"),
            label: d.format("dddd (DD.MM)").replace(/^./, s => s.toUpperCase())
        }
    })
})

// ---- Pobranie slotów z backendu ----
async function fetchSlots() {
    isLoading.value = true
    try {
        const res = await axiosInstance.get("/available-days", {
            params: {
                start_date: today.toISOString().split("T")[0]
            }
        })
        slots.value = res.data // [{date: "2025-09-09", hours: ["10:00"]}, ...]
    } catch (err) {
        console.error(err)
    } finally {
        isLoading.value = false
    }
}

// ---- Sloty dostępne do kliknięcia ----
function isSlotAvailable(date: string, hour: string) {
    const day = slots.value.find(d => d.date === date)
    return day?.hours.includes(hour) ?? false
}

// ---- Kliknięcie slotu ----
function handleClick(date: string, hour: string) {
    console.log("Kliknięty slot:", `${date} ${hour}`)
}

// ---- Obsługa modala ----
function handleModalClose() {
    showModal.value = false
}

// ---- Data z kalendarza ----
const selectedDate = ref(todayDate)
const displayDate = computed({
    get() { return selectedDate.value },
    set(val: string) {
        selectedDate.value = val
        // tutaj można wywołać fetchData dla nowej daty jeśli chcesz
    }
})

onMounted(async () => {
    await fetchSlots()
    await nextTick()
    scheduleScrollEl.value = document.querySelector('.schedule-scroll') as HTMLElement
})
</script>

<style scoped>
.schedule-scroll {
    overflow-x: auto;
    max-width: 100%;
}

.schedule-inner {
    display: inline-block;
    min-width: max-content;
}

button {
    cursor: pointer;
}
</style>
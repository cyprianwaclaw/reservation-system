<template>
    <div class="week-booking">
        <h2>Wybierz termin wizyty</h2>

        <div class="header">
            <button @click="prevWeek">Poprzedni tydzień</button>
            <div class="current-week-label">{{ weekLabel }}</div>
            <button @click="nextWeek">Następny tydzień</button>
        </div>

        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th class="hour-col"></th>
                        <th v-for="day in days" :key="day.iso" :colspan="persons.length" class="day-header">
                            {{ day.label }}
                        </th>
                    </tr>
                    <tr>
                        <th class="hour-col">Godzina</th>
                        <template v-for="day in days" :key="day.iso">
                            <th v-for="person in persons" :key="day.iso + '-' + person">{{ person }}</th>
                        </template>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="hour in hours" :key="hour">
                        <td class="hour-col">{{ hour }}</td>
                        <template v-for="day in days" :key="day.iso">
                            <td v-for="person in persons" :key="day.iso + '-' + person + '-' + hour" :class="[
                                'slot',
                                isFree(day.iso, person, hour) ? 'free' : 'busy',
                                isSelected(day.iso, person, hour) ? 'selected' : ''
                            ]" @click="handleSlotClick(day.iso, person, hour)" :title="getSlotTitle(day.iso, person, hour)"></td>
                        </template>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-if="selectedSlot" class="summary">
            Wybrano termin: <strong>{{ selectedSlot.date }}</strong>, osoba:
            <strong>{{ selectedSlot.person }}</strong> o godzinie
            <strong>{{ selectedSlot.hour }}</strong>
            <button class="btn-book" @click="bookSlot">Zarezerwuj</button>
            <button class="btn-cancel" @click="cancelSelection">Anuluj wybór</button>
        </div>

        <div v-if="confirmed" class="confirmation">
            Zarezerwowano termin: <strong>{{ confirmed.date }}</strong>, osoba:
            <strong>{{ confirmed.person }}</strong> o godzinie
            <strong>{{ confirmed.hour }}</strong>
            <button class="btn-cancel" @click="cancelConfirmedBooking">Anuluj rezerwację</button>
        </div>

        <div class="legend">
            <span><span class="legend-box free"></span> Wolny</span>
            <span><span class="legend-box busy"></span> Zajęty (kliknij, aby anulować)</span>
            <span><span class="legend-box selected"></span> Wybrany</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { persons, hours, schedule, reserveSlot, cancelReservation } from  '~/composables/useSchedule'

function getMonday(d: Date) {
    const date = new Date(d)
    const day = date.getDay()
    const diff = (day === 0 ? -6 : 1) - day
    date.setDate(date.getDate() + diff)
    date.setHours(0, 0, 0, 0)
    return date
}

const currentMonday = ref(getMonday(new Date()))

const days = computed(() => {
    const arr: { date: Date; iso: string; label: string }[] = []
    for (let i = 0; i < 7; i++) {
        const d = new Date(currentMonday.value)
        d.setDate(d.getDate() + i)
        arr.push({
            date: d,
            iso: d.toISOString().split('T')[0],
            label: d.toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'numeric' }),
        })
    }
    return arr
})

const selectedSlot = ref<{ date: string; person: string; hour: string } | null>(null)
const confirmed = ref<{ date: string; person: string; hour: string } | null>(null)

function makeKey(dateISO: string, person: string, hour: string) {
    return `${dateISO}-${person}-${hour}`
}

function isFree(dateISO: string, person: string, hour: string) {
    return !schedule.value[makeKey(dateISO, person, hour)]
}

function isSelected(dateISO: string, person: string, hour: string) {
    return (
        selectedSlot.value?.date === dateISO &&
        selectedSlot.value?.person === person &&
        selectedSlot.value?.hour === hour
    )
}

// Nowa funkcja obsługująca kliknięcie na slot
function handleSlotClick(dateISO: string, person: string, hour: string) {
    if (isFree(dateISO, person, hour)) {
        // Jeśli slot wolny — zaznaczamy go do rezerwacji
        if (
            selectedSlot.value &&
            selectedSlot.value.date === dateISO &&
            selectedSlot.value.person === person &&
            selectedSlot.value.hour === hour
        ) {
            selectedSlot.value = null
        } else {
            selectedSlot.value = { date: dateISO, person, hour }
        }
        confirmed.value = null
    } else {
        // Jeśli slot zajęty — usuwamy rezerwację natychmiast po kliknięciu
        cancelReservation(dateISO, person, hour)
        // Jeśli potwierdzona rezerwacja to ten slot, usuwamy potwierdzenie
        if (
            confirmed.value &&
            confirmed.value.date === dateISO &&
            confirmed.value.person === person &&
            confirmed.value.hour === hour
        ) {
            confirmed.value = null
        }
        // Jeśli zaznaczony to samo — odznaczamy
        if (
            selectedSlot.value &&
            selectedSlot.value.date === dateISO &&
            selectedSlot.value.person === person &&
            selectedSlot.value.hour === hour
        ) {
            selectedSlot.value = null
        }
    }
}

function bookSlot() {
    if (!selectedSlot.value) return
    reserveSlot(selectedSlot.value.date, selectedSlot.value.person, selectedSlot.value.hour)
    confirmed.value = { ...selectedSlot.value }
    selectedSlot.value = null
}

function cancelSelection() {
    selectedSlot.value = null
}

function cancelConfirmedBooking() {
    if (!confirmed.value) return
    cancelReservation(confirmed.value.date, confirmed.value.person, confirmed.value.hour)
    confirmed.value = null
}

function prevWeek() {
    const prev = new Date(currentMonday.value)
    prev.setDate(prev.getDate() - 7)
    currentMonday.value = prev
    cancelSelection()
    confirmed.value = null
}

function nextWeek() {
    const next = new Date(currentMonday.value)
    next.setDate(next.getDate() + 7)
    currentMonday.value = next
    cancelSelection()
    confirmed.value = null
}

const personsList = persons
const hoursList = hours

const weekLabel = computed(() => {
    const start = currentMonday.value.toLocaleDateString('pl-PL', { day: 'numeric', month: 'numeric' })
    const endDate = new Date(currentMonday.value)
    endDate.setDate(endDate.getDate() + 6)
    const end = endDate.toLocaleDateString('pl-PL', { day: 'numeric', month: 'numeric' })
    return `${start} - ${end}`
})

// Opcjonalnie tooltipy z opisem slotu (wolny/zajęty)
function getSlotTitle(dateISO: string, person: string, hour: string) {
    return isFree(dateISO, person, hour) ? 'Wolny slot — kliknij, by wybrać' : 'Zajęty slot — kliknij, aby anulować'
}
</script>

<style scoped>
/* Style jak poprzednio */
.slot.free {
    background-color: #8f8;
    cursor: pointer;
}

.slot.busy {
    background-color: #f88;
    cursor: pointer;
    /* ważne, żeby klik był aktywny */
}

.slot.selected {
    background-color: #31a9ce;
    color: white;
}

/* reszta styli z poprzedniego przykładu */
</style>
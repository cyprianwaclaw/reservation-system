import { ref } from 'vue'

// Lista osób
export const persons = ['Osoba1', 'Osoba2', 'Osoba3']

// Godziny pracy
export const hours = Array.from({ length: 11 }, (_, i) => String(i + 8).padStart(2, '0') + ':00')

// Stan rezerwacji: klucz => obiekt { name, surname }
export const schedule = ref<Record<string, { name: string, surname: string } | null>>({})

// Tworzenie klucza
function makeKey(dateISO: string, person: string, hour: string) {
    return `${dateISO}-${person}-${hour}`
}

// Rezerwacja
export function reserveSlot(dateISO: string, person: string, hour: string, name: string, surname: string) {
    schedule.value[makeKey(dateISO, person, hour)] = { name, surname }
}

// Anulowanie
export function cancelReservation(dateISO: string, person: string, hour: string) {
    delete schedule.value[makeKey(dateISO, person, hour)]
}

// Sprawdzenie wolności slotu
export function isFree(dateISO: string, person: string, hour: string) {
    return !schedule.value[makeKey(dateISO, person, hour)]
}

// Pobranie danych rezerwacji
export function getReservation(dateISO: string, person: string, hour: string) {
    return schedule.value[makeKey(dateISO, person, hour)] || null
}

// Wszystkie daty miesiąca
function getAllDatesInMonth(year: number, month: number): string[] {
    const dates: string[] = []
    const lastDay = new Date(year, month + 1, 0).getDate()
    for (let day = 1; day <= lastDay; day++) {
        const d = new Date(year, month, day)
        dates.push(d.toISOString().split('T')[0])
    }
    return dates
}

// Wolne sloty w miesiącu
export function getFreeSlots(year: number, month: number) {
    const freeSlots: Record<string, Record<string, string[]>> = {}
    const dates = getAllDatesInMonth(year, month)

    for (const date of dates) {
        freeSlots[date] = {}
        for (const person of persons) {
            const freeHours = hours.filter(hour => isFree(date, person, hour))
            if (freeHours.length > 0) {
                freeSlots[date][person] = freeHours
            }
        }
        if (Object.keys(freeSlots[date]).length === 0) {
            delete freeSlots[date]
        }
    }
    return freeSlots
}
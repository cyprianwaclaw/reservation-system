<template>
    <div class="w-full">
        <p class="text-[32px] font-semibold -mt-[8px] mb-[22px]">Grafik pracy</p>
        <div class="flex w-full gap-[54px]">
            <div class="w-full relative select-none">
                <div class="flex relative">
                    <Icon name="ph:magnifying-glass" size="28" class="text-[#cacaca] absolute top-[10px] left-[13px]" />
                    <input v-model="searchTerm" @input="onSearch" type="text" placeholder="Szukaj pacjenta..."
                        class="serach-input" />
                </div>
                <div class="flex flex-col overflow-y-auto w-full patients-container border-scroll-container h-[300px] relative"
                    ref="containerRef">
                    <div v-for="(patients, letter) in allPatient" :key="letter">
                        <p class="letter-row">{{ letter }}</p>
                        <div v-for="(patient, index) in patients" :key="patient.id">
                            <div class="patient-row" @click="fetchSingleUser(patient.id)">
                                <p :class="[
                                    singleUser?.id === patient.id ? 'active-user' : 'non-active-user',
                                    index === 0 ? 'mt-[4px]' : '',
                                    index + 1 === patients.length ? 'mb-[4px]' : '',
                                ]">
                                    {{ patient.name }} {{ patient.surname }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div v-if="allLoaded && Object.keys(allPatient).length === 0" class="text-center p-2 text-gray-500">
                        Brak wyników
                    </div>
                </div>
            </div>
            <!-- Szczegóły pojedynczego użytkownika -->
            <div class="w-full relative">
                <!-- <Transition name="fade-slide" mode="out-in"> -->

                <div v-if="isEdit" class="max-h-[450px] overflow-y-auto border-scroll-container pb-[28px]">
                    <div class="flex gap-[7px] place-items-center cursor-pointer back-icon">
                        <Icon name="ph:arrow-left" size="21" class="cursor-pointer" />
                        <button class="cursor-pointer" @click="toggleEdit()">Powrót</Button>
                    </div>
                    <div class="w-full flex flex-col gap-[10px] mt-[40px]">
                        <p class="text-[16px] font-semibold primary-color -mb-[2px]">Dane personalne</p>
                        <InputBase v-model="firstName" name="name" placeholder="Imię" />
                        <InputBase v-model="surName" name="surname" placeholder="Nazwisko" />
                        <div class="flex w-full gap-[10px] place-items-center">
                            <div class="flex w-full gap-[4px] place-items-center">
                                <p class="w-[110px]">Wiek pacjenta</p>
                                <div class="w-[78px]">
                                    <InputBase v-model="age" name="wiek" placeholder="Wiek" />
                                </div>
                            </div>
                            <InputBase v-model="pesel" name="pesel" placeholder="PESEL" />
                        </div>
                        <p class="text-[16px] font-semibold primary-color -mb-[2px] mt-[24px]">Zmieszkanie</p>
                        <div class="flex gap-[10px]">
                            <div class="w-[140px]">
                                <InputBase v-model="city_code" name="city_code" placeholder="Kod" />
                            </div>
                            <InputBase v-model="city" name="city" placeholder="Miejscowość" />
                        </div>
                        <InputBase v-model="street" name="street" placeholder="Nazwa ulicy oraz numer" />
                        <p class="text-[16px] font-semibold primary-color mt-[24px] -mb-[2px]">Dane kontaktowe</p>
                        <InputBase v-model="email" name="email" placeholder="E-mail" />
                        <InputBase v-model="phone" name="phone" placeholder="Telefon" />
                    </div>
                    <div class="w-full flex flex-col gap-[10px] mt-[24px]">
                        <p class="text-[16px] font-semibold primary-color -mb-[2px]">Rodzaj pacjenta</p>
                        <InputSelect v-model="patientType" :options="patientTypeOptions" placeholder="Wybierz rodzaj" />
                        <p class="text-[16px] font-semibold primary-color mt-[24px] -mb-[2px]">Napisz coś o pacjencie</p>
                        <textarea v-model="description" placeholder="O pacjencie..."
                            class="add-description min-h-[170px]"></textarea>
                    </div>
                    <div class="flex place-items-center gap-[21px]">
                        <button class="primary-button mt-[35px]" @click="updatePatient()">Zapisz</Button>
                        <Transition name="fade-slide">
                            <div v-if="isSuccess" class="flex place-items-center gap-[5px] mt-[36px]">
                                <Icon name="ph:check-circle" size="28" class="text-[#37B342]" />
                                <p class="text-[18px] font-medium text-[#37B342]">Zapisano zmiany</p>
                            </div>
                        </Transition>
                    </div>
                </div>
                <!-- </Transition> -->
                <!-- <Transition name="fade-slide" mode="out-in"> -->
                <div v-if="!isEdit">
                    <!-- </div> -->
                    <Transition name="fade" mode="out-in">
                        <div v-if="singleUser" :key="singleUser.id"
                            class="max-h-[450px] overflow-y-auto border-scroll-container pb-[28px]">
                            <p class="primary-color font-semibold text-[13px]">{{ singleUser.patient_type ?
                                singleUser.patient_type : 'Zapisany przez panel' }}</p>
                            <div class="flex place-items-center gap-[14px]">
                                <p class="text-[26px] font-bold">{{ singleUser.name }} {{ singleUser.surname }}</p>
                            </div>
                            <div class="mt-[15px] gap-[5px] flex flex-col">
                                <p class="text-gray-500 text-[16px]">{{ singleUser.email }}</p>
                                <p class="text-gray-500 text-[16px]">
                                    <!-- +48 {{ singleUser.phone ? singleUser.phone.replace(/\D/g, '').match(/.{1,3}/g)?.join(' ') : '' }} -->
                                    +48 {{ singleUser.phone ? singleUser.phone.replace(/\D/g, '').match(/.{1,3}/g)?.join('') : '' }}
                                </p>
                                <p class="text-gray-500 text-[16px] -mt-[3px]">{{ singleUser.age }}</p>
                                <p v-if="singleUser.pesel" class="text-gray-500 text-[16px] -mt-[3px]">PESEL: {{
                                    singleUser.pesel }}</p>
                            </div>
                            <div class="mt-[34px]" v-if="singleUser?.city || singleUser?.street || singleUser?.city_code">
                                <p class="text-[18px] font-semibold mb-[8px] primary-color ">Zamieszkanie</p>
                                <div class="pr-[18px]">
                                    <p class="text-[17px]">
                                        {{ singleUser.city_code }}, {{ singleUser.city }}
                                    </p>
                                    <p class="text-[17px] mt-[3px]">{{ singleUser.street }}
                                    </p>
                                </div>
                            </div>
                            <div class="mt-[34px]" v-if="singleUser?.description">
                                <p class="text-[18px] font-semibold mb-[8px] primary-color ">O pacjencie</p>
                                <div class="pr-[18px] border-scroll-container">
                                    <p class="text-[16px]">
                                        {{ singleUser.description }}
                                    </p>
                                </div>
                            </div>
                            <div class="w-full mt-[34px]" v-if="singleUser?.visits?.length > 0">
                                <p class="text-[18px] font-semibold mb-[13px] primary-color">Poprzednie wizyty</p>
                                <div class="max-h-[300px] overflow-y-auto border-scroll-container">
                                    <div v-for="(single, index) in  singleUser?.visits" :key="index"
                                        class="w-full py-[18px] px-[18px] rounded-xl bg-[#f0f0f097]"
                                        :class="index === 0 ? 'mt-[0px]' : 'mt-[10px]'">
                                        <div class="flex justify-between place-items-center w-full">
                                            <p class="text-[14px] text-[#a1a1a1d5] -mt-[2px]">{{
                                                single?.visit_details?.date
                                            }},
                                                {{ single?.visit_details?.start_time }} - {{
                                                    single?.visit_details?.end_time
                                                }}
                                            </p>
                                            <p class="text-[14px] text-[#888888d5]  -mt-[2px] font-medium">{{
                                                single?.visit_details.doctor.name }}</p>
                                        </div>
                                        <p class="text-[17px] text-[#4f4f4f] mt-[3px]">{{ single?.text }}</p>
                                    </div>
                                </div>
                                <!-- <div v-else>
                                    <p class="text-[#8b8b8b6a] font-bold text-[20px] -mt-[3px]">Brak wizyt</p>
                                </div> -->
                            </div>
                            <div class="w-full flex items-start gap-[20px] mt-[40px]">

                                <div class="gap-[20px] w-full flex " v-if="isDelete">
                                    <p class="font-semibold mt-[9px]">Czy na pewno usunć pacjenta?</p>
                                    <div class="flex gap-[6px]">
                                        <button class="remove-button" @click="confirmDelete(singleUser.id)">Tak</Button>
                                        <button class="primary-button" @click="isDelete = false">Nie</Button>
                                    </div>
                                </div>
                                <div v-else class="w-full flex justify-start gap-[6px]">
                                    <button class="primary-button" @click="toggleEdit()">Edytuj pacjenta</Button>
                                    <button class="remove-button" @click="isDelete = true">Usuń</Button>
                                </div>
                            </div>
                        </div>
                    </Transition>
                </div>
                <!-- </Transition> -->
            </div>
        </div>
        <!-- Pulse loader overlay -->
        <div class="spinner-overlay" v-if="loading">
            <div class="pulse-loader">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const axiosInstance = useNuxtApp().$axiosInstance as any;
const { setErrors } = useErrors()

const allPatient = ref({}) as any;
const singleUser = ref(null) as any;
const loading = ref(false);
const searchTerm = ref('');

const limit = 60;
let offset = 0;
let allLoaded = false;
let debounceTimeout: any = null;



const firstName = ref("");
const surName = ref("");
const email = ref("");
const phone = ref("");
const age = ref("");
const street = ref("");
const city_code = ref("");
const city = ref("");
const pesel = ref("");
const patientType = ref('')
const description = ref("")
const isSuccess = ref()

const patientTypeOptions = ref<{ value: string; label: string }[]>([
    { value: 'Prywatny', label: 'Prywatny' },
    { value: 'Klub gimnastyki', label: 'Klub gimnastyki' },
    { value: 'AWF', label: 'AWF' },
    { value: 'WKS', label: 'WKS' },
    { value: 'Od Grzegorza', label: 'Od Grzegorza' },
    { value: 'DK', label: 'DK' },
    { value: 'DT', label: 'DT' }
])


const props = defineProps<{
    patientId?: number
}>()

const isDelete = ref<boolean>(false)
const isEdit = ref<boolean>(false)

const containerRef = ref<HTMLElement | null>(null);

const fetchPatient = async () => {
    if (loading.value || allLoaded) return;
    loading.value = true;

    try {
        const res = await axiosInstance.get('/allUsers', {
            params: { limit, offset, search: searchTerm.value }
        });

        const data = res.data.data;
        const hasMore = res.data.hasMore;
        const nextOffset = res.data.nextOffset;

        if (!data || Object.keys(data).length === 0) {
            allLoaded = true;
        } else {
            for (const letter in data) {
                if (allPatient.value[letter]) {
                    allPatient.value[letter] = [...allPatient.value[letter], ...data[letter]];
                } else {
                    allPatient.value[letter] = data[letter];
                }
            }
            offset = nextOffset;
            allLoaded = !hasMore;
        }
    } catch (error) {
        console.error(error);
    } finally {
        setTimeout(() => {
            loading.value = false;
        }, 200);
    }
};

const onSearch = () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        allPatient.value = {};
        offset = 0;
        allLoaded = false;
        fetchPatient();
    }, 200);
};

const confirmDelete = async (id: number) => {
    try {
        await axiosInstance.delete(`/patient-delete/${id}`);

        allPatient.value = {};
        offset = 0;
        allLoaded = false;
        await fetchPatient();

        isDelete.value = false;
        if (singleUser.value?.id === id) {
            singleUser.value = null;
        }
    } catch (error) {
        console.error(error);
    }
}


const fetchSingleUser = async (id: number) => {
    setTimeout(() => {
        isEdit.value = false
    }, 200);
    try {
        const res = await axiosInstance.get(`/all-users/${id}`);
        singleUser.value = res.data;
        isDelete.value = false
    } catch (error) {
        console.error(error);
    }
};

function clearPatientInputs() {
    firstName.value = "";
    surName.value = "";
    email.value = "";
    phone.value = "";
    description.value = "";
    age.value = "";
    patientType.value = "";
}


const toggleEdit = () => {
    isEdit.value = !isEdit.value

    if (isEdit.value === true) {
        firstName.value = singleUser.value.name
        surName.value = singleUser.value.surname
        email.value = singleUser.value.email
        phone.value = singleUser.value.phone
        pesel.value = singleUser.value.pesel
        street.value = singleUser.value.street
        city_code.value = singleUser.value.city_code
        city.value = singleUser.value.city
        age.value = String(singleUser.value.age).split(' ')[0] as any
        patientType.value = singleUser.value.patient_type
        description.value = singleUser.value?.description
    } else {
        console.log('wyjscie z edycji')
    }
}

const updatePatient = async () => {
    if (!singleUser.value) return;

    const data: Record<string, any> = {};

    if (firstName.value !== singleUser.value.name) data.name = firstName.value;
    if (surName.value !== singleUser.value.surname) data.surname = surName.value;
    if (phone.value !== singleUser.value.phone) data.phone = phone.value;
    if (email.value !== singleUser.value.email) data.email = email.value;
    if (description.value !== singleUser.value.description) data.opis = description.value;
    if (age.value !== String(singleUser.value.age).split(' ')[0]) data.wiek = age.value;
    if (patientType.value !== singleUser.value.patient_type) data.rodzaj_pacjenta = patientType.value;

    // 🔹 Dodane pola
    if (street.value !== singleUser.value.street) data.street = street.value;
    if (city_code.value !== singleUser.value.city_code) data.city_code = city_code.value;
    if (city.value !== singleUser.value.city) data.city = city.value;
    if (pesel.value !== singleUser.value.pesel) data.pesel = pesel.value;

    // Jeżeli nie ma żadnych zmian, nic nie wysyłamy
    if (Object.keys(data).length === 0) return;

    try {
        const res = await axiosInstance.patch(`/update-patient/${singleUser.value.id}`, data);
        isSuccess.value = res.data.message === 'User updated successfully';

        clearPatientInputs();

        setTimeout(() => {
            isSuccess.value = false;
            isEdit.value = false
        }, 1200);

        // Odświeżamy pełną listę pacjentów
        const currentUserId = singleUser.value?.id;
        allPatient.value = {};
        offset = 0;
        allLoaded = false;
        await fetchPatient();

        // Po pobraniu listy, ponownie pobieramy aktualnego pacjenta
        if (currentUserId) {
            await fetchSingleUser(currentUserId);
        }

    } catch (err: any) {
        if (err.response?.data?.errors) {
            setErrors(err.response.data.errors);
        }
    }
};


onMounted(() => {
    fetchPatient()

    if (props.patientId) {
        fetchSingleUser(props.patientId)
    }

    if (!containerRef.value) return;

    containerRef.value.addEventListener('scroll', () => {
        if (loading.value || allLoaded) return;

        if (containerRef.value) {
            const { scrollTop, scrollHeight, clientHeight } = containerRef.value;
            if (scrollTop + clientHeight >= scrollHeight - 100) {
                fetchPatient();
            }
        }
    });
});
</script>

<style scoped>
.patients-container {
    height: 379px;
    overflow-y: auto;
    position: relative;
}

.border-scroll-container {
    border-radius: 10px;
}

.letter-row {
    z-index: 10;
    top: 0;
    width: 100%;
    background: #31a9ce;
    border-radius: 8px;
    color: white;
    padding: 10px 16px;
    font-size: 18px;
}

.patient-row {
    width: 100%;
    border-radius: 8px;
}

.serach-input {
    width: 100%;
    border-radius: 10px;
    border: 2px solid #dedede;
    padding: 12px 16px 12px 50px;
    transition: 0.25s all;
    outline: none;
    resize: none;
    margin-bottom: 18px;
}

.serach-input:focus {
    outline: none;
    border: 2px solid #31a9ce;
}

.serach-input::placeholder {
    color: #cacaca;
    font-family: 'Public Sans', sans-serif;
    font-size: 16px;
}

.non-active-user {
    color: #322929;
    font-weight: 400;
    font-size: 17px;
    padding: 11px 14px;
    border-radius: 10px;
}

.active-user {
    padding: 11px 14px;
    color: #31a9ce;
    font-weight: 600;
    font-size: 17px;
}

.patient-row .non-active-user:hover {
    cursor: pointer;
    padding: 11px 14px;
    border-radius: 10px;
    background-color: #e0f2fe;
}

/* Pulse loader overlay */
.spinner-overlay {
    position: fixed;
    top: 165px;
    left: 40px;
    width: 405px;
    height: 390px;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    background-color: rgba(255, 255, 255, 0.7);
}

.pulse-loader {
    display: flex;
    gap: 10px;
}

.pulse-loader span {
    width: 15px;
    height: 15px;
    background: #3498db;
    border-radius: 50%;
    animation: pulse 0.8s infinite ease-in-out;
}

.pulse-loader span:nth-child(2) {
    animation-delay: 0.2s;
}

.pulse-loader span:nth-child(3) {
    animation-delay: 0.4s;
}

@keyframes pulse {

    0%,
    80%,
    100% {
        transform: scale(0.6);
        opacity: 0.5;
    }

    40% {
        transform: scale(1);
        opacity: 1;
    }
}

/* Animacja fade + slide dla singleUser */
.fade-enter-active,
.fade-leave-active {
    transition: all 0.25s ease-in-out;
}

.fade-enter-from {
    opacity: 0;
    /* transform: translateX(-20px); */
}

.fade-enter-to {
    opacity: 1;
    /* transform: translateX(0); */
}

.fade-leave-from {
    opacity: 1;
    transform: translateX(0);
}

.fade-leave-to {
    opacity: 0;
    /* transform: translateX(50px);  */
}


.fade-slide-enter-active,
.fade-slide-leave-active {
    transition: all 0.4s ease;
}

.fade-slide-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

.fade-slide-enter-from {
    opacity: 0;
    transform: translateY(10px);
}

.fade-slide-enter-to,
.fade-slide-leave-from {
    opacity: 1;
    transform: translateY(0);
}
</style>
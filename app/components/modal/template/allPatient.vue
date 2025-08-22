<template>
    <div class="w-full">
        <p class="text-[32px] font-semibold -mt-[8px] mb-[22px]">Pacjenci</p>
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
                <Transition name="fade-slide" mode="out-in">
                    <div v-if="singleUser" :key="singleUser.id"
                        class="max-h-[450px] overflow-y-auto border-scroll-container pb-[28px]">
                        <p class="primary-color font-semibold text-[13px]">Pacjent</p>
                        <div class="flex place-items-center gap-[14px]">
                            <p class="text-[26px] font-bold">{{ singleUser.name }} {{ singleUser.surname }}</p>
                        </div>
                        <div class="mt-[15px] gap-[5px] flex flex-col">
                            <p class="text-gray-500 text-[16px]">{{ singleUser.email }}</p>
                            <p class="text-gray-500 text-[16px]">111111111</p>
                            <p class="text-gray-500 text-[16px] -mt-[2px]">34 lata</p>
                        </div>
                        <div class="mt-[36px]">
                            <p class="text-[18px] font-semibold mb-[8px]">O pacjencie</p>
                            <div class="pr-[18px] border-scroll-container">
                                <p class="text-[16px]">
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
                                    incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                                    exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute
                                    irure
                                    dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
                                    pariatur.
                                    Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
                                    mollit anim id est laborum.
                                </p>
                            </div>
                        </div>
                        <div class="w-full mt-[36px]">
                            <p class="text-[18px] font-semibold mb-[13px]">Poprzednie wizyty</p>
                            <div class="max-h-[300px] overflow-y-auto border-scroll-container"
                                v-if="singleUser.visits.length > 0">
                                <div v-for="(single, index) in  singleUser?.visits" :key="index"
                                    class="w-full py-[18px] px-[18px] rounded-xl bg-[#f0f0f097]"
                                    :class="index === 0 ? 'mt-[0px]' : 'mt-[10px]'">
                                    <div class="flex justify-between place-items-center w-full">
                                        <p class="text-[14px] text-[#a1a1a1d5] -mt-[2px]">{{ single?.visit_details?.date }},
                                            {{ single?.visit_details?.start_time }} - {{ single?.visit_details?.end_time }}
                                        </p>
                                        <p class="text-[14px] text-[#888888d5]  -mt-[2px] font-medium">{{
                                            single?.visit_details.doctor.name }}</p>

                                    </div>
                                    <p class="text-[17px] text-[#4f4f4f] mt-[3px]">{{ single?.text }}</p>
                                </div>
                            </div>
                            <div v-else>
                                <p class="text-[#8b8b8b6a] font-bold text-[20px] -mt-[3px]">Brak wizyt</p>
                            </div>
                        </div>
                        <div class="w-full flex justify-start gap-[6px] mt-[40px]"
                            >
                            <Button class="primary-button">Edytuj pacjenta</Button>
                            <Button class="remove-button">Usuń</Button>
                        </div>
                        <!-- <pre>{{ singleUser.visits }}</pre> -->
                    </div>
                </Transition>
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
import { ref, onMounted } from 'vue';
import { useNuxtApp } from 'nuxt/app';

const axiosInstance = useNuxtApp().$axiosInstance as any;

const allPatient = ref({}) as any;
const singleUser = ref(null) as any;
const loading = ref(false);
const searchTerm = ref('');

const limit = 60;
let offset = 0;
let allLoaded = false;
let debounceTimeout: any = null;

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

const fetchSingleUser = async (id: number) => {
    try {
        const res = await axiosInstance.get(`/users/${id}`);
        singleUser.value = res.data;
    } catch (error) {
        console.error(error);
    }
};

onMounted(() => {
    fetchPatient();

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
.fade-slide-enter-active,
.fade-slide-leave-active {
    transition: all 0.25s ease-in-out;
}

.fade-slide-enter-from {
    opacity: 0;
    /* transform: translateX(-20px); */
}

.fade-slide-enter-to {
    opacity: 1;
    /* transform: translateX(0); */
}

.fade-slide-leave-from {
    opacity: 1;
    transform: translateX(0);
}

.fade-slide-leave-to {
    opacity: 0;
    /* transform: translateX(50px);  */
}
</style>
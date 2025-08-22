<template>
    <div class="w-full">
        <p class="text-[32px] font-semibold -mt-[8px] mb-[25px]">Dodaj pacjenta</p>

        <div class="flex w-full gap-[50px]">
            <div class="w-full relative select-none h-[450px]">
                <!-- <InputSearchSelect :key="selectPatientKey" v-model="selectPatient" :options="options"
                    placeholder="Wybierz pacjenta" @search="onSearch" />
                <p @click="showPatientInputs = !showPatientInputs"
                    class="primary-color underline cursor-pointer mt-[12px] mb-[24px] text-[15px]">
                    Wpisz ręcznie
                </p> -->
                <div class="w-full flex flex-col gap-[10px]">
                    <InputBase v-model="firstName" placeholder="Imię" />
                    <InputBase v-model="surName" placeholder="Nazwisko"/>
                    <InputBase v-model="email" placeholder="E-mail" />
                    <InputBase v-model="phone" placeholder="Telefon" />
                </div>
            </div>
            <div class="w-full flex flex-col gap-[10px]">
                    <textarea v-model="description" placeholder="O pacjencie..." class="add-description min-h-[170px]"></textarea>


                <div class="absolute bottom-[30px] right-[40px]">
                    <Button class="primary-button" @click="addPatient()">Dodaj</Button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useNuxtApp } from "nuxt/app";

const axiosInstance = useNuxtApp().$axiosInstance as any;

const selectPatient = ref<number | null>(null);
const selectPatientKey = ref(0); // wymusza remount InputSearchSelect
const options = ref<{ label: string; value: number }[]>([]);
const userData = ref<any>(null);

// pola formularza
const firstName = ref("");
const surName = ref("");
const email = ref("");
const phone = ref("");
const description = ref("")


function clearPatientInputs() {
    firstName.value = "";
    surName.value = "";
    email.value = "";
    phone.value = "";
    description.value = "";
}

const addPatient = async () => {

    const data = {
        name: firstName.value,
        surname: surName.value,
        phone: phone.value,
        email: email.value,
        // description: description.value,

    }

    try {
        const res = await axiosInstance.post('/add-patients', data);
        console.log('Wizyta dodana:', res.data);
        clearPatientInputs()

    } catch (err) {
        console.error('Błąd podczas dodawania wizyty:', err);
    }
}


</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
    transition: all 0.4s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
    opacity: 0;
    transform: translateY(-5px);
}

.fade-slide-enter-to,
.fade-slide-leave-from {
    opacity: 1;
    transform: translateY(0);
}
</style>
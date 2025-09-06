<template>
    <div class="w-full">
        <p class="text-[32px] font-semibold -mt-[8px] mb-[25px]">Dodaj pacjenta</p>

        <div class="flex w-full gap-[50px]">
            <div class="w-full relative select-none h-[450px]">
                <div class="w-full flex flex-col gap-[10px]">
                    <p class="text-[16px] font-semibold primary-color -mb-[2px]">Dane personalne</p>
                    <div class="flex gap-[10px]">
                        <InputBase v-model="firstName" name="name" placeholder="Imię" />
                        <InputBase v-model="surName" name="surname" placeholder="Nazwisko" />
                    </div>
                    <div class="flex gap-[10px]">
                        <InputBase v-model="age" name="wiek" placeholder="Wiek" />
                        <InputBase v-model="pesel" name="pesel" placeholder="PESEL" />
                    </div>
                    <p class="text-[16px] font-semibold primary-color -mb-[2px] mt-[24px] ">Rodzaj pacjenta</p>
                    <InputSelect v-model="patientType" :options="patientTypeOptions" placeholder="Wybierz rodzaj" />
                    <p class="text-[16px] font-semibold primary-color -mb-[2px] mt-[24px]">Zmieszkanie</p>
                    <div class="flex gap-[10px]">
                        <div class="w-[140px]">
                            <InputBase v-model="city_code" name="city_code" placeholder="Kod" />
                        </div>
                        <InputBase v-model="city" name="city" placeholder="Miejscowość" />
                    </div>
                    <InputBase v-model="street" name="street" placeholder="Nazwa ulicy oraz numer" />
                </div>
            </div>
            <div class="w-full flex flex-col gap-[10px]">
                <p class="text-[16px] font-semibold primary-color -mb-[2px]">Dane kontaktowe</p>
                <InputBase v-model="email" name="email" placeholder="E-mail" />
                <InputBase v-model="phone" name="phone" placeholder="Numer telefonu" />
                <p class="text-[16px] font-semibold primary-color mt-[24px] -mb-[2px]">Napisz coś o pacjencie</p>
                <textarea v-model="description" placeholder="O pacjencie..."
                    class="add-description min-h-[170px]"></textarea>
                <div class="absolute bottom-[30px] right-[40px]">
                    <div class="flex place-items-center gap-[21px]">
                        <Transition name="fade-slide">
                            <div v-if="isSuccess" class="flex place-items-center gap-[5px]">
                                <Icon name="ph:check-circle" size="28" class="text-[#37B342]" />
                                <p class="text-[18px] font-medium text-[#37B342]">Dodano pacjenta</p>
                            </div>
                        </Transition>
                        <LoadingButton :isLoading="isApiLoading" text="Dodaj pacjenta" @click="addPatient()" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const axiosInstance = useNuxtApp().$axiosInstance as any;
const { setErrors } = useErrors()

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
const isApiLoading = ref(false)

const patientTypeOptions = ref<{ value: string; label: string }[]>([
    { value: 'Prywatny', label: 'Prywatny' },
    { value: 'Klub gimnastyki', label: 'Klub gimnastyki' },
    { value: 'AWF', label: 'AWF' },
    { value: 'WKS', label: 'WKS' },
    { value: 'Od Grzegorza', label: 'Od Grzegorza' },
    { value: 'DK', label: 'DK' },
    { value: 'DT', label: 'DT' }
])

function clearPatientInputs() {
    firstName.value = "";
    surName.value = "";
    email.value = "";
    phone.value = "";
    city.value = "";
    city_code.value = "";
    street.value = "";
    pesel.value = "";
    description.value = "";
    age.value = "";
    patientType.value = "";
}

const addPatient = async () => {

    const data = {
        name: firstName.value,
        surname: surName.value,
        phone: phone.value,
        email: email.value,
        opis: description.value,
        wiek: age.value,
        rodzaj_pacjenta: patientType.value,
    }

    if (
        data.name &&
        data.surname &&
        data.phone
    ) {
        isApiLoading.value = true
        try {
            const res = await axiosInstance.post('/add-patients', data);
            isSuccess.value = true
            clearPatientInputs()
            setTimeout(() => {
                isSuccess.value = false
            }, 1800)
        } catch (err: any) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            }
        } finally {
            setTimeout(() => {
                isApiLoading.value = false
            }, 50)
        }
    }
}

</script>

<style scoped>
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
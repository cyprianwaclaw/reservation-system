<template>
    <div class="auth-background" @click="resetErrors()">
        <div class="form-container">
            <div v-if="isLogin">
                <p class="text-[36px] font-semibold mb-[16px]">Logowanie</p>
                <div v-if="errors.message" class="text-red-600 flex items-center gap-[4px] mb-4">
                    <Icon name="ph:warning-circle" size="25" />
                    <p>{{ errors.message }}</p>
                </div>
                <div class="flex flex-col gap-3">
                    <InputBase v-model="email" name="email" placeholder="Email" />
                    <InputBase type="password" name="password" v-model="password" placeholder="Hasło" />
                </div>

                <button class="reserve-button mt-4" @click="login">Zaloguj się</button>

                <div class="flex justify-end mt-5 cursor-pointer" @click="isLogin = false">
                    <p class="underline text-sm hover:text-[#959595]">
                        Nie pamiętam hasła
                    </p>
                </div>
            </div>
            <div v-else>
                <p class="text-[36px] font-semibold mb-[16px]">Nowe hasło</p>
                <div v-if="errors.message" class="text-red-600 flex items-center gap-2 mb-4">
                    <Icon name="ph:warning-circle" size="25" />
                    <p>{{ errors.message }}</p>
                </div>
                <div class="flex flex-col gap-3">
                    <InputBase v-model="email" name="email" placeholder="Email" />
                    <!-- <InputBase type="password" name="password" v-model="password" placeholder="Hasło" /> -->
                </div>

                <button class="reserve-button mt-4" @click="login">Zaloguj się</button>
                <div class="flex justify-end mt-5 cursor-pointer" @click="isLogin = true">
                    <p class="underline text-sm hover:text-[#959595]">
                        Logowanie
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const { resetErrors, setErrors } = useErrors()
const axiosInstance = useNuxtApp().$axiosInstance as any

const email = ref('')
const password = ref('')
const isLogin = ref(true)

onMounted(() => {
    resetErrors()
})

const login = async () => {
    try {
        const { data } = await axiosInstance.post('/doctor/login', {
            email: email.value,
            password: password.value,
        })

        if (data.token) {
            const token = useCookie('token')
            token.value = data.token

            return navigateTo('/api-week')
        }
    } catch (err: any) {
        setErrors(err.response?.data?.errors)
    }
}
</script>

<style scoped>
.auth-background {
    background: url("@/assets/images/login-hero.svg") center/cover no-repeat;
    height: 100vh;
    box-shadow: inset 0px 1000000px 4px rgba(0, 0, 0, 0.15);
}

.form-container {
    width: 450px;
    background: white;
    border-radius: 16px;
    position: absolute;
    top: 27vh;
    right: 14%;
    padding: 45px;
}
</style>
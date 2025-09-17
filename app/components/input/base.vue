<template>
    <div class="w-full relative">
        <div v-if="type === 'password'"
            @click="passwordType == 'password' ? passwordType = 'text' : passwordType = 'password'"
            class="absolute right-4 top-3 cursor-pointer password-icon">
            <Icon name="ph:eye" size="28" v-if="passwordType == 'password'" />
            <Icon name="ph:eye-slash" size="28" v-else />
        </div>

        <!-- <div v-if="name === 'phone'" class="absolute left-3.5 top-3 select-none">
            <div class="flex place-items-center gap-[5px]">
                <Icon name="ph:phone" size="27" :class="[isFocused ? 'text-[#31a9ce]' : 'text-[#cacaca]']" />
                <p class="mt-[2px] text-[17px]">+48 </p>
            </div>
        </div>
        <div v-if="name === 'email'">
            <Icon name="ph:envelope-simple" size="27" class="absolute left-3.5 top-3 select-none"
                :class="[isFocused ? 'text-[#31a9ce]' : 'text-[#cacaca]']" />
        </div> -->

    <div v-if="name === 'phone'" class="absolute left-3.5 top-3 select-none">
        <div class="flex place-items-center gap-[5px]">
            <Icon 
                name="ph:phone" 
                size="27" 
                :class="[
                    error ? 'text-[#f43737]' : isFocused ? 'text-[#31a9ce]' : 'text-[#cacaca]'
                ]" 
            />
            <p class="mt-[2px] text-[17px]">+48 </p>
        </div>
    </div>

    <div v-if="name === 'email'">
        <Icon 
            name="ph:envelope-simple" 
            size="27" 
            class="absolute left-3.5 top-3 select-none"
            :class="[
                error ? 'text-[#f43737]' : isFocused ? 'text-[#31a9ce]' : 'text-[#cacaca]'
            ]" 
        />
    </div>

        <input :type="passwordType" :class="[
            error ? 'base-input-error' : 'base-input',
            type == 'password' ? 'own-padding' : '',
            name === 'email' ? 'own-padding-left' : '',
            name === 'phone' ? 'own-padding-phone' : ''
        ]" :placeholder="placeholder" :disabled="disabled" v-model="localValue" @input="onInput"
            @focus="isFocused = true" @blur="isFocused = false" />

        <p v-if="error" class="text-[#f43737] text-[13px]">{{ error }}</p>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    modelValue: any;
    placeholder?: string;
    type?: string;
    name: string;
    disabled?: boolean;
}>()

const emit = defineEmits(["update:modelValue"]);
const { getError } = useErrors();

const localValue = ref(props.modelValue ?? "");
const error = computed(() => getError(props.name));
const passwordType = ref(props.type === "password" ? "password" : "text");
const isFocused = ref(false); // 🔹 do ikony telefonu

watch(() => props.modelValue, (val) => {
    localValue.value = val ?? "";
});

const formatPhone = (val: string) => {
    let digits = val.replace(/[^0-9]/g, "").slice(0, 9);
    return digits.replace(/(\d{3})(?=\d)/g, "$1 ").trim().slice(0, 11);
};

const formatCityCode = (val: string) => {
    let digits = val.replace(/[^0-9]/g, "").slice(0, 5);
    let formatted = digits;
    if (digits.length > 2) {
        formatted = digits.slice(0, 2) + "-" + digits.slice(2);
    }
    return formatted.slice(0, 6);
};

const onInput = (e: Event) => {
    const input = e.target as HTMLInputElement;
    let value = input.value;

    if (props.name === "phone") {
        value = formatPhone(value);
        setTimeout(() => {
            input.setSelectionRange(value.length, value.length);
        });
    }

    if (props.name === "wiek") {
        value = value.replace(/[^0-9]/g, "").slice(0, 2);
    }

    if (props.name === "name" || props.name === "surname") {
        value = value.replace(/[^a-zA-ZąćęłńóśżźĄĆĘŁŃÓŚŻŹ]/g, "");
    }

    if (props.name === "city") {
        value = value.replace(/[^a-zA-ZąćęłńóśżźĄĆĘŁŃÓŚŻŹ\s]/g, "");
    }

    if (props.name === "city_code") {
        value = formatCityCode(value);
        if (value.length === 3 && value.includes("-")) {
            setTimeout(() => {
                input.setSelectionRange(3, 3);
            });
        }
    }

    if (props.name === "pesel") {
        value = value.replace(/[^0-9]/g, "").slice(0, 11);
    }

    input.value = value;
    localValue.value = value;
    emit("update:modelValue", value);
};

watch(
    () => props.modelValue,
    (val) => {
        if (!val) return;
        let formatted = val;
        if (props.name === "phone") formatted = formatPhone(val);
        if (props.name === "city_code") formatted = formatCityCode(val);
        localValue.value = formatted;
    },
    { immediate: true }
);

</script>
<style scoped>
.own-padding {
    padding-right: 50px !important;
}

.own-padding-left {
    padding-left: 48px !important;
}
.own-padding-phone {
    padding-left: 79px !important;
}
.base-input {
    width: 100%;
    border-radius: 10px;
    border: 2px solid #dedede;
    padding: 12px 16px 12px 16px;
    transition: 0.25s all;
    outline: none;
    resize: none;
}

.base-input-error {
    width: 100%;
    border-radius: 10px;
    border: 2px solid #f43737;
    padding: 12px 16px 12px 16px;
    transition: 0.25s all;
    outline: none;
    background: rgba(244, 55, 55, 0.08);
    resize: none;
}

.base-input:focus {
    outline: none;
    border: 2px solid #31a9ce;
}
@media (max-width: 768px) {
 .base-input::placeholder {
    color: #9e9e9e;
    font-size: 16px;
} 
}
@media (min-width: 768px) {
.base-input::placeholder {
    color: #cacaca;
    font-size: 16px;
}
}

/* poprawione */
.base-input:disabled {
    background: #f2f2f2 !important;
    border: 2px solid #e0e0e0;
    cursor: not-allowed;
    color: #a1a1a1;
}

.password-icon {
    cursor: pointer;
    color: rgb(181, 181, 181);
    transition: all 0.2s;
}

.password-icon:hover {
    color: rgb(133, 133, 133);
}
</style>
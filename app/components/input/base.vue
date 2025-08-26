<template>
    <div class="w-full">
        <input type="text" :class="error ? 'base-input-error' : 'base-input'" :placeholder="placeholder"
            :disabled="disabled" v-model="localValue" @input="onInput" />
        <p v-if="error" class="text-[#f43737] text-[13px] mt-1">{{ error }}</p>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    modelValue: any;
    placeholder?: string;
    name: string;
    disabled?: boolean;
}>()

const emit = defineEmits(["update:modelValue"]);
const localValue = ref(props.modelValue ?? "");

const { getError } = useErrors();
const error = computed(() => getError(props.name));

watch(() => props.modelValue, (val) => {
    localValue.value = val ?? "";
});

const onInput = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (props.name === "phone") {
        input.value = input.value.replace(/[^1-9]/g, "").slice(0, 9);
    }
    if (props.name === "wiek") {
        input.value = input.value.replace(/[^1-9]/g, "").slice(0, 2);
    }
    localValue.value = input.value;
    emit("update:modelValue", input.value);
};
</script>
<style scoped>
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

.base-input::placeholder {
    color: #cacaca;
    font-size: 16px;
}

/* poprawione */
.base-input:disabled {
    background: #f2f2f2 !important;
    border: 2px solid #e0e0e0;
    cursor: not-allowed;
    color: #a1a1a1;
}
</style>
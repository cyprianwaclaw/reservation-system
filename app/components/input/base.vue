<template>
    <div class="w-full">
        <input :type="type" class="base-input" :placeholder="placeholder" :disabled="disabled"
            :readonly="readonly" v-model="localValue" />
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{
    modelValue: string | number | null;
    placeholder?: string;
    type?: string;
    disabled?: boolean;
    readonly?: boolean;
}>();

const emit = defineEmits(["update:modelValue"]);

const localValue = ref(props.modelValue ?? "");

// synchronizacja wartości z zewnątrz
watch(
    () => props.modelValue,
    (val) => {
        localValue.value = val ?? "";
    }
);

// emitowanie zmian
watch(localValue, (val) => {
    emit("update:modelValue", val);
});
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

.base-input:focus {
    outline: none;
    border: 2px solid #31a9ce;
}


/* poprawione */
.base-input:disabled {
  background: #f2f2f2 !important;
  border: 2px solid #e0e0e0;
  cursor: not-allowed;
  color: #a1a1a1;
}
</style>
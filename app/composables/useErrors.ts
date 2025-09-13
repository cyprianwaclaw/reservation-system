
export const errors = ref({}) as any

export function useErrors() {
    const setErrors = (newErrors: Record<string, string[]>) => {
        errors.value = newErrors || {}
    }

    const getError = (field: string): string | null => {
        return errors.value[field]?.[0] ?? null
    }

    const hasError = (field: string): boolean => {
        return !!errors.value[field]?.length
    }

    const clearError = (field: string) => {
        if (errors.value[field]) delete errors.value[field]
    }

    const resetErrors = () => {
        errors.value = {}
    }

    return {
        errors,
        setErrors,
        getError,
        hasError,
        clearError,
        resetErrors
    }
}
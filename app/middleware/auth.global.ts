export default defineNuxtRouteMiddleware((to, from) => {
    const token = useCookie('token').value

    if (to.path === '/') {
        return
    }

    if (to.path === '/logowanie') {
        if (token) {
            return navigateTo('/api-week')
        }
        return
    }
    
    if (!token) {
        return navigateTo('/logowanie')
    }
})
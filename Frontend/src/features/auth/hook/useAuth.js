import { useDispatch } from "react-redux";
import { register, login, getMe } from "../service/auth.api";
import { setUser, setLoading, setError } from "../auth.slice";

export function useAuth() {
    const dispatch = useDispatch()

    async function handleRegister({ email, username, password }) {
    dispatch(setLoading(true))
    dispatch(setError(null))
    try {
        const data = await register({ email, username, password })
        return data
    } catch (error) {
        // Handle both validator errors array and single message errors
        const validatorErrors = error.response?.data?.errors
        const msg = validatorErrors
            ? validatorErrors[0]?.msg
            : error.response?.data?.message || "Registration failed"
        dispatch(setError(msg))
        throw error
    } finally {
        dispatch(setLoading(false))
    }
}

    async function handleLogin({ email, password }) {
        dispatch(setLoading(true))
        dispatch(setError(null))
        try {
            const data = await login({ email, password })
            dispatch(setUser(data.user))
            return data
        } catch (error) {
            const msg = error?.response?.data?.message || 'Login failed'
            dispatch(setError(msg))
            throw error   // ← re-throw so Login.jsx can handle it too
        } finally {
            dispatch(setLoading(false))
        }
    }

    async function handleGetMe() {
        dispatch(setLoading(true))
        try {
            const data = await getMe()
            dispatch(setUser(data.user))
        } catch (error) {
            dispatch(setError(error?.response?.data?.message || 'Failed to fetch user'))
        } finally {
            dispatch(setLoading(false))
        }
    }

    return {
        handleRegister,
        handleLogin,
        handleGetMe
    }
}
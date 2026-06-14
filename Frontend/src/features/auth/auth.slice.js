import { createSlice } from "@reduxjs/toolkit";

const authSlice=createSlice({
    name:"auth",
    initialState:{
        user:null,
        loading:true,
        error:null
        
    },
    reducers:{
        setUser:(state,action)=>{
            state.user=action.payload     //action.payload=data.user
        },
        setLoading:(state,action)=>{
            state.loading=action.payload
        },
        setError:(state,action)=>{
            state.error=action.payload
        },
         clearUser: (state) => {        // ← add this
            state.user = null
            state.error = null
        }
    }
})

export const {setError,setLoading,setUser,clearUser} =authSlice.actions
export default authSlice.reducer

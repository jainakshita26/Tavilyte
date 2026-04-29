import { RouterProvider } from "react-router"
import { router } from "./app.routes"
//everytime we reload the logged in user went and we have to login again
import { useAuth } from "../features/auth/hook/useAuth"
import { useEffect } from "react"



function App() {
    const auth=useAuth()
    useEffect(()=>{
        auth.handleGetMe()
    },[])
 return (
  <RouterProvider router={router} />
 )
}

export default App

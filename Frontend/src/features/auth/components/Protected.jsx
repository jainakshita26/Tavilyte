//to see if loading and if user is login or not if not send to login page

import React from 'react'
import {useSelector} from 'react-redux'
import {Navigate} from 'react-router'

const Protected = ({children}) => {
  const user=useSelector(state=>state.auth.user)
  const loading=useSelector(state=>state.auth.loading)

  if(loading){
    return <div>Loading...</div>
  }

  if(!user){
    return <Navigate to='/login' replace/>
  }


  return children
}

export default Protected
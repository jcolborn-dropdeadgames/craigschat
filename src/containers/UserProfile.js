import React, {Component} from 'react'
import {connect} from 'react-redux'
import { Card, Avatar, Button } from '@material-ui/core';

import {firebaseAuth} from '../config/firebase'
import { userLogout } from '../store/users/actions';

class UserProfile extends Component {  
  deleteAccount = async () => {
    const {credential} = await firebaseAuth.signInWithPopup(require('../config/firebase')[this.props.user.loginUser.provider.split('.')[0] + 'Provider'])
    
    await firebaseAuth.currentUser.reauthenticateAndRetrieveDataWithCredential(credential)
    await firebaseAuth.currentUser.delete()
    await this.props.logout()
  }
  
  render() {
    const {loginUser} = this.props.user

    return loginUser ? (
      <div className="App" style={{height: '100vh'}}>
        <div style={{width: '100%', paddingTop: 80}}>
          <Card style={{display: 'flex', padding: 20, flexDirection: 'row', margin: 'auto', maxWidth: 700}}>
            <Avatar style={{width: '75px', height: '75px', marginRight: 40, top: 0}} src={loginUser.photoUrl} />
            <div style={{textAlign: 'left'}}>
              <h2 style={{margin: 5, marginLeft: 0}}>{loginUser.name}</h2>
              <div>{loginUser.email}</div>
            </div>
          </Card>

          <Button style={{color: 'red'}} onClick={this.deleteAccount}>Delete Account</Button>
        </div>
      </div>
    ) : null
  }
}

const mapStateToProps = state => ({
  user: state.users || {}
})

const mapDispatchToProps = (dispatch) => ({
  logout: () => dispatch(userLogout())
})

export default connect(mapStateToProps, mapDispatchToProps)(UserProfile)

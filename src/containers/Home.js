import React, { Component } from 'react';
import {Link} from 'react-router-dom'
import { connect } from 'react-redux';
import '../App.css';
import { firebaseDb } from '../config/firebase.js';
import { withRouter } from 'react-router-dom';
import ListCard from '../components/ListCard';
import { Typography, Paper, Card, CardContent, CardActionArea, Grid, Hidden, withStyles } from '@material-ui/core';

class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: "",
      id: "",
      description : "",
      chatRooms: [],
      display: ''
    }

    this.onGoToChatButtonClick = this.onGoToChatButtonClick.bind(this);
  }

  componentDidMount() {
    firebaseDb.ref('chatrooms').on('child_added', (snapshot) => {
      const ctr = snapshot.val()
      const chatrooms = this.state.chatRooms

      chatrooms.push({
        id: ctr.id,
        owner : ctr.owner,
        title: ctr.title,
        tags: ctr.tags,
        place: ctr.place,
        description : ctr.description,
        roommembers: ctr.roommembers,
        archived: ctr.archived
      })

      this.setState({
        chatRooms : chatrooms
      });
    })
  }

  onGoToChatButtonClick(id) {
    this.props.history.push(`/chatroom/${id}`);
  }

  render() {
    const {loginUser: user = {}} = this.props.user
    const {chatRooms} = this.state

    const ownedRooms = chatRooms.filter(({owner}) => user && owner.id === user.id)
    const joinedRooms = chatRooms.filter(({roommembers}) => user && roommembers[user.id])
    
    return (
      <div className="App" style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%'}}>
        <div style={{
          paddingTop: 50, 
          height: 350,
          backgroundImage: 'url(https://static.vecteezy.com/system/resources/previews/000/266/247/large_2x/multicultural-communities-vector.jpg)',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'contain',
          backgroundPosition: '20%',
          display: 'flex',
          justifyContent: 'flex-end'}}>
          <div className={this.props.classes.jumbotronContents}>
            <Typography style={{fontSize: 50, fontWeight: 700}}>Chat. Build Community.</Typography>
            <Typography style={{fontSize: 17, fontWeight: 200, color: 'gray'}}>This service operates only in Tokyo now in Beta</Typography>
            <Card style={{marginTop: 25}}>
              <CardActionArea style={{height: '100%'}}>
                <CardContent style={{display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                  <Typography style={{display: 'flex', justifyContent: 'flex-start', fontSize: '20px', textAlign: 'start', fontWeight: 600}}>Come to say Hi and ask us any questions!</Typography>
                  <Typography style={{display: 'flex', justifyContent: 'flex-start', fontSize: '15px', textAlign: 'start', fontWeight: 200}}>Your feedback is really appreciated!</Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </div>
        </div>
        <div style={{width: '100%', paddingTop: 20}}>
          <Grid container style={{display: 'flex', justifyContent: 'center'}}>
            <Hidden mdDown>
              <Grid item xs={12} sm={12} md={4} lg={2} style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                <div style={{width: '95%', marginTop: '10px', position: 'sticky', top: '50px'}}>
                  {user && (
                    <Paper style={{padding: 18}}>
                      <div style={{display: 'flex', alignItems: 'flex-end', padding: 3}} onClick={() => this.setState({display: 'owner'})}>
                        <Typography style={{fontSize: 20, marginRight: 10}}>{ownedRooms.length}</Typography>
                        <Typography style={{fontSize: 12, fontWeight: 100, color: 'gray', paddingBottom: 3}}>Chatrooms you own</Typography>
                      </div>
                      <div style={{display: 'flex', alignItems: 'flex-end', padding: 3}} onClick={() => this.setState({display: 'joined'})}>
                        <Typography style={{fontSize: 20, marginRight: 10}}>{joinedRooms.length}</Typography>
                        <Typography style={{fontSize: 12, fontWeight: 100, color: 'gray', paddingBottom: 3}}>Chatrooms you joined</Typography>
                      </div>
                    </Paper>
                  )}
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: '15px'}}>
                    <Link to="/" style={{fontSize: 15, fontWeight: 100, color: 'gray', textDecoration: 'none', padding: 3}}>About</Link>
                    <Link to="/" style={{fontSize: 15, fontWeight: 100, color: 'gray', textDecoration: 'none', padding: 3}}>Terms and Conditions</Link>
                    <Link to="/" style={{fontSize: 15, fontWeight: 100, color: 'gray', textDecoration: 'none', padding: 3}}>Privacy Policy</Link>
                    <div style={{fontSize: 15, fontWeight: 100, color: 'gray', padding: 3, textAlign: 'start'}}>Graphics Provided by <a href="https://www.Vecteezy.com" style={{textDecoration: 'none'}}>Vecteezy.com</a></div>
                  </div>
                </div>
                
              </Grid>
            </Hidden>

            <Grid item xs={12} sm={12} md={12} lg={8} style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              <Grid container> 
                {(this.state.display === 'owner' ? ownedRooms : this.state.display === 'joined' ? joinedRooms : this.state.chatRooms).map((chatroom, id) => {
                  if(!chatroom.archived) {
                    return (
                      <Grid item xs={12} sm={6} md={4} lg={4} key={id} style={{display: 'flex', justifyContent: 'center'}}>
                        <ListCard
                          key={id}
                          onClick={() => this.onGoToChatButtonClick(chatroom.id)}
                          {...chatroom}
                        />
                      </Grid>
                    )
                  }
                  return null
                })}

                {(this.props.user.loginUser) ? <div style={{marginBottom: '20px'}}>
                  <Link to="/new/chatroom"></Link>
                </div> : null}
              </Grid>
            </Grid>  

          </Grid>
        </div>
      </div>
    );
  }
}
const styles = theme => ({
  jumbotronContents: {
    paddingTop: 30,
    paddingLeft: '2%',
    paddingRight: '2%',
    justifyContent: 'center',
    [theme.breakpoints.down('sm')]: {
      marginRight: '0%',
    },
    [theme.breakpoints.up('md')]: {
      marginRight: '10%',
    },
    [theme.breakpoints.up('lg')]: {
      marginRight: '13%',
    },
  }
})

const mapStateToProps = (state) => ({
  user: state.users
})

const mapDispatchToProps = (dispatch) => ({
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(Home)));

import React, { Component } from 'react';
import moment from 'moment';
import { firebaseDb } from '../config/firebase.js';
import CustomUploadButton from 'react-firebase-file-uploader/lib/CustomUploadButton';
import { firebaseStorage } from '../config/firebase.js';
import {Picker} from 'emoji-mart'
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Avatar from '@material-ui/core/Avatar';
import Hidden from '@material-ui/core/Hidden';
import { Badge, withStyles, CircularProgress, Popover } from '@material-ui/core';
import EmojiIcon from '@material-ui/icons/SentimentSatisfiedAlt';
import PhotoIcon from '@material-ui/icons/AddAPhoto';
import IconButton from '@material-ui/core/IconButton';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import InfiniteScroll from 'react-infinite-scroller';
import ChatRoomDetails from '../components/ChatRoomDetails';
import ChatRoomEvents from '../components/ChatRoomEvents';

import 'emoji-mart/css/emoji-mart.css'

import MessageBubble from '../components/MessageBubble'
import getProfile from '../hocs/ProfileCache.js';

const CHUNK_SIZE = 20

const styles = theme => ({
  badge: {
    top: 20,
    right: -20,
    height: 10,
    width: 10
  },
})

class ChatRoom extends Component {
  constructor(props) {
    super(props);

    this.state = {
      emojiAnchor: null,
      text : "",
      messages : [],
      currentRoomMembers: [],
      initialMessagesLength: null,
      events: [],
      imageUploading: false
    }

    this.onTextChange = this.onTextChange.bind(this);
    this.onButtonClick = this.onButtonClick.bind(this);
  }

  componentDidMount() {
    const {id: chatRoomId} = this.props.match.params;

    this.eventsRef = firebaseDb.ref("events/" + chatRoomId);

    this.eventsRef.orderByChild("sortDate").on("value", snapshot => {
      if (snapshot.val()) {
        let events = [];
        snapshot.forEach(function (child) {
          const item = child.val()
          events.push({
            date: item.date,
            title: item.title,
            venue: item.venue,
            eventId: item.id,
            details: item.details,
            dateString: item.dateString
          })
        });

        this.setState({
          events
        })
      } else {
        this.setState({events:[]})
      }
    });

    this.messagesRef = firebaseDb.ref('messages/' + chatRoomId)
    
    this.messagesRef.once('value', (snapshot) => { 
      this.setState({ initialMessagesLength: snapshot.numChildren()}, () => (this.messagesEnd) ? this.messagesEnd.scrollIntoView({behavior: "instant"}) : null)
    })

    this.messagesRef.limitToFirst(1).once('value', (snapshot) => {
      this.setState({firstMessageId: Object.keys(snapshot.val() || {})[0]})
    })

    this.messagesRef.limitToLast(CHUNK_SIZE).once('value', (snapshot) => { 
      this.setState({messages: Object.values(snapshot.val() || {})}, () => {
        this.messagesRef.on('child_added', (snapshot) => {
          const m = snapshot.val()
          if (this.state.messages[this.state.messages.length - 1] && m.id <= this.state.messages[this.state.messages.length - 1].id) return
          let msgs = this.state.messages
    
          this.setState({
            messages : msgs.concat(m)
          }, () => {
            if (this.messagesEnd) this.messagesEnd.scrollIntoView({behavior: "instant"})
          })
          // new Audio("https://firebasestorage.googleapis.com/v0/b/craigschat-230e6.appspot.com/o/water-drop2.mp3?alt=media&token=9573135c-62b9-40ae-b082-61f443d39a87").play()
        })
      })
    })

    this.messagesRef.on('child_removed', snapshot => {
      const m = snapshot.val()

      this.setState(({messages}) => ({
        messages: messages.filter(msg => msg.id !== m.id)
      }))
    })

    firebaseDb.ref('chatrooms/' + chatRoomId).on('value', (snapshot) => {
      this.setState({chatroom: snapshot.val()})
    })

    // fetch currect roomMembers before DOM is mounted and set them to currentRoomMembers state
    firebaseDb.ref('chatrooms/' + chatRoomId + '/roommembers/').on('child_added', (snapshot) => { 
      const m = snapshot.val() 
      let crms = this.state.currentRoomMembers

      crms.push({
        id: m.id,
        name: m.name,
        photoUrl: m.photoUrl
      })
      
      this.setState({currentRoomMembers: crms}) 
    })
  }

  componentWillUnmount() {
    this.messagesRef.off()
    this.eventsRef.off()
  }

  componentDidUpdate(_, prevState) {
    if (
      (!prevState.messages[prevState.messages.length - 1]) ||
      (this.state.messages[this.state.messages.length - 1] && prevState.messages[prevState.messages.length - 1].id < this.state.messages[this.state.messages.length - 1].id)) {
      if (this.messagesEnd) this.messagesEnd.scrollIntoView({behavior: "instant"})
    }
  }

  loadEarlier = () => {
    if (this.loadingEarlier) return
    this.loadingEarlier = true

    const {id: chatRoomId} = this.props.match.params

    const head = this.messageHead
    
    firebaseDb.ref('messages/' + chatRoomId)
      .orderByKey()
      .limitToLast(CHUNK_SIZE)
      .endAt(this.state.messages[0].id)
      .once('value', (snapshot) => {
        this.setState(
          ({messages}) => ({messages: Object.values(snapshot.val()).concat(messages.slice(1))}),
          () => {
            head.scrollIntoView({behaviour: 'instant'})
          }
        )
        this.loadingEarlier = false
      })
  }

  deleteMessage = (msg) => {
    return this.messagesRef.child(msg.id).remove()
  }

  deleteChatroom = chatroom => {
    firebaseDb.ref('chatrooms/' + chatroom.id).remove(
      this.props.history.push('/')
    )
  }

  deleteEvent = id => {
    const chatRoomId = this.props.match.params.id;
    firebaseDb.ref("events/" + chatRoomId).child(id)
      .remove()
  }

  updateEvent = event => {
    const chatRoomId = this.props.match.params.id;
    this.props.history.push("/event/" + chatRoomId, event)
  }

  onTextChange(e) {
    this.setState({
      text : e.target.value,
    });
  }

  handleUploadStart = () => {
    this.setState({ imageUploading: true })
  }

  handleUploadError = () => {
    this.setState({ imageUploading: false })
    alert('Upload failed. Please try again.')
  }

  handleUploadSuccess = filename => {
    firebaseStorage
    .ref('messageImage')
    .child(filename)
    .getDownloadURL()
    .then(photoUrl => {
      console.log("*", photoUrl)
      const key = firebaseDb.ref('messages/').push().key;
      const chatRoomId = this.props.match.params.id;
      const guest = {
        name: "Guest",
        photoUrl: "https://image.flaticon.com/icons/svg/145/145849.svg"
      }
      firebaseDb.ref('messages/' + chatRoomId + '/' + key).set({
        "id": key,
        "user" : (this.props.user) ? this.props.user : guest,
        "image" : photoUrl,
        "timestamp": moment().toISOString()
      })
      this.setState({ imageUploading: false }
    )
  })}

  onButtonClick(e) {
    e.preventDefault();
    const chatRoomId = this.props.match.params.id;

    if (this.state.text === "") {
      alert('Please add comment!')
      return
    }

    const key = firebaseDb.ref('messages/').push().key;
    const guest = {
      name: "Guest",
      photoUrl: "https://image.flaticon.com/icons/svg/145/145849.svg"
    }

    firebaseDb.ref('messages/' + chatRoomId + '/' + key).set({
      "id": key,
      "user" : (this.props.user) ? this.props.user : guest,
      "text" : this.state.text,
      "timestamp": moment().toISOString()
    })

    const crm = this.state.currentRoomMembers;

    // if currentRoomMembers is null, save the user to the db
    if (!crm) {
      firebaseDb.ref('chatrooms/' + chatRoomId + '/roommembers/' + this.props.user.id).set(this.props.user)
    } else {
      // if the user is guest, do nothing
      if (!this.props.user) {
        console.log("guest user!")
      // if the user is NOT existed in currentRoomMembers stets, add the user to the db
      } else if (this.props.user.id in crm === false) {
        console.log("user NOT existed!")
        firebaseDb.ref('chatrooms/' + chatRoomId + '/roommembers/' + this.props.user.id).set(this.props.user)
      } 
    }

    this.setState({userName: "", text: ""})
  }

  toggleEmoji = e => {
    if (!this.state.emojiAnchor) {
      this.setState({emojiAnchor: e.currentTarget})
    } else {
      this.setState({emojiAnchor: null})
    }
  }

  render() {
    return (
      <div className="App" style={{height: '100%'}}>
        <Grid container style={{height: '100%', position: 'fixed'}}> 
          
          <Hidden xsDown>
            <Grid item sm={2} md={2} lg={2} style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              <div style={{display: 'flex', flexDirection: 'column', paddingTop: '70px', maxWidth: '80%'}}>
                {this.state.currentRoomMembers.map((m) => 
                  getProfile(m.id, user => (
                    (user.deleted) ? 
                    null :
                    <Badge badgeContent="" color={user.online ? 'primary' : 'error'} classes={{ badge: this.props.classes.badge }}>
                      <div key={user.id} style={{display: 'flex', alignItems: 'center', margin: '5px'}}>
                        <Avatar alt="user avatar" src={user.photoUrl} style={{marginRight: '10px',  width: '2rem', height: '2rem'}}/>
                        <div style={{wordBreak: 'break-all', fontSize: '0.9rem'}}>{user.name}</div>
                      </div>
                    </Badge>
                  )
                ))}
                <Link to="/" style={{marginTop: '15px'}}>Back to Home</Link>
              </div>
            </Grid>
          </Hidden>

          <Grid item xs={12} sm={10} md={7} lg={7} style={{paddingTop: '55px', display: 'flex', flexDirection: 'column', alignItems: 'center', maxHeight: '100%'}}>
            <div id="chatbox" style={{height: '90%', width: '100%', overflow: 'auto'}}>
              <InfiniteScroll
                pageStart={0}
                loadMore={this.loadEarlier}
                hasMore={this.state.messages[0] && this.state.messages[0].id > this.state.firstMessageId}
                loader={<div className="loader" key={0}><CircularProgress /></div>}
                threshold={50}
                useWindow={false}
                initialLoad={false}
                isReverse
              >
                {this.state.messages.map((m, i) => 
                  <div key={m.id} ref={(el) => { if (i === 0) {this.messageHead = el}; this.messagesEnd = el; }}><MessageBubble user={this.props.user} message={m} onDelete={this.deleteMessage}/></div>
                )}
              </InfiniteScroll>
            </div>
            <form onSubmit={this.onButtonClick} autocomplete="off" style={{display: 'flex', flexDirection: 'center', alignItems: 'center', width: '90%'}}>
              <TextField
                id="comment-box"
                margin="normal"
                variant="outlined"
                onChange={this.onTextChange}
                value={this.state.text}
                style={{width: '100%', height: '3rem', marginTop: '8px'}}
              />
              
              <div style={{display: 'flex', paddingLeft: '10px'}}>
                <IconButton aria-label="Edit Details" onClick={this.toggleEmoji}>
                  <EmojiIcon />
                </IconButton>
                <Popover
                  open={Boolean(this.state.emojiAnchor)}
                  anchorEl={this.state.emojiAnchor}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                  }}
                  transformOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                  }}
                  onClose={this.toggleEmoji}
                >
                  <Picker onSelect={({native}) => this.setState(({text}) => ({text: text + native}))} native/>
                </Popover>

                <CustomUploadButton
                  accept="image/*"
                  storageRef={firebaseStorage.ref('messageImage')}
                  onUploadStart={this.handleUploadStart}
                  onUploadError={this.handleUploadError}
                  onUploadSuccess={this.handleUploadSuccess}
                  onProgress={this.handleProgress}
                  style={{display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'gray'}}
                >
                  {(this.state.imageUploading) ? <CircularProgress size={20} /> : <PhotoIcon />}
                </CustomUploadButton>
                
              </div>
            </form>
          </Grid>

          <Hidden smDown>
            <Grid item md={3} lg={3} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 50, paddingBottom: 40}}>
              <div style={{width: '90%', height: '50%', overflow: 'auto'}}>
                  <ChatRoomDetails
                    chatroom={this.state.chatroom}
                    onDelete={this.deleteChatroom}
                    editable={(this.props.user && this.props.user.id) === (this.state.chatroom && this.state.chatroom.owner.id)}
                    onEdit={() => this.props.history.push(`${this.props.location.pathname}/edit`)}
                    onCreateEvent={(chatroom) => this.props.history.push(`/event/${this.props.match.params.id}`)}
                  />
              </div>
              <div style={{width: '90%', height: '50%', overflow: 'auto'}}>
              <ChatRoomEvents
                  events={this.state.events}
                  editable={
                    (this.props.user && this.props.user.id) ===
                    (this.state.chatroom && this.state.chatroom.owner.id)
                  }
                  onDelete={this.deleteEvent}
                  onUpdate={this.updateEvent}
                />
              </div>
            </Grid>
          </Hidden>
        </Grid>
         
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.users.loginUser
})

const mapDispatchToProps = (dispatch) => ({
})

export default withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(ChatRoom));

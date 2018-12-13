import React, { Component } from 'react';
import { firebaseAuth, googleProvider, githubProvider } from '../config/firebase.js';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import { withRouter, Link } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
import Avatar from '@material-ui/core/Avatar';
import Fab from '@material-ui/core/Fab';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';

class Header extends Component {
  constructor(props) {
    super(props);
    this.state = { anchorEl: null }

    this.logout = this.logout.bind(this);
    this.onClickMenuOpen = this.onClickMenuOpen.bind(this);
    this.onClickMenuClose = this.onClickMenuClose.bind(this);
    this.renderButtons = this.renderButtons.bind(this);
  }

  googleLogin() {
    firebaseAuth.signInWithRedirect(googleProvider);
    // need to show an error message when fails
  }

  githubLogin() {
    firebaseAuth.signInWithRedirect(githubProvider);
    // need to show an error message when fails
  }

  logout() {
    firebaseAuth.signOut();
    this.props.history.push('/');
  }

  onClickMenuOpen(event) {
    this.setState({anchorEl: event.currentTarget})
  }

  onClickMenuClose() {
    this.setState({anchorEl: null})
  }

  renderButtons() {
    if (!this.props.user) {
      return (
        <div>
          <Button
            aria-owns={this.state.menuOpen ? 'simple-menu' : undefined}
            aria-haspopup="true"
            onClick={this.onClickMenuOpen}
            variant="outlined"
            size="small"
            disableRipple
            style={{textTransform: 'none', fontWeight: 800, border: '2px solid rgba(0, 18 ,31 ,0.7)', color: 'rgba(0, 18 ,31 ,0.7)'}}
          >
            Signin / Login
          </Button>
          <Menu
            id="simple-menu"
            anchorEl={this.state.anchorEl}
            open={Boolean(this.state.anchorEl)}
            onClose={this.onClickMenuClose}
          >
            <MenuItem onClick={this.googleLogin}>Signin/Login with Google</MenuItem>
            <MenuItem onClick={this.githubLogin}>Signin/Login with Github</MenuItem>
          </Menu>
        </div>
      )
    } else {
      return (
        <div>
          <Link to="/new/chatroom">
            <Button
              variant="outlined"
              size="small"
              disableRipple
              color="secondary"
              style={{textTransform: 'none', marginRight: 10, fontWeight: 800, border: '2px solid rgba(245, 0, 87, 0.5)'}}
            >
              Create a Room
            </Button>
          </Link>
          <Button
            aria-owns={this.state.menuOpen ? 'simple-menu' : undefined}
            aria-haspopup="true"
            onClick={this.logout}
            variant="outlined"
            size="small"
            disableRipple
            style={{textTransform: 'none', marginRight: 15, fontWeight: 800, border: '2px solid rgba(0, 18 ,31 ,0.7)', color: 'rgba(0, 18 ,31 ,0.7)'}}
          >
            Logout
          </Button>
          <Fab size='small' disableRipple>
            <Avatar 
              alt="user avatar"
              src={this.props.user.photpUrl}
            />
          </Fab>
        </div>
      )
    }
  }

  render() {
    return (
      <AppBar position="fixed" color="default">
      <Toolbar variant="dense" style={{display: 'flex', justifyContent: 'space-between'}} className={this.props.classes.toolbar}>
        <div style={{display: 'flex', alignItems: 'center'}}>
          NoNameYet
        </div>

        <div style={{display: 'flex'}}>
          {this.renderButtons()}
        </div>
      </Toolbar>
    </AppBar>
    )
  }
}

const styles = theme => ({
  toolbar: {
    // padding: theme.spacing.unit,
    [theme.breakpoints.down('sm')]: {
      paddingLeft: '1rem', paddingRight: '1rem'
    },
    [theme.breakpoints.up('lg')]: {
      paddingLeft: '8rem', paddingRight: '8rem'
    },
  },
});

export default withRouter(withStyles(styles)(Header));

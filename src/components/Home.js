import React, { Component } from 'react';
import socketIOClient from "socket.io-client";
import md5 from 'md5';
import '../App.css';
import {WEBRTC_SERVER, SIGNALING_SERVER_PRO, SIGNALING_SERVER_DEV} from '../shared/constants'

let SESSION_STATUS = window.Flashphoner.constants.SESSION_STATUS;
let STREAM_STATUS = window.Flashphoner.constants.STREAM_STATUS;

let stream;
let socket;

export default class Home extends Component{
  constructor(props) {
    super(props);

    this.state = {
      publishing : false,
      minutes: 0,
      seconds: 0,
      millis: 0,
      running: false
    }

    this._handleStartClick = this._handleStartClick.bind(this);
    this._handleStopClick = this._handleStopClick.bind(this);
    this._handleResetClick = this._handleResetClick.bind(this);
    
    let signaling  = window.location.host === "911.video" ?  SIGNALING_SERVER_PRO : SIGNALING_SERVER_DEV;
    
    console.log("signaling server", signaling);

    socket = socketIOClient(signaling);
  }

  async componentDidMount(){
      const user = JSON.parse(localStorage.getItem('user'));
      if(!user){
        this.props.history.goBack();
      }

      this.setState({user : user});

      try {
          console.log("flashphoner", window.Flashphoner);

          window.Flashphoner.init({flashMediaProviderSwfLocation: '../../public/assets/media-provider.swf'});
      } catch (e) {
          alert("Your browser doesn't support Flash or WebRTC technology needed for this example");
          return;
      }

      await navigator.geolocation.getCurrentPosition((position)=>{
        if(position){
            this.setState({position : position});
        }
      });
  }

  _handleStartClick(event) {
    if (!this.state.running) {
        this.interval = setInterval(() => {
            this.tick();
        }, 100)

        this.setState({running: true})
    }
}

_handleStopClick(event) {        
    if (this.state.running) {
        clearInterval(this.interval);
        this.setState({running: false})
    }
}

_handleResetClick(event) {
    this._handleStopClick();
    this.update(0, 0, 0);
}

tick() {
    let millis = this.state.millis + 1;
    let seconds = this.state.seconds;
    let minutes = this.state.minutes;

    if (millis === 10) {
        millis = 0;
        seconds = seconds + 1;
    }

    if (seconds === 60) {
        millis = 0;
        seconds = 0;
        minutes = minutes + 1;
    }

    this.update(millis, seconds, minutes);
}

zeroPad(value) {
    return value < 10 ? `0${value}` : value;
}

update(millis, seconds, minutes) {
    this.setState({
        millis: millis,
        seconds: seconds,
        minutes: minutes
    });
}

  loginByPhone =($event)=>{
      $event.preventDefault();
      this.props.history.push('/home');
  }

  getConstraints = ()=>{
    let constraints = {
      audio : true,
      video : true
    }

    constraints.video = {
      width: { min: 640, ideal: 1920, max: 1920 },
      height: { min: 400, ideal: 1080 },
      facingMode: { exact: "environment" }
    }

    return constraints;
  }

  live = ()=>{
    this.setState({publishing : true, loading : true});
    this._handleStartClick();
    let _this = this;
    navigator.mediaDevices.getUserMedia(_this.getConstraints()).then(function(mediaStream) {
        try{
          let id =  md5(WEBRTC_SERVER);
          let stname = id;
          if (window.Flashphoner.getSessions().length > 0) {
              var session = window.Flashphoner.getSessions()[0];
              if (session.getServerUrl() === WEBRTC_SERVER) {
                    alert("sesssion already loaded");
                    session.createStream({
                      name: stname,
                      display: document.getElementById("local-video"),
                      record: true,
                      receiveVideo: false,
                      receiveAudio: false,
                      constraints:_this.getConstraints()
                    }).on(STREAM_STATUS.PUBLISHING, async function (stream) {
                      _this.setState({ publishing : true, loading:false});
                    }).on(STREAM_STATUS.UNPUBLISHED, function (stream) {
                    }).on(STREAM_STATUS.FAILED, function (stream) {
                    }).publish();
              
              return;
            } 
          }
    
          window.Flashphoner.createSession({ urlServer:WEBRTC_SERVER}).on(SESSION_STATUS.ESTABLISHED, function (session) {
            alert(SESSION_STATUS.ESTABLISHED);
            try{
                
              session.createStream({
                    name: stname,
                    display: document.getElementById("local-video"),
                    record: true,
                    receiveVideo: false,
                    receiveAudio: false,
                    constraints:_this.getConstraints()
                }).on(STREAM_STATUS.PUBLISHING, async function (stream) {
                  alert(STREAM_STATUS.PUBLISHING);
                 this.setState({publishing : true, loading : false});

                }).on(STREAM_STATUS.UNPUBLISHED, function (stream) {
                  alert(STREAM_STATUS.UNPUBLISHED);
                }).on(STREAM_STATUS.FAILED, function (stream) {
                  alert(STREAM_STATUS.FAILED);
                }).publish();

            }catch(e){alert(e.message)}
        }).on(SESSION_STATUS.CONNECTED, function (session) {
            _this.setState({ publishing : true, loading:false});
            alert(SESSION_STATUS.CONNECTED);
            let data = {
              type : "stream::started",
              user: "hello@fastcodelab.com",
              username: "fastcode",
              stname: stname,
              token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiY3Zhc3F1ZXpkZXZAZ21haWwuY29tIiwiaWF0IjoxNTY0Njc3MTAwfQ.nwJfsLJhrFPPGNhWxuxcJybaI5Uwt6axSKbL-877smw",
              ws_url: (WEBRTC_SERVER + stname),
              phone: _this.state.user.phone,
              device: "webapp",
              is911: _this.state.is911,
              security_partner: "EyeNationTestSchool",
              coordinates: {lat:_this.state.position ?  _this.state.position.coords.latitude : "0.0", lng: _this.state.position ? _this.state.position.coords.longitude :  "0.0"} 
            }
    
            _this.setState({live : data});
            socket.emit("message", data);
        }).on(SESSION_STATUS.DISCONNECTED, function (session) {
          alert(SESSION_STATUS.DISCONNECTED);

          if(this.state.live){
            let ended  = this.state.live;
            ended.type = "stream::end";
            ended.recorded_video =  stream.getRecordInfo();
            this.setState({ live : ended});
            console.log("ENDED", ended);       
            socket.emit("message", ended);
          }
        });
      }catch(e){
        alert("flashphoner err " + e.message);
      }   
    }).catch(function(err) {
      alert(err.message);
    });
   };

   

  stop = ()=>{
    this.setState({publishing : false});
    this._handleStopClick();
    this._handleResetClick();

    if(stream){
       stream.stop();

       let ended  = this.state.live;
       ended.type = "stream::end";
       ended.recorded_video =  ("http://streaming.911.video:9091/client/records/" + stream.getRecordInfo());

       this.setState({ live : ended});
        console.log("ENDED", ended);       
       socket.emit("message", ended);
    }
  }

  _renderRougeBtn = ()=>{
    if(!this.state.publishing){
        return (<div onClick={this.live} className="rougeButton"></div>);
    }

    return (null);
  }
    
  _renderStopBtn = ()=>{
    if(this.state.publishing){
      return (<div onClick={this.stop} className="stopButton"></div>);
    }

    return (null);
  }

  _renderLoader = ()=>{
    if(this.state.loading){
      return (<div className="loader"></div>);
    }

    return (null);
  }

  _render911Btn =()=>{
    if(!this.state.publishing){
      return (<div onClick={()=>{
        if(window.confirm('Are you sure want call 911 ?')){
          this.setState({is911 : '911'});
          this.live(); 
          this.callElement.click();
        }else{
          this.live(); 
        }
       }} className="btn911"></div>);
    }
    
    return (null);
  }

  openMenu = ()=>{
    this.setState({openModalMenu : true});
  }

  closeMenu= ()=>{
    this.setState({openModalMenu : false});
  }

  _renderModalMenu = ()=>{
    if(this.state.openModalMenu){
      return (<div className="modal-menu">
                <div className="menu-username">
                  <div onClick={this.closeMenu} className="close-menu">
                    <img src={'/assets/images/ic_close_menu.png'} alt={'close menu'} />
                  </div> 
                  <div className="username-text">
                    {this.state.user.phone}
                  </div> 
                </div>
              </div>
      );
    }

    return null;
  }

  _renderMenu = ()=>{
    return (<div onClick={this.openMenu} className="menu"><img alt={'menu'} src={'/assets/images/menu.png'}/></div>);
  }

  _renderLiveLabel = ()=>{
    if(this.state.publishing){
        return (<div className="liveLabel"><p>LIVE</p></div>);
    }

    return (null);
  }

  _renderTimer = ()=>{
    if(this.state.publishing){
      return (
        <div className="timer">
            <div className="red-indicator"></div>
            <p>{this.zeroPad(this.state.minutes)}:{this.zeroPad(this.state.seconds)}:0{this.state.millis}</p>
        </div>
        );
    }
  }

    render(){
        return (
            <div className="main">
                {this._renderModalMenu()}
                {this._renderLoader()}
                <div id={'local-video'}></div>
                {this._renderMenu()}
                {this._renderLiveLabel()}
                {this._renderTimer()}
                <div className="recordButton">
                  {this._renderRougeBtn()}
                  {this._renderStopBtn()}
                  {this._render911Btn()}
                </div>
                <div className="logo">
                  <img src={'/assets/images/eyenation.png'} alt={'Eyenation.org'} />
                </div>
                <a ref={input => this.callElement = input} href={"tel:3012904420"} style={{display:"none"}}></a>
            </div>
        );
    }
}
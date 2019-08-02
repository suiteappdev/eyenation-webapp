import React, { Component } from 'react';
import 'react-phone-number-input/style.css'
import PhoneInput from 'react-phone-number-input';
import '../App.css';
import mobile from 'is-mobile';

export default class Login extends Component{
    constructor(props){
        super(props);

        if(!mobile()){
            window.location.href="https://911.video/";
        }
    }

    componentDidMount(){

    }

    loginByPhone =($event)=>{
        $event.preventDefault();
        
        let route = "/home/";
        let phone = this.state.phone;
        
        localStorage.setItem('user', JSON.stringify({phone : phone}));
        this.props.history.push(route);
    } 

    render(){
        return (
            <div className="main">
                <div className="logo-container">
                    <img src={'/assets/images/eyenation.png'} alt={'Eyenation Inc.'}></img>
                </div>
                <div className="phone-label">
                    <h2>PLEASE ENTER YOUR PHONE NUMBER TO GO LIVE</h2>
                </div> 
                <div className="phone-input">
                    <form onSubmit={this.loginByPhone}>
                        <PhoneInput placeholder="Enter phone number" onChange={ phone => this.setState({ phone }) } />
                    </form>
                </div>
                <a onClick={this.loginByPhone} className="button is-danger">Go to live</a>
                <div className="terms-conditions">
                    <p>By entering your phone number you agree with our <a className="conditions-url" target={'_blank'} href={'https://eyenation.org'} >Terms & Conditions</a>   </p>
                </div>
            </div>
        );
    }
}
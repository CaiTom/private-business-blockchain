import {Table, Grid, Button, Form } from 'react-bootstrap';
import React, { Component } from 'react';
//import logo from './logo.svg';
import './App.css';
import web3 from './web3';
import ipfs from './ipfs';
//import cryptoJS from './crypto-js';
import crypto from './crypto';
import fileDownload from './js-file-download';
import storehash from './storehash';
// var forge = require('node-forge');
// var bigInt = require("big-integer");
import PregatewayClient from './api/pregateway.js';

class App extends Component {

  pregatewayclient;
  constructor(props){
    super(props);
    this.state = {
      ipfsHash:null,
      buffer:'',
      fileExtBuff:'',
      encBuffer:'',
      encData:'',
      decData:'',
      permission:'',
      acc:'',
      grantAccAddr:'', //Used for input forms, grantRead revokeRead
      revokeAccAddr:'',
      ethAddress:'',
      blockNumber:'',
      transactionHash:'',
      gasUsed:'',
      txReceipt: ''
    };
    //this.updateInputVal = this.updateInputVal.bind(this);
    this.handleChange = this.handleChange.bind(this);
    //this.handleChange2 = this.handleChange2.bind(this);
  }

async componentDidMount() {
  this.get_sk();
}

get_sk(){
  this.pregatewayclient.generate_sk();
}
first_lvl_enc(){
  this.pregatewayclient.first_lvl_enc();
}

test_enc = async (event) => {
  //var packet_to_enc = {"publicKey": this.state.publicKey, "data": "SGVsbG8gV29ybGQNCg=="};
  this.first_lvl_enc();
}


init = async (event) => {
  const accounts = await web3.eth.getAccounts();
  this.setState({acc: accounts[0]});
}

captureFile = async (event) => {
        event.stopPropagation()
        event.preventDefault()
        const file = event.target.files[0]
        let reader = new window.FileReader()
        //console.log(file)
        reader.readAsArrayBuffer(file)
        //await this.setState({fileExtBuff: Buffer.from(file.name.split('.').pop().toLowerCase())})
        const fileExtBuff = Buffer.from(file.name.split('.').pop().toLowerCase());
        const fileExtLen = Buffer.from(fileExtBuff.length.toString());
        //console.log(this.state.fileExtBuff)
        //console.log(fileExtLen.toString())
        reader.onloadend = () => this.convertToBuffer(reader, fileExtBuff, fileExtLen);
        //this.convertToBuffer(this.state.encText)
      };

convertToBuffer = async(reader, fileExtBuff, fileExtLen) => {
      //file is converted to a buffer for upload to IPFS
        //const buffer = await reader.result + this.state.fileExtBuff;
        const buff = await Buffer.from(reader.result); //alt+q = œ
        //const arr = [buff, this.state.fileExtBuff];
        const arr = [buff, fileExtBuff, fileExtLen];
        const buffer = Buffer.concat(arr)
        //console.log(buffer.toString())
      //set this buffer -using es6 syntax
        this.setState({buffer});
    };
onClick = async () => {
try{
        const accounts = await web3.eth.getAccounts();

        this.setState({blockNumber:"waiting.."});
        this.setState({gasUsed:"waiting..."});
        //this.msgSender();
        /*
        await storehash.methods.isOwner().call((err, transactionHash)=>{
          console.log(err, transactionHash);
          this.setState({transactionHash});
        });
        await web3.eth.getTransaction(this.state.transactionHash, (err,tx)=>{
          console.log(err, tx);
          console.log(err, tx.from);
          this.setState({msgSender: tx.from});
        }); */
//get Transaction Receipt in console on click
//See: https://web3js.readthedocs.io/en/1.0/web3-eth.html#gettransactionreceipt
        await web3.eth.getTransactionReceipt(this.state.transactionHash, (err, txReceipt)=>{
          console.log(err,txReceipt);
          this.setState({txReceipt});
        }); //await for getTransactionReceipt
        await this.setState({blockNumber: this.state.txReceipt.blockNumber});
        await this.setState({gasUsed: this.state.txReceipt.gasUsed});
        //Read Permission
        /*await web3.eth.getTransaction(this.state.transactionHash, (err, tx)=>{
          console.log(err, tx);
          this.setState({msgSender: tx.from});
        });
        console.log(this.state.msgSender);*/
        /*await storehash.methods.isMsgSender().call((err, result)=>{
          console.log(result);
          this.setState({msgSender: result})
        });*/
        storehash.methods.hasRead(accounts[0]).call((err, result) => {
          console.log(result);
          this.setState({permission: result});
        });
      } //try
    catch(error){
        console.log(error);
      } //catch
  } //onClick
onReadAccess = async (event) => {
  const accounts = await web3.eth.getAccounts();
  console.log(accounts[0]);
  await storehash.methods.hasRead(accounts[0]).call((err, result) => {
    console.log(err, result);
    this.setState({permission: result});
    if(!this.state.permission){
      alert("You do not have read access to this file!");
    } else {
      alert("You have read access to this file.");
    }
  });
} //onReadAccess
onSubmit = async (event) => {
      event.preventDefault();
     //bring in user's metamask account address
      const accounts = await web3.eth.getAccounts();
      //obtain contract address from storehash.js
      const ethAddress = await storehash.options.address;
      this.setState({ethAddress});
      /*//call a method in storehash(contract) in order to getTransaction
      storehash.methods.isOwner().call((err, transactionHash)=>{
        console.log(err, transactionHash);
        this.setState({transactionHash});
      });
      web3.eth.getTransaction(this.state.transactionHash, (err,tx)=>{
        console.log(err, tx.from);
        this.setState({msgSender: tx.from});
      });
      */
      console.log('Sending from Metamask account: ' + accounts[0]);
    //encrypt array buffer with AES
      const algorithm = 'aes-256-ctr';
      const key = 'test';
      var cipher = crypto.createCipher(algorithm, key);
      var encBuffer = Buffer.concat([cipher.update(this.state.buffer),cipher.final()]);
      this.setState({encBuffer});
    //save document to IPFS,return its hash#, and set hash# to state
    //https://github.com/ipfs/interface-ipfs-core/blob/master/SPEC/FILES.md#add
      await ipfs.files.add(this.state.encBuffer, (err, ipfsHash) => {
        console.log(err,ipfsHash);
        //setState by setting ipfsHash to ipfsHash[0].hash
        this.setState({ ipfsHash:ipfsHash[0].hash });
   // call Ethereum contract method "sendHash" and .send IPFS hash to etheruem contract
  //return the transaction hash from the ethereum contract
 //see, this https://web3js.readthedocs.io/en/1.0/web3-eth-contract.html#methods-mymethod-send

        storehash.methods.sethash(this.state.ipfsHash).send({
          from: accounts[0]
        }, (error, transactionHash) => {
          console.log(transactionHash);
          this.setState({transactionHash});
        }); //storehash
      }) //await ipfs.add
    }; //onSubmit

onDecrypt = async (event) => {
  event.preventDefault();
  const accounts = await web3.eth.getAccounts();
  const ethAddress = await storehash.options.address;
  this.setState({ethAddress});
  storehash.methods.getHash().call((err, ipfsHash) => {
    this.setState({ipfsHash: ipfsHash});
  });
  console.log(this.state.ipfsHash);

  storehash.methods.hasRead(accounts[0]).call((err, result) => {
    console.log(result);
    this.setState({permission: result});
    if(this.state.permission){
      //get hash from contract
      storehash.methods.getHash().call( (err, ipfsHash) => {
        //console.log(result);
        this.setState({ipfsHash: ipfsHash[0].hash});
      }); //storehash, getHash()
      //get encrypted data from IPFS
      ipfs.files.cat(this.state.ipfsHash, (err, encData) => {
        //console.log(err, encData);
        console.log(err);
        this.setState({encData});
        this.decipher(this.state.encData);
      }); //ipfs cat
    } else {
      console.log("You are not permitted to view this document.");
      alert("You are not permitted to view this document.");
    }
  });
}; //decrypt

decipher (encData) {
  const algorithm = 'aes-256-ctr';
  const key = 'test';
  var decipher = crypto.createDecipher(algorithm, key);
  var decData = Buffer.concat([decipher.update(encData) , decipher.final()]);
  this.setState({decData});
  //console.log(this.state.decData);
  /*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
  //Find method of downloading buffer
  //const ext = decData.split(/\n/).pop().toLowercase();
  //const ext = decData.slice(-3);
  /**/
  var extLen = parseInt(decData.slice(-1).toString());
  const ext = decData.slice(-(extLen+1), -1);
  /**/
  //console.log(this.state.decData.toString('utf8'));
  //console.log("9", ext.toString());
  //console.log(extLen)
  //console.log(ext);
  fileDownload(this.state.decData, "hello-o."+ext);
}

/*grantR = async(accAddr) => {
  storehash.methods.grantRead(accAddr).send({from: "0xc9FD87a52Cd94E29b6Ba434036ddAA66c0Eaf5e8"}, (err,transactionHash)=>{
    console.log(transactionHash);
    this.setState({transactionHash});
  });
  alert(accAddr + " has been given read access.");
  storehash.methods.hasRead(accAddr).call((err, result)=>{
    console.log(err, result);
    this.setState({permission: result});
  }); //hasRead update
}*/

grantRead = async (accAddr) => {
  //const accounts = web3.eth.getAccounts();
  await storehash.methods.hasRead(accAddr).call((err, result) => {
    console.log(result);
    this.setState({permission: result});
    if(this.state.permission) {
      alert("This address already has permission.");
    } else {
      //this.grantR(accAddr);
      storehash.methods.grantRead(accAddr).send({from: "0xc9FD87a52Cd94E29b6Ba434036ddAA66c0Eaf5e8"}, (err,transactionHash)=>{
        console.log(transactionHash);
        this.setState({transactionHash});
        //this.setState({permission: !this.state.permission});
        //console.log(this.state.permission);
        storehash.methods.hasRead(accAddr).call((err, result) => {
          console.log(result);
          this.setState({permission: result});
        });
      });
      alert(accAddr.toString() + " has been given read access.");
    } // if else state.permission
  }); //hasRead
}

grantReadSubmit = async (event) => {
  event.preventDefault();
  //const accounts = await web3.eth.getAccounts();
  //testing
  //console.log(accounts[]);
  /*if(accounts.indexOf(this.state.accAddr) >= 0){
    this.grantRead(this.state.accAddr);
  } else {
    alert("That is not a valid address within the network.");
  }*/
  this.grantRead(this.state.grantAccAddr);
  //this.grantRead();
}

revokeRead = async (accAddr) => {
  //const accounts = web3.eth.getAccounts();
  await storehash.methods.hasRead(accAddr).call((err, result) => {
    console.log(result);
    this.setState({permission: result});
    if(this.state.permission){
      storehash.methods.revokeRead(accAddr).send({from: "0xc9FD87a52Cd94E29b6Ba434036ddAA66c0Eaf5e8"}, (err,transactionHash)=>{
        console.log(transactionHash);
        this.setState({transactionHash});
        //this.setState({permission: !this.state.permission});
        //console.log(this.state.permission);
        storehash.methods.hasRead(accAddr).call((err, result) => {
          console.log(result);
          this.setState({permission: result});
        });
      }); //revokeRead
      alert(accAddr.toString() + " has been revoked read access.");
    } else {
      alert("This address doesn't have permission anyway.")
    } //if state.permission
  }); //hasRead
}
revokeReadSubmit = async (event) => {
  event.preventDefault();
  //this.revokeRead(this.state.accAddr);
  this.revokeRead(this.state.revokeAccAddr);
}

/*updateInputVal(event) {
  //const target = event.target;
  this.setState({accAddr: evt.target.value});
}*/
/*updateInputVal(evt) {
  this.setState({[evt.target.accAddr]: evt.target.value});
}*/
handleChange(event) {
  this.setState({[event.target.name]: event.target.value});
}

Init = async() =>{
  const accounts = await web3.eth.getAccounts();
  this.setState({acc: accounts[0]});
  //console.log(this.state.acc);
}


render() {

      return (
        <div className="App">
          <PregatewayClient ref={ref => (this.pregatewayclient = ref)}/>
          <header className="App-header">
            <h1>Conducting Private Business on a Public Blockchain</h1>
          </header>

          <div className="App-Welcome" onMouseOver = {this.Init}>
            <h2>Welcome, {this.state.acc}</h2>
          </div>
          <div className="App-Validator">
            <h2>Validator</h2>
            <div>
              <h3> Choose file to securely upload </h3>
              <Form onSubmit={this.onSubmit}>
                <input type = "file" onChange = {this.captureFile} />
                <Button type="submit">Upload</Button>
              </Form>
            </div>
            <hr/>
            <div className="Val-DL">
              <h3>Download File</h3>
              <Button onClick = {this.onDecrypt}>Download</Button>
            </div>
            <hr/>
            <div className="Val-Controls">
              <h3>Validator Controls</h3>
              <Form onSubmit={this.grantReadSubmit}>
                <label>
                  Grant Read Access - Address:
                  <input type="text1" placeholder="0x" name="grantAccAddr" /*value={this.state.grantAccAddr}*/ onChange={this.handleChange}/>
                </label>
                <Button type="submit">Submit</Button>
              </Form>

              <Form onSubmit={this.revokeReadSubmit}>
                <label>
                  Revoke Read Access - Address:
                  <input type="text2" placeholder="0x" name="revokeAccAddr" /*value={this.state.revokeAccAddr}*/ onChange={this.handleChange}/>
                </label>
                <Button type="submit">Submit</Button>
              </Form>
            </div>
            <hr/>
            <div className="Val-Logs">
              <h3>Useful Logs</h3>
              <Button onClick = {this.onClick}> Get Transaction Receipt </Button>
              <Table bordered responsive>
                <thead>
                  <tr>
                    <th>Tx Receipt Category</th>
                    <th>Values</th>
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <td>IPFS Hash stored on Eth Contract</td>
                    <td>{this.state.ipfsHash}</td>
                  </tr>
                  <tr>
                    <td>Ethereum Contract Address</td>
                    <td>{this.state.ethAddress}</td>
                  </tr>

                  <tr>
                    <td>Tx Hash # </td>
                    <td>{this.state.transactionHash}</td>
                  </tr>

                  <tr>
                    <td>Block Number # </td>
                    <td>{this.state.blockNumber}</td>
                  </tr>

                  <tr>
                    <td>Gas Used</td>
                    <td>{this.state.gasUsed}</td>
                  </tr>
                </tbody>
            </Table>
            </div>
          </div>
          <div className="App-User">
            <h2>User</h2>
            <div className="User-DL">
              <h3>Download File</h3>
              <Button onClick = {this.onDecrypt}>Download</Button>
            </div>
            <hr/>
            <div className="User-Access">
              <h3>Check Read Access</h3>
              <Button onClick = {this.onReadAccess}> Check Read Access </Button>
              <p>{this.state.permission}</p>
            </div>
          </div>
        </div>
      );
    } //render
} //App
export default App;

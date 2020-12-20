import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  KeyboardAvoidingView,
  ToastAndroid,
} from 'react-native';
import * as Permissions from 'expo-permissions';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as firebase from 'firebase';
import db from '../config';

export default class TransactionScreen extends React.Component {
  constructor() {
    super();
    this.state = {
      hasCameraPermission: null,
      scanned: false,
      scannedStudentID: '',
      scannedBookID: '',
      buttonState: 'normal',
      transactionMessage: '',
    };
  }

  getCameraPermissions = async (ID) => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({
      hasCameraPermission: status === 'granted',
      buttonState: ID,
      scanned: false,
      
    });
  };

  handleBarCodeScanner = async ({ type, data }) => {
    const { buttonState } = this.state;
    if (buttonState === 'BookID') {
      this.setState({
        scanned: true,
        scannedBookID: data,
        buttonState: 'normal',
      });
    } else if (buttonState === 'StudentID') {
      this.setState({
        scanned: true,
        scannedStudentID: data,
        buttonState: 'normal',
      });
    }
  };

  handleTransaction = async () => {
    var transactionMessage;
    console.log('handleTransaction');
    db.collection('Books')
      .doc(this.state.scannedBookID)
      .get()
      .then((doc) => {
        var book = doc.data();
        if (book.bookAvailability) {
          this.initiateBookIssue();
          transactionMessage = 'bookIssued';
        } else {
          this.initiateBookReturn();
          transactionMessage = 'bookreturned';
        }
      });
    this.setState({ transactionMessage: transactionMessage });
  };

  initiateBookIssue = async () => {
    db.collection('Transactions').add({
      studentID: this.state.scannedStudentID,
      bookID: this.state.scannedBookID,
      date: firebase.firstore.Timestamp.now().toDate(),
      transactionType: 'Issued',
    });
    db.collection('Books').doc(this.state.scannedBookID).update({
      bookAvailability: false,
    });
    db.collection('Students')
      .doc(this.state.scannedStudentID)
      .update({
        noOfBooksIssued: firebase.firstore.FieldValue.increment(1),
      });
    //ToastAndroid.show(transactionMessage, ToastAndroid.SHORT);
    Alert.alert('Book Issued');
    this.setState({
      scannedBookID: '',
      scannedStudentID: '',
    });
  };

  initiateBookReturn = async () => {
    db.collection('Transactions').add({
      studentID: this.state.scannedStudentID,
      bookID: this.state.scannedBookID,
      date: firebase.firstore.Timestamp.now().toDate(),
      transactionType: 'Returned',
    });
    db.collection('Books').doc(this.state.scannedBookID).update({
      bookAvailability: true,
    });
    db.collection('Students')
      .doc(this.state.scannedStudentID)
      .update({
        noOfBooksIssued: firebase.firstore.FieldValue.increment(-1),
      });
    //ToastAndroid.show(transactionMessage, ToastAndroid.SHORT);
    Alert.alert('Book Returned');
    this.setState({
      scannedBookID: '',
      scannedStudentID: '',
    });
  };

  render() {
    const hasCameraPermission = this.state.hasCameraPermission;
    const scanned = this.state.scanned;
    const buttonState = this.state.buttonState;
    if (buttonState !== 'normal' && hasCameraPermission) {
      return (
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanner}
          style={StyleSheet.absoluteFillObject}
        />
      );
    } else if (buttonState === 'normal') {
      return (
        <KeyboardAvoidingView
          style={styles.container}
          behavior = "padding" 
          enabled> 
          <View>
            <Image
              source={require('../assets/booklogo.jpg')}
              style={{ width: 200, height: 200 }}
            />
            <Text style={{ textAlign: 'center', fontSize: 30 }}>WILY</Text>
          </View>
          <View style={styles.inputView}>
            <TextInput
              style={styles.inputBox}
              onChangeText ={text => this.setState({scannedBookID:text})}
              placeholder="Enter Book ID"
              value={this.state.scannedBookID}
            />
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => {
                this.getCameraPermissions('BookID');
              }}>
              <Text style={styles.buttonText}>SCAN</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputView}>
            <TextInput
              style={styles.inputBox}
              onChangeText ={text => this.setState({scannedStudentID:text})}
              placeholder="Enter Student ID"
              value={this.state.scannedStudentID}
            />
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => {
                this.getCameraPermissions('StudentID');
              }}>
              <Text style={styles.buttonText}>SCAN</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={async () => {
              var transactionMessage = await this.handleTransaction();
            }}>
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      );
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  displayText: {
    fontSize: 15,
    textDecorationLine: 'underline',
  },
  buttonText: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 10,
  },
  inputView: {
    flexDirection: 'row',
    margin: 20,
  },
  inputBox: {
    width: 200,
    height: 40,
    borderWidth: 1.5,
    borderRightWidth: 0,
    fontSize: 20,
  },
  scanButton: {
    backgroundColor: '#66BB6A',
    width: 50,
    borderWidth: 1.5,
    borderLeftWidth: 0,
  },
  submitButton: {
    backgroundColor: '#FBC02D',
    width: 100,
    height: 50,
  },
  submitButtonText: {
    padding: 10,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
});

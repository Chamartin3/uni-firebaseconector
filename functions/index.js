const functions = require("firebase-functions");
const {firebaseApp:admin} = require('./utils')
const Firestore = admin.firestore();
var request = require('request');

const userApp = require('./user')

const createProfile = (userID) => {
  return Firestore.collection("profile")
  .doc(userID)
  .set({
    first_name:'',
    last_name:''
  }).catch(console.error)
}

const logAuthActivity = async (user, message) => {
  request.post({
    url:'https://userbackend.azurewebsites.net/api/logs',
    json: {
      user_id:user.uid,
      message,
      type:'Access'
    },
    headers: {
      'Content-Type': 'application/json'
    }
  },
  function (error, response, body) {
    console.log('Status')
    console.log(response.statusCode)
    if (error) throw Error(error)
    console.log(body)
    console.log('success')
    return body
  })

}


const createAzureProfile = async (userRecord) => {
  let { displayName, email } = userRecord
  let [usn] = email.split('@')
  if(!displayName) displayName = usn || ''
  let [first_name, ...apellido ] = displayName.split(' ')
  last_name = apellido.join(' ')
    request.post({
      url:'https://userbackend.azurewebsites.net/api/profiles',
      json: {
        firebase_user:userRecord.uid,
        first_name, last_name
      },
      headers: {
        'Content-Type': 'application/json'
      }
    },
    function (error, response, body) {
      console.log('Status')
      console.log(response.statusCode)
      if (error) throw Error(error)
      console.log(body)
      console.log('success')
      return body
    })
}


const addClaims = async (createdUser, context) => {
  const { uid } = createdUser;
  const baseClaims = {roles:['Client'] }
  admin.auth().getUser(uid)
    .then(updatedUser => {
      let roles 
      if(updatedUser.customClaims){
        console.log('CLAIMS DO NOT EXIST')
        roles = updatedUser.customClaims.roles
      }
      logAuthActivity(updatedUser, 'User Created')
      if(!roles){
        return admin.auth().setCustomUserClaims(uid, baseClaims)
          .then(() => createAzureProfile(updatedUser))
      } else if(roles['Client']){
        return createAzureProfile(updatedUser)
      } else {
        return updatedUser
      }
    });
  };
  

  const onUpdate = (event,context) => {
    console.log(event)
    console.log(context)
  }

module.exports = {
  claimsOnCreate: functions.auth.user().onCreate(addClaims),
  users: functions.https.onRequest(userApp),
  storage: functions.storage.bucket('documents/').onChange(onUpdate)
};
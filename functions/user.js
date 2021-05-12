
const { 
  firebaseApp:admin,
  CorsMiddleware, 
  FirebaseAutorizationMiddleware, 
  processUser } = require('./utils')
const{ 
  rolesMiddleware,
  userMiddleware,
  passwordMiddleware } = require('./validators')

var express = require('express')
var app = express()
var cors = require('cors');


const getUserMiddleware = (req, res, next) => {
  const { id } = req.params
  if ( !id ) {
    res.status(401).send({message:"Id de Usuario Requerida"})
    return
  }
  admin.auth().getUser(id)
  .then((userRecord) => {
    req.body.user = userRecord
    next()
  })
  .catch(error=> {
    if(error.code === 'auth/user-not-found'){
      res.status(404).send({message:"User not found"})
    } else{
      res.status(500).send({message:"Error desconocido"})
      console.log(error)
    }
  });


}





const listUsers = (req, res) => {
  let page = req.query['page']
  let pageSize = req.query['pageSize'] || 100
  admin.auth().listUsers(pageSize, page)
      .then(listUsersResult => {
        res.send({
          nextPage:listUsersResult.pageToken,
          list:listUsersResult.users.map(processUser)
        })
      })
      .catch(error =>{
        res.status(500).send('Error en servidor')
        console.log('Error listing users:', error) 
      });
}



const createUser = (req, res) => {
  const { validatedData } = req.body
  const { roles } = validatedData

  console.log('validatedData DATAAAA')
  console.log(validatedData)
  admin.auth()
  .createUser(validatedData)
  .then((userRecord) => {
    console.log('CRETED NOW SET ROLES')
    console.log(roles)
    return admin.auth().setCustomUserClaims(userRecord.uid, {roles}).then(()=>{
      console.log('roles setted')
      console.log(userRecord)
      res.send(userRecord)
    })
  }).catch(error=>{
    if(error.code === 'auth/email-already-exists'){
      res.status(400).send({message:"Ya existe un usario con ese email"})
    } else{
      res.status(500).send({message:"Error desconocido"})
      console.log(error)
    }
  })
}
const changePassword = (req, res) => {
  const { validatedData, user } = req.body
  console.log(user.uid)
  console.log(validatedData)
  admin.auth().updateUser(user.uid,validatedData )
  .then((userRecord) => {
    console.log('Successfully updated user', userRecord.toJSON());
    res.status(200).send({message:"Constraseña cambiada con éxito"})

  })
}


const changeRoles = (req, res) => {
  const { validatedData, user } = req.body
  admin.auth().setCustomUserClaims(user.uid, {roles:validatedData.roles}).then(()=>{
    res.send({message:"Success"})
  })
}



app.use(FirebaseAutorizationMiddleware(admin))

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
const allowedOrigins = ["https://localhost:3000"];
app.use(cors({
  credentials: true,
  origin: true
  // (origin, callback) => {
  //   return callback(null, true);
  //   if(!origin) return callback(null, true);
  //   if(allowedOrigins.indexOf(origin) === -1){
  //     var msg = 'The CORS policy for this site does not ' +
  //               'allow access from the specified Origin.';
  //     return callback(new Error(msg), false);
  //   }
  //   return callback(null, true);
  // }
}))

app.get('/list',listUsers)
app.patch('/:id/roles', [ rolesMiddleware, getUserMiddleware], changeRoles)
app.patch('/:id/password', [ passwordMiddleware, getUserMiddleware], changePassword)
app.post('/', [ userMiddleware], createUser)


module.exports = app
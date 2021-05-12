
var cors = require('cors');

const admin = require("firebase-admin");

admin.initializeApp();


const UnautorizedResponse = res => res.status(405).send({message:'Acceso no autorizado'})
const ValidateRoles = (roles, aroles) => roles.some(r=>AUTORIZED_ROLES.includes(r))
const ErrorCatch = err => {
  res.status(500).send('Error en servidor')
  console.log(err)
}

const CorsMiddleware = allowedOrigins => cors({
  credentials: true,
  origin: (origin, callback) => {
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      var msg = 'The CORS policy for this site does not ' +
                'allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
})

const FirebaseAutorizationMiddleware = (FBAdmin, AUTORIZED_ROLES=null)=>{
  if(AUTORIZED_ROLES) return (req,res,next) => {
    if(!FBAdmin.auth().currentUser) return UnautorizedResponse(res)
    FBAdmin.auth().currentUser.getIdToken(true).then(token => {
      if (!token.claims.roles)  return UnautorizedResponse(res)
      if (ValidateRoles(token.claims.roles, AUTORIZED_ROLES)) {
        next()
        return
      }    
      return UnautorizedResponse(res)
    }).catch(ErrorCatch)
  }
  return (req,res,next) => next()  
}

const processUser = userRecord => ({
  id:userRecord.uid,
  email:userRecord.email,
  emailVerified:userRecord.emailVerified,
  displayName:userRecord.displayName,
  photoURL:userRecord.photoURL,
  phoneNumber:userRecord.phoneNumber,
  disabled:userRecord.disabled,
  createdAt:userRecord.metadata.creationTime,
  lastSignIn:userRecord.metadata.lastSignInTime,
  roles:userRecord.customClaims? (userRecord.customClaims.roles || [] ) : []
})


module.exports = {
  FirebaseAutorizationMiddleware,
  CorsMiddleware,
  UnautorizedResponse,
  ValidateRoles,
  ErrorCatch,
  processUser,
  firebaseApp:admin
}
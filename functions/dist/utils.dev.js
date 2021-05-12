"use strict";

var cors = require('cors');

var admin = require("firebase-admin");

admin.initializeApp();

var UnautorizedResponse = function UnautorizedResponse(res) {
  return res.status(405).send({
    message: 'Acceso no autorizado'
  });
};

var ValidateRoles = function ValidateRoles(roles, aroles) {
  return roles.some(function (r) {
    return AUTORIZED_ROLES.includes(r);
  });
};

var ErrorCatch = function ErrorCatch(err) {
  res.status(500).send('Error en servidor');
  console.log(err);
};

var CorsMiddleware = function CorsMiddleware(allowedOrigins) {
  return cors({
    credentials: true,
    origin: function origin(_origin, callback) {
      if (!_origin) return callback(null, true);

      if (allowedOrigins.indexOf(_origin) === -1) {
        var msg = 'The CORS policy for this site does not ' + 'allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }

      return callback(null, true);
    }
  });
};

var FirebaseAutorizationMiddleware = function FirebaseAutorizationMiddleware(FBAdmin) {
  var AUTORIZED_ROLES = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  if (AUTORIZED_ROLES) return function (req, res, next) {
    if (!FBAdmin.auth().currentUser) return UnautorizedResponse(res);
    FBAdmin.auth().currentUser.getIdToken(true).then(function (token) {
      if (!token.claims.roles) return UnautorizedResponse(res);

      if (ValidateRoles(token.claims.roles, AUTORIZED_ROLES)) {
        next();
        return;
      }

      return UnautorizedResponse(res);
    })["catch"](ErrorCatch);
  };
  return function (req, res, next) {
    return next();
  };
};

var processUser = function processUser(userRecord) {
  return {
    id: userRecord.uid,
    email: userRecord.email,
    emailVerified: userRecord.emailVerified,
    displayName: userRecord.displayName,
    photoURL: userRecord.photoURL,
    phoneNumber: userRecord.phoneNumber,
    disabled: userRecord.disabled,
    createdAt: userRecord.metadata.creationTime,
    lastSignIn: userRecord.metadata.lastSignInTime,
    roles: userRecord.customClaims ? userRecord.customClaims.roles || [] : []
  };
};

module.exports = {
  FirebaseAutorizationMiddleware: FirebaseAutorizationMiddleware,
  CorsMiddleware: CorsMiddleware,
  UnautorizedResponse: UnautorizedResponse,
  ValidateRoles: ValidateRoles,
  ErrorCatch: ErrorCatch,
  processUser: processUser,
  firebaseApp: admin
};
"use strict";

var functions = require("firebase-functions");

var admin = require("firebase-admin");

admin.initializeApp();
var db = admin.firestore();

var createProfile = function createProfile(userRecord, context) {
  var email, phoneNumber, uid, customClaims, baseClaims, roles;
  return regeneratorRuntime.async(function createProfile$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          email = userRecord.email, phoneNumber = userRecord.phoneNumber, uid = userRecord.uid, customClaims = userRecord.customClaims;
          baseClaims = {
            roles: ['Client']
          };
          roles = userRecord.customClaims.roles;
          console.log('roles');
          console.log(roles);

          if (roles) {
            _context.next = 9;
            break;
          }

          _context.next = 8;
          return regeneratorRuntime.awrap(admin.auth().setCustomUserClaims(uid, customClaims));

        case 8:
          console.log('setet');

        case 9:
          if (!roles.includes('Client')) {
            _context.next = 11;
            break;
          }

          return _context.abrupt("return", db.collection("profile").doc(uid).set({
            email: email,
            phoneNumber: phoneNumber,
            first_name: '',
            last_name: ''
          })["catch"](console.error));

        case 11:
          return _context.abrupt("return", userRecord);

        case 12:
        case "end":
          return _context.stop();
      }
    }
  });
};

module.exports = {
  claimsOnCreate: functions.auth.user().onCreate(createProfile)
};
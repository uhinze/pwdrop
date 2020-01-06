const functions = require('firebase-functions');
const express = require('express');
const app = express();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.api = functions.region('europe-west1').https.onRequest(app);

app.get('/', (req, res) => {
  res.send('Success');
  });
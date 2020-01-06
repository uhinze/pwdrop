const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);

const express = require("express");
const { checkSchema, validationResult } = require("express-validator");
const app = express();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.secret = functions.region("europe-west1").https.onRequest(app);

app.get("/", async (req, res) => {
  let id = req.query.id;

  let db = admin.firestore();
  let document = await db
    .collection("secrets")
    .doc(id)
    .get();

  if (document.exists) {
    console.log("Secret exists: ", id);
    res.status(200).send({ secret: document.data().secret });
  } else {
    console.log("Secret does not exist: ", id);
    res.status(404).end();
  }
});

app.post(
  "/",
  checkSchema({
    ttl: { optional: true },
    maxViews: { optional: true, isNumeric: true },
    secret: { isString: true },
    isProtected: { isBoolean: true }
  }),
  async (req, res) => {
    let body = req.body;
    console.log(body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let id = require("crypto")
      .randomBytes(48)
      .toString("hex");

    console.log(id);

    let db = admin.firestore();
    let document = await db
      .collection("secrets")
      .doc(id)
      .set({
        secret: body.secret,
        ttl: body.ttl, // TODO make optional
        maxViews: body.maxViews, // TODO make optional
        isProtected: body.isProtected
      });

    res.send({ id });
  }
);

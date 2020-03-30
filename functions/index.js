const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);

const express = require("express");
const { checkSchema, validationResult } = require("express-validator");
const app = express();

const FIRESTORE_COLLECTION = "secrets";
const MAX_DAYS = 30;
let db = admin.firestore();

exports.api = functions.https.onRequest(app);

Date.prototype.addDays = function(days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

app.get("/secret", async (req, res) => {
  let id = req.query.id;

  let document = await db
    .collection(FIRESTORE_COLLECTION)
    .doc(id)
    .get();

  if (!document.exists) {
    console.log("Secret does not exist: ", id);
    return res.status(404).end();
  }

  console.log("Secret exists: ", id);
  let data = document.data();

  if (!isValid(data)) {
    console.log("Secret invalid, deleting and returning 404");
    deleteSecret(id);
    return res.status(404).end();
  }

  if (data.maxViews) {
    console.log("Decreasing remaining views by 1");
    await db
      .collection(FIRESTORE_COLLECTION)
      .doc(id)
      .set(
        {
          remainingViews: data.remainingViews - 1
        },
        { merge: true }
      );
  }

  console.log("Sending success return");
  return res
    .status(200)
    .send({ secret: data.secret, isProtected: data.isProtected });
});

app.post(
  "/secret",
  checkSchema({
    maxDays: { in: ["body"], isInt: { options: { min: 1, max: MAX_DAYS } } },
    maxViews: { in: ["body"], optional: true, isInt: { options: { min: 1 } } },
    secret: {
      in: ["body"],
      isString: true
    },
    isProtected: { in: ["body"], isBoolean: true }
  }),
  async (req, res) => {
    let body = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Invalid request, responding 422");
      return res.status(422).json({ errors: errors.array() });
    }
    if (body.secret.length > 2000 || body.secret.length < 1) {
      console.log("Invalid length, responding 422");
      return res.status(422).json({ msg: "Invalid secret length" });
    }

    let id = require("crypto")
      .randomBytes(48)
      .toString("hex");
    console.log("id generated:", id);

    let maxDays = body.maxDays ? body.maxDays : MAX_DAYS;
    let ttl = new Date().addDays(maxDays);

    await db
      .collection(FIRESTORE_COLLECTION)
      .doc(id)
      .set({
        secret: body.secret,
        ttl,
        maxViews: body.maxViews,
        remainingViews: body.maxViews,
        isProtected: body.isProtected,
        timestamp: new Date()
      });

    console.log("Sending success return");
    return res.send({ id, link: "/get?id=" + id });
  }
);

function isValid(data) {
  if (!data.secret || !data.ttl || !data.ttl.toDate) {
    console.log("Doesn't have correct schema");
    return false;
  }
  if (data.ttl.toDate() < new Date()) {
    console.log("Secret is expired");
    return false;
  }
  if (data.ttl.toDate() > new Date().addDays(MAX_DAYS)) {
    console.log("TTL is too far in the future, must be an error");
    return false;
  }
  if (data.maxViews) {
    if (data.remainingViews <= 0) {
      console.log("Secret has no remaining views");
      return false;
    }
    if (data.remainingViews > data.maxViews) {
      console.log("Remaining views greater than max views, must be an error");
      return false;
    }
  }
  return true;
}

async function deleteSecret(id) {
  await db
    .collection(FIRESTORE_COLLECTION)
    .doc(id)
    .delete();
}

exports.scheduledFunction = functions.pubsub
  .schedule("every day")
  .onRun(async context => {
    let documents = await db.collection(FIRESTORE_COLLECTION).get();

    documents.forEach(doc => {
      console.log("Checking secret: ", doc.id);
      if (!isValid(doc.data())) {
        console.log("Secret is invalid, deleting");
        deleteSecret(doc.id);
      }
    });
    return null;
  });

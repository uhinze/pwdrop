const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);

const express = require("express");
const { checkSchema, validationResult } = require("express-validator");
const app = express();

exports.api = functions.https.onRequest(app);

Date.prototype.addDays = function(days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

app.get("/secret", (req, res) => {
  getSecret(req, res)
    .then(response => {
      if (!response.body) {
        res.status(response.status).end();
      }
      res.status(response.status).send(response.body);
    })
    .catch(e => {
      console.log("Error during function execution: ", e);
      res.status(500).end();
    });
});

app.post(
  "/secret",
  checkSchema({
    maxDays: { optional: true, isNumeric: true },
    maxViews: { optional: true, isNumeric: true },
    secret: { isString: true },
    isProtected: { isBoolean: true }
  }),
  async (req, res) => {
    let body = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Invalid request, responding 422");
      return res.status(422).json({ errors: errors.array() });
    }

    let id = require("crypto")
      .randomBytes(48)
      .toString("hex");
    console.log("id generated:", id);

    let maxDays = body.maxDays ? body.maxDays : 30;
    let ttl = new Date().addDays(maxDays);

    let db = admin.firestore();
    await db
      .collection("secrets")
      .doc(id)
      .set({
        secret: body.secret,
        ttl,
        maxViews: body.maxViews,
        remainingViews: body.maxViews,
        isProtected: body.isProtected
      });

    console.log("Sending success return");
    res.send({ id, link: "/get?id=" + id });
  }
);

async function getSecret(req) {
  let id = req.query.id;

  let db = admin.firestore();
  let document = await db
    .collection("secrets")
    .doc(id)
    .get();

  if (!document.exists) {
    console.log("Secret does not exist: ", id);
    return { status: 404 };
  }

  console.log("Secret exists: ", id);
  let data = document.data();
  if (data.ttl < new Date()) {
    console.log("Secret is expired, deleting secret and returning 404");
    await db
      .collection("secrets")
      .doc(id)
      .delete();
    return { status: 404 };
  }

  if (data.maxViews) {
    if (data.remainingViews <= 0) {
      console.log("No remaining views, deleting secret and returning 404");
      await db
        .collection("secrets")
        .doc(id)
        .delete();
      return { status: 404 };
    }

    console.log("Decreasing remaining views by 1");
    await db
      .collection("secrets")
      .doc(id)
      .set(
        {
          remainingViews: data.remainingViews - 1
        },
        { merge: true }
      );
  }

  console.log("Sending success return");
  return { status: 200, body: { secret: document.data().secret } };
}

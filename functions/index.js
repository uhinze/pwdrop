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

app.get("/secret", async (req, res) => {
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
      return res.status(422).json({ errors: errors.array() });
    }

    let id = require("crypto")
      .randomBytes(48)
      .toString("hex");
    console.log("id:", id);

    let maxDays = body.maxDays ? body.maxDays : 30;

    let ttl = new Date().addDays(maxDays);

    let db = admin.firestore();
    await db
      .collection("secrets")
      .doc(id)
      .set({
        secret: body.secret,
        ttl,
        maxViews: body.maxViews, // TODO make optional
        isProtected: body.isProtected
      });

    res.send({ link: "/get?id=" + id });
  }
);

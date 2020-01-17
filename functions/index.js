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

  if (!document.exists) {
    console.log("Secret does not exist: ", id);
    return res.status(404).end();
  }

  console.log("Secret exists: ", id);
  let data = document.data();
  if (!data.secret) {
    console.log("Secret has invalid format, deleting and returning 404");
    await db
      .collection("secrets")
      .doc(id)
      .delete();
    return res.status(404).end();
  }

  if (data.ttl.toDate() < new Date()) {
    console.log("Secret is expired, deleting secret and returning 404");
    await db
      .collection("secrets")
      .doc(id)
      .delete();
    return res.status(404).end();
  }

  if (data.maxViews) {
    if (data.remainingViews <= 0) {
      console.log("No remaining views, deleting secret and returning 404");
      await db
        .collection("secrets")
        .doc(id)
        .delete();
      return res.status(404).end();
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
  return res
    .status(200)
    .send({ secret: data.secret, isProtected: data.isProtected });
});

app.post(
  "/secret",
  checkSchema({
    maxDays: { in: ["body"], isInt: { options: { min: 1, max: 30 } } },
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
        isProtected: body.isProtected,
        timestamp: new Date()
      });

    console.log("Sending success return");
    res.send({ id, link: "/get?id=" + id });
  }
);

# Exchange passwords, securely

[![CircleCI](https://circleci.com/gh/uhinze/pwdrop.svg?style=shield)](https://circleci.com/gh/uhinze/pwdrop)

[pwdrop](https://www.pwdrop.com) is a website for securely sending a password or other secret to someone else.

It is built using serverless technology from Google Cloud and deployed using [Firebase](https://firebase.google.com/).

The project is hosted on Firebase almost for free, the only fee being for [scheduling](https://firebase.google.com/docs/functions/schedule-functions) a cleanup function once a day.

## Prerequisites

- Node.js
- Firebase CLI

## Usage

Install dependencies:

```
cd functions && npm install && cd..
```

To run and test locally:

```
firebase serve
```

To deploy to your Firebase project:

```
firebase deploy
```

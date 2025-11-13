// encode.js
const fs = require("fs");
const key = fs.readFileSync("./online-learning-platform-a10-firebase-adminsdk-fbsvc-7490a94502.json", "utf8");
const base64 = Buffer.from(key).toString("base64");
console.log(base64);
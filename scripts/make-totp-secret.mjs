// Run: npm run totp
// Prints a secret for ADMIN_TOTP_SECRET and the setup link for an authenticator app.
import crypto from "node:crypto";
const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
let secret = "";
for (const b of crypto.randomBytes(20)) secret += A[b % 32];
const label = encodeURIComponent("Dasco Eden Admin");
console.log("\nADMIN_TOTP_SECRET=" + secret);
console.log("\nIn Google Authenticator / Authy / Microsoft Authenticator: Add account > Enter a setup key");
console.log("  Account name: Dasco Eden Admin\n  Key: " + secret + "\n  Type: Time based");
console.log("\nOr open this link on your phone: otpauth://totp/" + label + "?secret=" + secret + "&issuer=Dasco%20Eden\n");

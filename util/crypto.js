const crypto = require("crypto");
const {Buffer} = require("buffer");
const algorithm = "aes-192-cbc"; //algorithm to use
const password = "my-long-secret-key";
const key = crypto.scryptSync(password,'salt',24); //create key
const iv = Buffer.alloc(16, 0);
module.exports = {
    encrypt:(text) => {
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        const encrypted = cipher.update(text, 'utf8', 'hex') + cipher.final('hex'); 
        return encrypted;
    },
    decrypt:(encrypted) => {

        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        const decrypted = decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8'); //deciphered text
        return decrypted;
    }
}
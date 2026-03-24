// hash.js
import bcrypt from 'bcrypt';
const password = 'YourPasswordToHas';   // ← change this
const hash = await bcrypt.hash(password, 10);
console.log('ADMIN_PASSWORD_HASH=' + hash);
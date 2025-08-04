
const admin = require('firebase-admin');

// IMPORTANT: Replace with your service account key JSON file.
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('Usage: node create-user.js <email> <password>');
  process.exit(1);
}

admin.auth().createUser({
  email: email,
  password: password
})
.then((userRecord) => {
  console.log('Successfully created new user:', userRecord.uid);
  process.exit(0);
})
.catch((error) => {
  console.log('Error creating new user:', error);
  process.exit(1);
});

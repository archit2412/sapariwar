// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD1YS56I5vzbbOm2Xo9pXEaSpbRiAoApG8",
  authDomain: "sapariwar-2caf2.firebaseapp.com",
  projectId: "sapariwar-2caf2",
  storageBucket: "sapariwar-2caf2.firebasestorage.app", // Corrected from .firebasestorage.app to .appspot.com if that was a typo, otherwise keep as is if correct.
  messagingSenderId: "285186646884",
  appId: "1:285186646884:web:67e576cd1aae8024079071",
  measurementId: "G-978XQLQB1F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Export auth to be used in other parts of your app
export { auth };

// You can also export 'app' if you need other Firebase services
// export { app, auth };
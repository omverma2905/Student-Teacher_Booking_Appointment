import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from '../firebase/config.js';

class Auth {
    async login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    async register(email, password) {
        return createUserWithEmailAndPassword(auth, email, password);
    }

    async logout() {
        return signOut(auth);
    }

    getCurrentUser() {
        return new Promise((resolve, reject) => {
            onAuthStateChanged(auth, user => {
                if (user) resolve(user);
                else reject(new Error('No user is signed in'));
            });
        });
    }
}

export default new Auth();

import { adminAuth, adminDb } from '../firebaseAdmin.js';

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify Firebase ID token
            const decodedToken = await adminAuth.verifyIdToken(token);

            // Fetch user data from Firestore
            const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();

            if (!userDoc.exists) {
                return res.status(401).json({ message: 'User not found in database' });
            }

            req.user = { id: decodedToken.uid, ...userDoc.data() };
            next();
        } catch (error) {
            console.error('Firebase Auth Middleware Error:', error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

export { protect };

import { OAuth2Client } from "google-auth-library";

const GOOGLE_CLIENT_ID = "637652899382-qetfmirof5m6k3gqspqjhh1ippmig1pt.apps.googleusercontent.com"; // from Google Cloud Console
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export const verifyGoogleToken = async (req) => {
  try {
    console.log("GOOGLE_CLIENT_ID:", GOOGLE_CLIENT_ID);
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null; // Unauthorized
    }

    const token = authHeader.split(" ")[1];
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    console.log("Verification succeeded, payload:", payload);
    return payload; // Returns user info if token is valid
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
};

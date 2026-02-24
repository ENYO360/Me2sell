import { getFunctions, httpsCallable } from "firebase/functions";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import { app } from "../firebase"; // adjust path as needed

const functions = getFunctions(app);
const auth = getAuth(app);

// Create staff (Admin-side)
export const createStaff = async ({ businessId, email, displayName, permissions }) => {
  const fn = httpsCallable(functions, "createStaff");
  const res = await fn({ businessId, email, displayName, permissions, createAuthUser: true });
  return res.data; // { code, staffUid, tempPassword }
};

// Update staff permissions (Admin-side)
export const updateStaff = async ({ businessId, staffUid, email, displayName, permissions }) => {
  const fn = httpsCallable(functions, "updateStaff");
  const res = await fn({ businessId, staffUid, email, displayName, permissions });
  return res.data;
};

// Delete staff (Admin-side)
export const deleteStaff = async ({ businessId, staffUid }) => {
  const fn = httpsCallable(functions, "deleteStaff");
  const res = await fn({ businessId, staffUid });
  return res.data;
};

// Staff login using 6-digit code
export const signInWithCodeClient = async ({ businessId, code }) => {
  const fn = httpsCallable(functions, "signInWithCode");
  const res = await fn({ businessId, code });
  const { token } = res.data;
  await signInWithCustomToken(auth, token);
  return true;
};

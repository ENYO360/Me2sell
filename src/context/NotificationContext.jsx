import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase/config";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  doc,
  deleteDoc,
  writeBatch,
  limit
} from "firebase/firestore";

const NotificationContext = createContext();
export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState(null);

  // 🔥 Track login state properly
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsub();
  }, []);

  // 🔥 Listen for notifications only when user is available
 /* useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc"),
      limit(30)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setNotifications(list);

      const unread = list.filter((n) => !n.read).length;
      setUnreadCount(unread);
    });

    return () => unsubscribe();
  }, [user]);
  */

  // Send new notification
  const notify = async (message, type) => {
    if (!auth.currentUser) return;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // delete after 30 days
    /*
    await addDoc(
      collection(db, "users", auth.currentUser.uid, "notifications"),
      {
        message: message || "",
        type: type || "",
        read: false,
        createdAt: serverTimestamp(),
        expiresAt: expiresAt,
      }
    ); 
    */
  };

  // Mark single as read
  /*
  const markAsRead = async (id) => {
    const ref = doc(db, "users", auth.currentUser.uid, "notifications", id);
    await updateDoc(ref, { read: true });
  };
  */

  // Mark all as read
  /*
  const markAllAsRead = async () => {
    if (!auth.currentUser || notifications.length === 0) return;

    const batch = writeBatch(db);

    notifications.forEach((n) => {
      if (!n.read) {
        const ref = doc(
          db,
          "users",
          auth.currentUser.uid,
          "notifications",
          n.id
        );
        batch.update(ref, { read: true });
      }
    });

    await batch.commit();
  };
  */

  // Clear all notifications
  /*
  const clearAllNotifications = async () => {
    if (!auth.currentUser || notifications.length === 0) return;

    const batch = writeBatch(db);

    notifications.forEach((n) => {
      const ref = doc(
        db,
        "users",
        auth.currentUser.uid,
        "notifications",
        n.id
      );
      batch.delete(ref);
    });

    await batch.commit();
  };
  */


  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        notify,
       // markAsRead,
       // markAllAsRead,
       // clearAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

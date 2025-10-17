'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "./../lib/firebase";
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function SignInPage() {
  const [error, setError] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();

  // 👇 Only redirect if already logged in *and* domain is valid
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const emailDomain = user.email?.split("@")[1]?.trim().toLowerCase();
        const allowedDomain = "asl.org"; // your school domain

        if (emailDomain === allowedDomain) {
          router.push("/"); // ✅ allowed domain
        } else {
          await signOut(auth);
          setError(`Only ${allowedDomain} emails are allowed.`);
        }
      }
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleGoogleSignIn = async () => {
    setError("");
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const emailDomain = user.email?.split("@")[1]?.trim().toLowerCase();
      const allowedDomain = "asl.org";

      if (emailDomain !== allowedDomain) {
        await auth.signOut();
        setError(`Only ${allowedDomain} emails are allowed. Your domain: ${emailDomain}`);
        return;
      }

      // Save user to Firestore if new
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          name: user.displayName,
          email: user.email,
          createdAt: new Date(),
        });
      }

      router.push("/");
    } catch (err: any) {
      console.error("Sign in error:", err);
      setError(err.message);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-yellow-100 dark:from-gray-900 dark:to-gray-800">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg text-center w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Sign in with Google</h1>
        <button
          onClick={handleGoogleSignIn}
          className="flex items-center justify-center gap-3 bg-white border py-3 px-6 rounded-lg shadow-md hover:bg-gray-50 w-full font-semibold text-gray-800"
        >
          <img src="/google.svg" alt="Google" className="w-5 h-5" />
          Sign in with Google
        </button>
        {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
      </div>
    </div>
  );
}
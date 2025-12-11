"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { db, auth } from "./../lib/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  type User as FirebaseAuthUser,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useTheme } from "../lib/theme";

export default function SignInPage() {
  const [error, setError] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState<FirebaseAuthUser | null>(null);
  const router = useRouter();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const shellStyle = { background: "var(--background)" };
  const textClass = isLight ? "text-amber-900" : "text-orange-100";
  const surfaceClass = "rounded-3xl border app-surface shadow-[0_25px_70px_-20px_rgba(249,115,22,0.45)]";
  const surfaceSoft = "rounded-2xl border app-surface-soft";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const emailDomain = user.email?.split("@")[1]?.trim().toLowerCase();
        const allowedDomain = "asl.org";

        if (emailDomain === allowedDomain) {
          router.push("/");
        } else {
          await signOut(auth);
          setCurrentUser(null);
          setError(`Only ${allowedDomain} emails are allowed.`);
        }
      } else {
        setCurrentUser(null);
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
    } catch (err: unknown) {
      console.error("Sign in error:", err);
      setError(err instanceof Error ? err.message : "Failed to sign in with Google.");
    }
  };

  return (
    <div className={`min-h-screen ${textClass}`} style={shellStyle}>
      <main className="flex items-center justify-center px-6 py-16">
        {checkingAuth ? (
          <div className={`flex h-96 w-full max-w-md flex-col items-center justify-center ${surfaceClass} text-center`}>
            <p className={`text-sm ${isLight ? "text-amber-800" : "text-orange-200/80"}`}>Checking authentication...</p>
          </div>
        ) : (
          <div className={`relative w-full max-w-5xl overflow-hidden ${surfaceClass} backdrop-blur`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(250,115,22,0.08)_0,_transparent_60%)]" />
            <div className="relative grid gap-12 p-10 lg:grid-cols-[1.2fr_1fr]">
              <section className="space-y-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/40 px-4 py-1 text-sm uppercase tracking-[0.2em] text-orange-500">
                  Peer Connect
                </div>
                <div className="space-y-4">
                  <h1 className={`text-4xl font-bold sm:text-5xl ${textClass}`}>
                    Connect with tutors across campus in seconds.
                  </h1>
                  <p className={`text-lg ${isLight ? "text-amber-800" : "text-orange-200/80"}`}>
                    Use your official ASL email to join the network, collaborate on homework, and get help from verified peers who share your classes and interests.
                  </p>
                </div>
              </section>

              <section className={`flex flex-col justify-center gap-6 ${surfaceSoft} p-8 text-center shadow-lg`}>
                <div className="space-y-2">
                  <h2 className="text-3xl font-semibold">Sign in to continue</h2>
                  <p className={`text-sm ${isLight ? "text-amber-800" : "text-orange-200/70"}`}>
                    Only <span className="font-semibold text-orange-500">asl.org</span> email addresses can access Peer Connect.
                  </p>
                </div>

                <button
                  onClick={handleGoogleSignIn}
                  className="group flex items-center justify-center gap-3 rounded-xl border border-orange-500/60 bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 px-6 py-3 text-base font-semibold text-black shadow-lg transition hover:shadow-orange-500/60"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-orange-900/30 bg-black/70 p-2">
                    <Image src="/google.svg" alt="Google logo" width={20} height={20} />
                  </span>
                  Continue with Google
                </button>

                {error && (
                  <p className={`rounded-lg border px-4 py-2 text-sm ${isLight ? "border-red-200 bg-red-50 text-red-700" : "border-red-500/40 bg-red-950/60 text-red-300"}`}>
                    {error}
                  </p>
                )}
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

'use client';

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

export default function SignInPage() {
  const [error, setError] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState<FirebaseAuthUser | null>(null);
  const router = useRouter();

  // 👇 Only redirect if already logged in *and* domain is valid
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const emailDomain = user.email?.split("@")[1]?.trim().toLowerCase();
        const allowedDomain = "asl.org"; // your school domain

        if (emailDomain === allowedDomain) {
          router.push("/"); // ✅ allowed domain
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

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      router.push("/signin");
    } catch (err) {
      console.error("Failed to sign out:", err);
    }
  };

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
    } catch (err: unknown) {
      console.error("Sign in error:", err);
      setError(err instanceof Error ? err.message : "Failed to sign in with Google.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-gray-900 text-orange-100">
      <header className="border-b border-orange-700/40 bg-black/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-5">
          <button
            onClick={() => handleNavigate("/")}
            className="flex items-center transition hover:opacity-90"
            aria-label="Peer Connect home"
          >
            <Image
              src="/logo.svg"
              alt="Peer Connect"
              width={160}
              height={36}
              priority
              className="h-10 w-auto"
            />
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleNavigate("/")}
              className="rounded-full border border-orange-600/60 px-4 py-1 text-sm font-medium text-orange-200 transition hover:border-orange-400 hover:text-orange-100"
            >
              Home
            </button>
            <button
              onClick={() => handleNavigate("/Profile")}
              className="rounded-full border border-orange-600/60 px-4 py-1 text-sm font-medium text-orange-200 transition hover:border-orange-400 hover:text-orange-100"
            >
              Profile
            </button>
            {currentUser ? (
              <button
                onClick={handleSignOut}
                className="rounded-full bg-orange-600 px-4 py-1 text-sm font-semibold text-black shadow-lg transition hover:bg-orange-500"
              >
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => handleNavigate("/signin")}
                className="rounded-full bg-orange-500 px-4 py-1 text-sm font-semibold text-black shadow-lg transition hover:bg-orange-400"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex items-center justify-center px-6 py-16">
        {checkingAuth ? (
          <div className="flex h-96 w-full max-w-md flex-col items-center justify-center rounded-3xl border border-orange-700/50 bg-black/60 text-center shadow-[0_25px_70px_-30px_rgba(250,115,22,0.45)]">
            <p className="text-sm text-orange-200/80">Checking authentication...</p>
          </div>
        ) : (
          <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-orange-700/50 bg-gray-950/70 shadow-[0_25px_70px_-20px_rgba(250,115,22,0.45)] backdrop-blur">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(250,115,22,0.08)_0,_transparent_60%)]" />
            <div className="relative grid gap-12 p-10 lg:grid-cols-[1.2fr_1fr]">
              <section className="space-y-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/40 px-4 py-1 text-sm uppercase tracking-[0.2em] text-orange-300/80">
                  Peer Connect
                </div>
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold text-orange-100 sm:text-5xl">
                    Connect with tutors across campus in seconds.
                  </h1>
                  <p className="text-lg text-orange-200/80">
                    Use your official ASL email to join the network, collaborate on homework, and get help from verified peers who share your classes and interests.
                  </p>
                </div>
                <ul className="grid gap-4 sm:grid-cols-2 text-sm text-orange-200/80">
                  <li className="flex items-start gap-3 rounded-2xl border border-orange-500/30 bg-black/30 p-4">
                    <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-600 text-xs font-bold text-black">
                      1
                    </span>
                    <div>
                      <h2 className="text-base font-semibold text-orange-200">Trusted network</h2>
                      <p>Every profile is verified through school credentials.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3 rounded-2xl border border-orange-500/30 bg-black/30 p-4">
                    <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-600 text-xs font-bold text-black">
                      2
                    </span>
                    <div>
                      <h2 className="text-base font-semibold text-orange-200">Match by subject</h2>
                      <p>Find classmates by grade, role, or the topics they love.</p>
                    </div>
                  </li>
                </ul>
              </section>

              <section className="flex flex-col justify-center gap-6 rounded-2xl border border-orange-500/40 bg-black/60 p-8 text-center shadow-lg">
                <div className="space-y-2">
                  <h2 className="text-3xl font-semibold text-orange-100">Sign in to continue</h2>
                  <p className="text-sm text-orange-200/70">
                    Only <span className="font-semibold text-orange-300">asl.org</span> email addresses can access Peer Connect.
                  </p>
                </div>
                <button
                  onClick={handleGoogleSignIn}
                  className="group flex items-center justify-center gap-3 rounded-xl border border-orange-500/60 bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 px-6 py-3 text-base font-semibold text-black shadow-lg transition hover:shadow-orange-500/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-orange-900/30 bg-black p-2 transition group-hover:border-black/0">
                    <Image
                      src="/google.svg"
                      alt="Google logo"
                      width={20}
                      height={20}
                      priority
                      className="h-5 w-5"
                    />
                  </span>
                  Continue with Google
                </button>
                {error && (
                  <p className="rounded-lg border border-red-500/40 bg-red-950/60 px-4 py-2 text-sm text-red-300">
                    {error}
                  </p>
                )}
                <p className="text-xs text-orange-200/60">
                  Having trouble signing in? Contact the Peer Connect team and we&apos;ll get you set up.
                </p>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

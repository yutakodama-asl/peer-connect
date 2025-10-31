"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut, type User as FirebaseUser } from "firebase/auth";

const ProfilePage = () => {
  const [userData, setUserData] = useState({
    name: "",
    grade: "",
    role: "learner",
    subjects: "",
    bio: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(() => auth.currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authUser) {
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        const docRef = doc(db, "users", authUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData({
            name: data.name || "",
            grade: data.grade || "",
            role: data.role || "learner",
            subjects: data.subjects ? data.subjects.join(", ") : "",
            bio: data.bio || "",
          });
        } else {
          setUserData((prev) => ({
            ...prev,
            name: authUser.displayName || "",
            subjects: "",
          }));
        }
      } catch (e) {
        setError("Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    fetchUserData();
  }, [authUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (!authUser) {
      router.push("/signin");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const docRef = doc(db, "users", authUser.uid);
      const normalizedSubjects = Array.from(
        new Set(
          userData.subjects
            .split(",")
            .map((subject) => subject.trim())
            .filter(Boolean)
        )
      );
      await setDoc(docRef, {
        name: userData.name,
        grade: userData.grade,
        role: userData.role,
        subjects: normalizedSubjects,
        bio: userData.bio,
      }, { merge: true });
      router.push("/");
    } catch (e) {
      console.error("Failed to save profile:", e);
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/signin");
    } catch (err) {
      console.error("Failed to sign out:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-gray-900 text-orange-100">
      <header className="border-b border-orange-700/40 bg-black/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-5">
          <button
            onClick={() => handleNavigate("/")}
            className="text-left text-2xl font-bold tracking-tight text-orange-400 transition hover:text-orange-300"
          >
            Peer Connect
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
            {!authUser ? (
              <button
                onClick={() => handleNavigate("/signin")}
                className="rounded-full bg-orange-500 px-4 py-1 text-sm font-semibold text-black shadow-lg transition hover:bg-orange-400"
              >
                Sign In
              </button>
            ) : (
              <button
                onClick={handleSignOut}
                className="rounded-full bg-orange-600 px-4 py-1 text-sm font-semibold text-black shadow-lg transition hover:bg-orange-500"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        {!authUser ? (
          <section className="rounded-3xl border border-orange-700/50 bg-black/60 p-10 text-center shadow-[0_25px_70px_-30px_rgba(250,115,22,0.45)]">
            <h1 className="text-3xl font-semibold text-orange-200">
              Sign in to keep your profile up to date
            </h1>
            <p className="mt-3 text-sm text-orange-200/70">
              Jump back into the directory by using your school email.
            </p>
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => handleNavigate("/signin")}
                className="rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-black shadow-lg transition hover:bg-orange-400"
              >
                Go to sign in
              </button>
            </div>
          </section>
        ) : loading ? (
          <section className="rounded-3xl border border-orange-700/50 bg-black/60 p-10 text-center shadow-[0_25px_70px_-30px_rgba(250,115,22,0.45)]">
            <h1 className="text-3xl font-semibold text-orange-200">
              Loading your profile
            </h1>
            <p className="mt-3 text-sm text-orange-200/70">
              We&apos;re fetching your saved details. This only takes a moment.
            </p>
          </section>
        ) : (
          <section className="rounded-3xl border border-orange-700/50 bg-black/60 p-10 shadow-[0_25px_70px_-30px_rgba(250,115,22,0.45)]">
            <div className="flex flex-col gap-4 border-b border-orange-700/40 pb-6">
              <h1 className="text-4xl font-bold text-orange-200">Your Profile</h1>
              <p className="max-w-2xl text-sm text-orange-200/70">
                Share a quick snapshot of who you are so tutors and learners can find the perfect match.
              </p>
            </div>

            {error && (
              <p className="mt-4 rounded-lg border border-red-500/40 bg-red-950/60 px-4 py-2 text-sm text-red-300">
                {error}
              </p>
            )}

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-orange-200">Name</span>
                <input
                  type="text"
                  name="name"
                  value={userData.name}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-orange-600 bg-black px-3 py-2 text-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Your full name"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-orange-200">Grade</span>
                <input
                  type="text"
                  name="grade"
                  value={userData.grade}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-orange-600 bg-black px-3 py-2 text-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g. 10th, 11th"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-orange-200">Role</span>
                <select
                  name="role"
                  value={userData.role}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-orange-600 bg-black px-3 py-2 text-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="tutor">Tutor</option>
                  <option value="learner">Learner</option>
                </select>
              </label>

              <label className="flex flex-col gap-2 md:col-span-2">
                <span className="text-sm font-semibold text-orange-200">Subjects</span>
                <input
                  type="text"
                  name="subjects"
                  value={userData.subjects}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-orange-600 bg-black px-3 py-2 text-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Comma separated e.g. Math, Physics"
                />
                <span className="text-xs text-orange-200/60">
                  Tip: Add multiple subjects by separating them with commas.
                </span>
              </label>
            </div>

            <label className="mt-6 flex flex-col gap-2">
              <span className="text-sm font-semibold text-orange-200">Bio</span>
              <textarea
                name="bio"
                value={userData.bio}
                onChange={handleChange}
                rows={5}
                className="w-full rounded-xl border border-orange-600 bg-black px-3 py-3 text-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Tell the community how you like to study or how you help others."
              />
            </label>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-black shadow-lg transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
              <button
                onClick={() => handleNavigate("/")}
                className="rounded-full border border-orange-600/70 px-6 py-3 text-sm font-medium text-orange-200 transition hover:border-orange-400 hover:text-orange-100"
              >
                Back to directory
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default ProfilePage;

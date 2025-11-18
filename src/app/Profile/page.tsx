"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut, type User as FirebaseUser } from "firebase/auth";
import {
  filterCatalog,
  sortSubjects,
  SUBJECT_LIBRARY,
  type SubjectCategory,
} from "../lib/subjects";

const toSubjectArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((subject): subject is string => typeof subject === "string");
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((subject) => subject.trim())
      .filter(Boolean);
  }
  return [];
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const ProfilePage = () => {
  const [userData, setUserData] = useState({
    name: "",
    grade: "",
    tutorSubjects: [] as string[],
    tutorBio: "",
    learnerSubjects: [] as string[],
    learnerBio: "",
    availableDays: [] as string[],
    gmail: "",
    snapchat: "",
    instagram: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tutorSearchQuery, setTutorSearchQuery] = useState("");
  const [learnerSearchQuery, setLearnerSearchQuery] = useState("");

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

          const rawTutorSubjects = toSubjectArray(data.tutorSubjects);
          const rawLearnerSubjects = toSubjectArray(data.learnerSubjects);
          const fallbackSubjects = toSubjectArray(data.subjects);

          const roleValue =
            typeof data.role === "string" ? data.role.toLowerCase() : undefined;

          const tutorSubjects =
            rawTutorSubjects.length > 0
              ? rawTutorSubjects
              : roleValue && roleValue === "learner"
                ? []
                : fallbackSubjects;

          const learnerSubjects =
            rawLearnerSubjects.length > 0
              ? rawLearnerSubjects
              : roleValue === "tutor"
                ? []
                : fallbackSubjects;

          const tutorBio =
            typeof data.tutorBio === "string"
              ? data.tutorBio
              : roleValue && (roleValue === "tutor" || roleValue === "both")
                ? (data.bio as string) || ""
                : "";

          const learnerBio =
            typeof data.learnerBio === "string"
              ? data.learnerBio
              : !roleValue || roleValue === "learner" || roleValue === "both"
                ? (data.bio as string) || ""
                : "";

          setUserData({
            name: data.name || "",
            grade: data.grade || "",
            tutorSubjects,
            tutorBio,
            learnerSubjects,
            learnerBio,
            availableDays: Array.isArray(data.availableDays)
              ? data.availableDays.filter((d: unknown) => typeof d === "string")
              : [],
            gmail: typeof data.gmail === "string" ? data.gmail : "",
            snapchat: typeof data.snapchat === "string" ? data.snapchat : "",
            instagram: typeof data.instagram === "string" ? data.instagram : "",
          });

        } else {
          setUserData((prev) => ({
            ...prev,
            name: authUser.displayName || "",
          }));
        }
      } catch (error) {
        console.error("Failed to load profile data:", error);
        setError("Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    fetchUserData();
  }, [authUser]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const libraryCatalog = useMemo<SubjectCategory[]>(
    () => SUBJECT_LIBRARY.map((category) => ({ ...category, courses: category.courses.slice() })),
    []
  );

  const filteredTutorCatalog = useMemo(
    () => filterCatalog(libraryCatalog, tutorSearchQuery),
    [libraryCatalog, tutorSearchQuery]
  );

  const filteredLearnerCatalog = useMemo(
    () => filterCatalog(libraryCatalog, learnerSearchQuery),
    [libraryCatalog, learnerSearchQuery]
  );

  const toggleSubject = (field: "tutorSubjects" | "learnerSubjects", subject: string) => {
    setUserData((prev) => {
      const current = new Set(prev[field]);
      if (current.has(subject)) {
        current.delete(subject);
      } else {
        current.add(subject);
      }
      return {
        ...prev,
        [field]: Array.from(current).sort((a, b) =>
          a.localeCompare(b, undefined, { sensitivity: "base" })
        ),
      };
    });
  };

  const removeSubject = (field: "tutorSubjects" | "learnerSubjects", subject: string) => {
    setUserData((prev) => ({
      ...prev,
      [field]: prev[field].filter((entry) => entry !== subject),
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
      const normalizeListInput = (values: string[]) =>
        sortSubjects(
          Array.from(
            new Set(
              values
                .map((subject) => subject.trim())
                .filter(Boolean)
            )
          )
        );

      const normalizedTutorSubjects = normalizeListInput(userData.tutorSubjects);
      const normalizedLearnerSubjects = normalizeListInput(userData.learnerSubjects);
      const combinedSubjects = sortSubjects(
        Array.from(new Set([...normalizedTutorSubjects, ...normalizedLearnerSubjects]))
      );

      const tutorBio = userData.tutorBio.trim();
      const learnerBio = userData.learnerBio.trim();

      const nextRole =
        normalizedTutorSubjects.length > 0 && normalizedLearnerSubjects.length > 0
          ? "both"
          : normalizedTutorSubjects.length > 0
            ? "tutor"
            : "learner";

      await setDoc(docRef, {
        name: userData.name.trim(),
        grade: userData.grade.trim(),
        role: nextRole,
        subjects: combinedSubjects,
        tutorSubjects: normalizedTutorSubjects,
        learnerSubjects: normalizedLearnerSubjects,
        tutorBio,
        learnerBio,
        bio: tutorBio || learnerBio,
        availableDays: userData.availableDays,
        gmail: userData.gmail?.trim() || "",
        snapchat: userData.snapchat?.trim() || "",
        instagram: userData.instagram?.trim() || "",
      }, { merge: true });
      router.push("/");
    } catch (e) {
      console.error("Failed to save profile:", e);
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };
  const toggleAvailableDay = (day: string) => {
    setUserData((prev) => {
      const current = new Set(prev.availableDays);
      if (current.has(day)) {
        current.delete(day);
      } else {
        current.add(day);
      }
      return {
        ...prev,
        availableDays: Array.from(current),
      };
    });
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
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="flex h-full flex-col gap-4 rounded-2xl border border-orange-700/40 bg-gray-950/40 p-5">
                <div>
                  <h2 className="text-xl font-semibold text-orange-200">Tutor Profile</h2>
                  <p className="mt-1 text-xs text-orange-200/70">
                    Share what you can teach classmates who need a boost.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2">
                    {userData.tutorSubjects.length > 0 ? (
                      userData.tutorSubjects.map((subject) => (
                        <span
                          key={subject}
                          className="group inline-flex items-center gap-2 rounded-full border border-orange-500/40 bg-orange-500/20 px-3 py-1 text-xs font-medium text-orange-100"
                        >
                          {subject}
                          <button
                            type="button"
                            onClick={() => removeSubject("tutorSubjects", subject)}
                            className="rounded-full border border-orange-500/20 bg-black/30 px-1 text-[10px] font-bold text-orange-200 transition group-hover:border-orange-300 group-hover:text-orange-50"
                            aria-label={`Remove ${subject}`}
                          >
                            ×
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs italic text-orange-200/60">
                        No classes selected yet.
                      </span>
                    )}
                  </div>
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-orange-200">Find classes you can teach</span>
                    <input
                      type="search"
                      value={tutorSearchQuery}
                      onChange={(event) => setTutorSearchQuery(event.target.value)}
                      placeholder="Search by class or category (e.g. Geometry, English, Science)"
                      className="w-full rounded-xl border border-orange-600 bg-black px-3 py-2 text-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </label>
                  <div className="rounded-2xl border border-orange-700/40 bg-black/40 p-4 max-h-80 overflow-y-auto">
                    <div className="flex flex-col gap-4">
                      {filteredTutorCatalog.length > 0 ? (
                        filteredTutorCatalog.map((category) => (
                          <div key={category.label} className="space-y-2">
                            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-300/80">
                              {category.label}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {category.courses.map((course) => {
                                const isSelected = userData.tutorSubjects.includes(course);
                                return (
                                  <button
                                    key={course}
                                    type="button"
                                    onClick={() => toggleSubject("tutorSubjects", course)}
                                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                                      isSelected
                                        ? "border-orange-400 bg-orange-500 text-black shadow"
                                        : "border-orange-600/70 bg-black/70 text-orange-200 hover:border-orange-400 hover:text-orange-100"
                                    }`}
                                  >
                                    {course}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-orange-200/70">
                          No classes match &ldquo;{tutorSearchQuery}&rdquo;. Try a different keyword.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-orange-200">Tutor bio</span>
                  <textarea
                    name="tutorBio"
                    value={userData.tutorBio}
                    onChange={handleChange}
                    rows={5}
                    className="w-full rounded-xl border border-orange-600 bg-black px-3 py-3 text-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Explain how you guide and support other students."
                  />
                </label>
              </div>
              <div className="flex h-full flex-col gap-4 rounded-2xl border border-orange-700/40 bg-gray-950/40 p-5">
                <div>
                  <h2 className="text-xl font-semibold text-orange-200">Learner Profile</h2>
                  <p className="mt-1 text-xs text-orange-200/70">
                    Tell tutors where you want help so they can reach out.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2">
                    {userData.learnerSubjects.length > 0 ? (
                      userData.learnerSubjects.map((subject) => (
                        <span
                          key={subject}
                          className="group inline-flex items-center gap-2 rounded-full border border-orange-500/40 bg-orange-500/20 px-3 py-1 text-xs font-medium text-orange-100"
                        >
                          {subject}
                          <button
                            type="button"
                            onClick={() => removeSubject("learnerSubjects", subject)}
                            className="rounded-full border border-orange-500/20 bg-black/30 px-1 text-[10px] font-bold text-orange-200 transition group-hover:border-orange-300 group-hover:text-orange-50"
                            aria-label={`Remove ${subject}`}
                          >
                            ×
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs italic text-orange-200/60">
                        No classes selected yet.
                      </span>
                    )}
                  </div>
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-orange-200">Find classes you&apos;re learning</span>
                    <input
                      type="search"
                      value={learnerSearchQuery}
                      onChange={(event) => setLearnerSearchQuery(event.target.value)}
                      placeholder="Search by class or category (e.g. Chemistry, Performing Arts)"
                      className="w-full rounded-xl border border-orange-600 bg-black px-3 py-2 text-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </label>
                  <div className="rounded-2xl border border-orange-700/40 bg-black/40 p-4 max-h-80 overflow-y-auto">
                    <div className="flex flex-col gap-4">
                      {filteredLearnerCatalog.length > 0 ? (
                        filteredLearnerCatalog.map((category) => (
                          <div key={category.label} className="space-y-2">
                            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-300/80">
                              {category.label}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {category.courses.map((course) => {
                                const isSelected = userData.learnerSubjects.includes(course);
                                return (
                                  <button
                                    key={course}
                                    type="button"
                                    onClick={() => toggleSubject("learnerSubjects", course)}
                                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                                      isSelected
                                        ? "border-orange-400 bg-orange-500 text-black shadow"
                                        : "border-orange-600/70 bg-black/70 text-orange-200 hover:border-orange-400 hover:text-orange-100"
                                    }`}
                                  >
                                    {course}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-orange-200/70">
                          No classes match &ldquo;{learnerSearchQuery}&rdquo;. Try another search.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-orange-200">Learner bio</span>
                  <textarea
                    name="learnerBio"
                    value={userData.learnerBio}
                    onChange={handleChange}
                    rows={5}
                    className="w-full rounded-xl border border-orange-600 bg-black px-3 py-3 text-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Share how you like to learn or what kind of support you need."
                  />
                </label>
              </div>
            </div>

            {/* Days of the week availability */}
            <div className="mt-8">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-orange-200">
                  When are you available for sessions?
                </span>
                <div className="flex flex-wrap gap-4 mt-2">
                  {DAYS.map((day) => (
                    <label key={day} className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={userData.availableDays.includes(day)}
                        onChange={() => toggleAvailableDay(day)}
                        className="form-checkbox accent-orange-500 h-4 w-4 rounded border-orange-600 bg-black"
                      />
                      <span className="text-orange-200 text-sm">{day}</span>
                    </label>
                  ))}
                </div>
              </label>
            </div>

            {/* Contact Information */}
            <div className="mt-8 rounded-2xl border border-orange-700/40 bg-gray-950/40 p-5">
              <h2 className="text-xl font-semibold text-orange-200 mb-2">Contact Information</h2>
              <div className="grid gap-5 md:grid-cols-3">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-orange-200">Gmail</span>
                  <input
                    type="email"
                    name="gmail"
                    value={userData.gmail}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-orange-600 bg-black px-3 py-2 text-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="youraddress@gmail.com"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-orange-200">Snapchat</span>
                  <input
                    type="text"
                    name="snapchat"
                    value={userData.snapchat}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-orange-600 bg-black px-3 py-2 text-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Snapchat username"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-orange-200">Instagram</span>
                  <input
                    type="text"
                    name="instagram"
                    value={userData.instagram}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-orange-600 bg-black px-3 py-2 text-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Instagram handle"
                  />
                </label>
              </div>
            </div>

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

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "./lib/firebase";
import { onAuthStateChanged, signOut, type User as FirebaseAuthUser } from "firebase/auth";
import { ThemeToggle } from "./components/ThemeToggle";
import { useTheme } from "./lib/theme";

interface User {
  id: string;
  name: string;
  email: string;
  grade?: string;
  role?: string;
  subjects?: string[];
  bio?: string;
  tutorSubjects?: string[];
  learnerSubjects?: string[];
  tutorBio?: string;
  learnerBio?: string;
  availableDays?: string[];
}

function hasDayOverlap(viewerDays: string[] = [], userDays: string[] = []) {
  if (!Array.isArray(viewerDays) || !Array.isArray(userDays)) return false;
  const viewerSet = new Set(viewerDays.map((d) => d.trim().toLowerCase()));
  return userDays.some((d) => viewerSet.has(d.trim().toLowerCase()));
}

const normalizeSubjects = (subjects?: string[]) =>
  (subjects ?? [])
    .map((subject) => (typeof subject === "string" ? subject.trim() : ""))
    .filter((subject) => subject.length > 0);

const getTutorSubjects = (user: User): string[] => {
  const tutorSubjects = normalizeSubjects(user.tutorSubjects);
  if (tutorSubjects.length > 0) return tutorSubjects;
  const roleValue = user.role?.toLowerCase();
  if (roleValue === "tutor" || roleValue === "both") return normalizeSubjects(user.subjects);
  return [];
};

const getLearnerSubjects = (user: User): string[] => {
  const learnerSubjects = normalizeSubjects(user.learnerSubjects);
  if (learnerSubjects.length > 0) return learnerSubjects;
  const roleValue = user.role?.toLowerCase();
  if (!roleValue || roleValue === "learner" || roleValue === "both")
    return normalizeSubjects(user.subjects);
  return [];
};

const getTutorBio = (user: User): string | undefined => {
  if (user.tutorBio && user.tutorBio.trim()) return user.tutorBio;
  const roleValue = user.role?.toLowerCase();
  if (roleValue === "tutor" || roleValue === "both") return user.bio;
  return undefined;
};

const getLearnerBio = (user: User): string | undefined => {
  if (user.learnerBio && user.learnerBio.trim()) return user.learnerBio;
  const roleValue = user.role?.toLowerCase();
  if (!roleValue || roleValue === "learner" || roleValue === "both") return user.bio;
  return undefined;
};

const gradeColorMap: Record<
  number,
  { light: string; dark: string }
> = {
  9: {
    light: "border-amber-300 bg-amber-100 text-amber-900",
    dark: "border-amber-300/70 bg-amber-500/20 text-amber-100",
  },
  10: {
    light: "border-emerald-300 bg-emerald-100 text-emerald-900",
    dark: "border-emerald-300/70 bg-emerald-500/20 text-emerald-100",
  },
  11: {
    light: "border-sky-300 bg-sky-100 text-sky-900",
    dark: "border-sky-300/70 bg-sky-500/20 text-sky-100",
  },
  12: {
    light: "border-rose-300 bg-rose-100 text-rose-900",
    dark: "border-rose-300/70 bg-rose-500/20 text-rose-100",
  },
};

const getGradeBadgeClasses = (grade: string | undefined, isLight: boolean) => {
  const numericGrade = grade ? parseInt(grade, 10) : NaN;
  const palette = gradeColorMap[numericGrade as keyof typeof gradeColorMap];
  if (palette) return palette[isLight ? "light" : "dark"];
  return isLight
    ? "border-slate-200 bg-white/70 text-slate-700"
    : "border-slate-600 bg-slate-900/50 text-slate-100";
};

const getSubjectChipClasses = (matched: boolean, isLight: boolean) => {
  if (matched) {
    return isLight
      ? "border-emerald-400 bg-emerald-50 text-emerald-900 shadow-[0_12px_30px_-18px_rgba(16,185,129,0.6)]"
      : "border-emerald-300/70 bg-emerald-500/20 text-emerald-100 shadow-[0_12px_30px_-18px_rgba(16,185,129,0.7)]";
  }
  return isLight
    ? "border-slate-200 bg-white/70 text-slate-800"
    : "border-slate-700 bg-slate-900/60 text-slate-100";
};

const matchedLabelClass = (isLight: boolean) =>
  isLight ? "text-emerald-700" : "text-emerald-200";

const buildMatchLabel = (subjects: string[]) => {
  if (subjects.length === 0) return "";
  if (subjects.length === 1) return subjects[0];
  return `${subjects.slice(0, -1).join(", ")} & ${subjects[subjects.length - 1]}`;
};

export default function HomePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseAuthUser | null>(null);
  const [showAllTutors, setShowAllTutors] = useState(false);
  const [showAllLearners, setShowAllLearners] = useState(false);
  const [tab, setTab] = useState<"tutors" | "learners">("tutors");
  const [showAllSubjects, setShowAllSubjects] = useState(false);
  const { theme } = useTheme();
  const isLight = theme === "light";

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
      setUsers(usersList);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (authChecked && !currentUser) {
      router.push("/signin");
    }
  }, [authChecked, currentUser, router]);

  const viewerProfile = useMemo(
    () => (currentUser ? users.find((u) => u.id === currentUser.uid) ?? null : null),
    [users, currentUser]
  );

  const viewerLearnerSubjects = useMemo(
    () => (viewerProfile ? getLearnerSubjects(viewerProfile) : []),
    [viewerProfile]
  );

  const viewerTutorSubjects = useMemo(
    () => (viewerProfile ? getTutorSubjects(viewerProfile) : []),
    [viewerProfile]
  );

  const viewerLearnerSubjectSet = useMemo(
    () => new Set(viewerLearnerSubjects.map((s) => s.toLowerCase())),
    [viewerLearnerSubjects]
  );

  const viewerTutorSubjectSet = useMemo(
    () => new Set(viewerTutorSubjects.map((s) => s.toLowerCase())),
    [viewerTutorSubjects]
  );

  const hasViewerLearnerSubjects = viewerLearnerSubjects.length > 0;
  const hasViewerTutorSubjects = viewerTutorSubjects.length > 0;

  const tutors = useMemo(() => {
    if (!currentUser) return [];
    if (!showAllTutors && !hasViewerLearnerSubjects) return [];
    return users.filter((user) => {
      if (user.id === currentUser.uid) return false;
      const tutorSubjects = getTutorSubjects(user);
      const viewerDays = viewerProfile?.availableDays || [];
      const userDays = user.availableDays || [];
      if (viewerDays.length && userDays.length && !hasDayOverlap(viewerDays, userDays))
        return false;
      if (tutorSubjects.length === 0) return showAllTutors;
      if (showAllTutors) return true;
      return tutorSubjects.some((s) => viewerLearnerSubjectSet.has(s.toLowerCase()));
    });
  }, [users, currentUser, showAllTutors, hasViewerLearnerSubjects, viewerLearnerSubjectSet, viewerProfile]);

  const learners = useMemo(() => {
    if (!currentUser) return [];
    if (!showAllLearners && !hasViewerTutorSubjects) return [];
    return users.filter((user) => {
      if (user.id === currentUser.uid) return false;
      const learnerSubjects = getLearnerSubjects(user);
      const viewerDays = viewerProfile?.availableDays || [];
      const userDays = user.availableDays || [];
      if (viewerDays.length && userDays.length && !hasDayOverlap(viewerDays, userDays))
        return false;
      if (learnerSubjects.length === 0) return showAllLearners;
      if (showAllLearners) return true;
      return learnerSubjects.some((s) => viewerTutorSubjectSet.has(s.toLowerCase()));
    });
  }, [users, currentUser, showAllLearners, hasViewerTutorSubjects, viewerTutorSubjectSet, viewerProfile]);

  const shellStyle = { background: "var(--background)" };
  const headerClass = `border-b backdrop-blur ${
    isLight ? "border-orange-200/70 bg-white/70" : "border-orange-500/25 bg-black/70"
  }`;
  const navButtonClass = `rounded-full border px-4 py-1 text-sm font-semibold transition ${
    isLight
      ? "border-orange-200 text-amber-900 bg-white/70 hover:border-orange-400 hover:text-orange-900 shadow-sm"
      : "border-orange-500/35 text-orange-100 bg-black/60 hover:border-orange-300 hover:text-white shadow-sm"
  }`;
  const tabActiveClass = isLight
    ? "bg-gradient-to-r from-orange-500 to-amber-300 text-slate-900 border-orange-200 shadow-[0_18px_35px_-22px_rgba(249,115,22,0.55)]"
    : "bg-gradient-to-r from-orange-500 to-amber-400 text-slate-900 border-orange-300/70 shadow-[0_18px_35px_-22px_rgba(249,115,22,0.65)]";
  const tabInactiveClass = isLight
    ? "bg-white/80 text-amber-900 border-orange-200 hover:border-orange-400 hover:text-orange-900"
    : "bg-black/60 text-orange-100 border-orange-500/30 hover:border-orange-300 hover:text-white";
  const sectionShadow = isLight
    ? "shadow-[0_30px_80px_-35px_rgba(249,115,22,0.45)]"
    : "shadow-[0_30px_80px_-35px_rgba(249,115,22,0.5)]";
  const cardHoverShadow = isLight
    ? "hover:shadow-[0_25px_70px_-40px_rgba(249,115,22,0.55)]"
    : "hover:shadow-[0_25px_70px_-40px_rgba(249,115,22,0.55)]";
  const primaryButtonClass = isLight
    ? "rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-1 text-sm font-semibold text-white shadow-md transition hover:shadow-lg"
    : "rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-1 text-sm font-semibold text-black shadow-md transition hover:shadow-lg";

  const handleNavigate = (path: string) => router.push(path);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setShowAllTutors(false);
      setShowAllLearners(false);
      router.push("/signin");
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  if (!authChecked) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center ${isLight ? "text-amber-900" : "text-orange-100"}`}
        style={{ background: "var(--background)" }}
      >
        Checking authentication...
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center ${isLight ? "text-amber-900" : "text-orange-100"}`}
        style={{ background: "var(--background)" }}
      >
        Loading users...
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={shellStyle}>
      <header className={headerClass}>
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNavigate("/")}
              className={`text-left text-2xl font-bold tracking-tight transition hover:opacity-80 ${
                isLight ? "text-slate-900" : "text-orange-100"
              }`}
            >
              Peer Connect
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ThemeToggle />
            <button onClick={() => handleNavigate("/")} className={navButtonClass}>
              Home
            </button>
            <button onClick={() => handleNavigate("/Profile")} className={navButtonClass}>
              Profile
            </button>
            {!currentUser ? (
              <button onClick={() => handleNavigate("/signin")} className={primaryButtonClass}>
                Sign In
              </button>
            ) : (
              <button onClick={handleSignOut} className={primaryButtonClass}>
                Sign Out
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10 flex justify-center gap-4">
          <button
            type="button"
            onClick={() => setTab("tutors")}
            className={`rounded-full border px-5 py-2 text-sm font-semibold transition ${
              tab === "tutors" ? tabActiveClass : tabInactiveClass
            }`}
          >
            Tutors
          </button>
          <button
            type="button"
            onClick={() => setTab("learners")}
            className={`rounded-full border px-5 py-2 text-sm font-semibold transition ${
              tab === "learners" ? tabActiveClass : tabInactiveClass
            }`}
          >
            Learners
          </button>
        </div>

        <div className={`rounded-3xl border app-surface px-6 py-8 sm:px-10 ${sectionShadow}`}>
          <h1 className={`text-4xl font-bold sm:text-5xl ${isLight ? "text-slate-900" : "text-white"}`}>
            Find Peer Tutors & Learners
          </h1>
          <p className={`mt-3 max-w-2xl text-sm leading-relaxed app-muted`}>
            Browse classmates who are ready to help or learn. We highlight people who overlap with you—use “Show all”
            if you want to browse the full directory.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
            {hasViewerLearnerSubjects && (
              <span className={`app-chip inline-flex items-center gap-2 rounded-full border px-3 py-1`}>
                Learner matches based on: {viewerLearnerSubjects.join(", ")}
              </span>
            )}
            {hasViewerTutorSubjects && (
              <span className={`app-chip inline-flex items-center gap-2 rounded-full border px-3 py-1`}>
                Tutor matches based on: {viewerTutorSubjects.join(", ")}
              </span>
            )}
          </div>
        </div>

        <div className="mt-12">
          {tab === "tutors" && (
            <section className={`rounded-3xl border app-surface p-6 ${sectionShadow}`}>
              <header className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className={`text-2xl font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>
                    Tutor Matches
                  </h2>
                  <p className="app-muted text-xs sm:text-sm">
                    See tutors who cover your learning subjects. Matched subjects are highlighted.
                  </p>
                </div>
                <span className={`text-xs uppercase tracking-[0.25em] ${isLight ? "text-amber-800/80" : "text-orange-200/80"}`}>
                  {tutors.length} matches
                </span>
              </header>
              <div className={`mb-4 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm ${isLight ? "text-amber-800/80" : "text-orange-200/80"}`}>
                <span>
                  {showAllTutors
                    ? "Showing every tutor in the directory."
                    : "Showing tutors who cover the subjects you're learning."}
                </span>
                <button
                  type="button"
                  onClick={() => setShowAllTutors((prev) => !prev)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition sm:text-sm ${
                    isLight
                      ? "border-orange-200 text-amber-900 hover:border-orange-400 hover:text-orange-900"
                      : "border-orange-500/40 text-orange-100 hover:border-orange-200 hover:text-white"
                  }`}
                >
                  {showAllTutors ? "Show matches only" : "Show all"}
                </button>
              </div>
              <div className="grid gap-5">
                {tutors.length > 0 ? (
                  tutors.map((user) => {
                    const tutorBio = getTutorBio(user);
                    const tutorSubjects = getTutorSubjects(user);
                    const availableDays = user.availableDays || [];
                    const matchedTutorSubjects = tutorSubjects.filter((subject) =>
                      viewerLearnerSubjectSet.has(subject.toLowerCase())
                    );
                    const displayTutorSubjects =
                      matchedTutorSubjects.length > 0 && !showAllSubjects
                        ? matchedTutorSubjects
                        : tutorSubjects;

                    return (
                      <article
                        key={user.id}
                        className={`rounded-2xl border app-surface-soft p-5 transition hover:-translate-y-[2px] ${cardHoverShadow}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h3 className={`text-xl font-semibold ${isLight ? "text-slate-900" : "text-amber-50"}`}>
                              {user.name || "Unnamed Tutor"}
                            </h3>
                            <p className={`text-sm ${isLight ? "text-amber-800/80" : "text-orange-200/80"}`}>
                              Ready to help classmates learn
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${getGradeBadgeClasses(user.grade, isLight)}`}
                          >
                            Grade {user.grade || "N/A"}
                          </span>
                        </div>
                        {availableDays.length > 0 && (
                          <p className={`mt-2 text-xs ${isLight ? "text-amber-800/80" : "text-orange-200/80"}`}>
                            Available: {availableDays.join(", ")}
                          </p>
                        )}
                        {tutorBio && (
                          <p className={`mt-3 text-sm ${isLight ? "text-amber-900" : "text-orange-100/80"}`}>
                            Bio: {tutorBio}
                          </p>
                        )}
                        {matchedTutorSubjects.length > 0 && (
                          <p className={`mt-3 text-xs font-semibold ${matchedLabelClass(isLight)}`}>
                            Matched on: {buildMatchLabel(matchedTutorSubjects)}
                          </p>
                        )}
                        {displayTutorSubjects.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {displayTutorSubjects.map((subject) => {
                              const matched = matchedTutorSubjects.some(
                                (entry) => entry.toLowerCase() === subject.toLowerCase()
                              );
                              return (
                                <span
                                  key={subject}
                                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${getSubjectChipClasses(matched, isLight)}`}
                                >
                                  {subject}
                                  {matched && (
                                    <span
                                      className={`text-[10px] uppercase tracking-wide ${isLight ? "text-emerald-700" : "text-emerald-100"}`}
                                    >
                                      Match
                                    </span>
                                  )}
                                </span>
                              );
                            })}
                          </div>
                        )}
                        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                          <p className={isLight ? "text-amber-800/80" : "text-orange-200/80"}>{user.email}</p>
                          <button
                            type="button"
                            onClick={() => handleNavigate(`/contact/${user.id}/`)}
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                              isLight
                                ? "bg-orange-500 text-white hover:bg-orange-400"
                                : "bg-orange-400 text-black hover:bg-orange-300"
                            }`}
                          >
                            View Contact
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAllSubjects((prev) => !prev)}
                            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                              isLight
                                ? "border-orange-200 text-amber-900 hover:border-orange-400 hover:text-orange-900"
                                : "border-orange-500/40 text-orange-100 hover:border-orange-200 hover:text-white"
                            }`}
                          >
                            {showAllSubjects ? "Show matched subjects" : "Show all subjects"}
                          </button>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div
                    className={`flex flex-col items-center gap-3 rounded-xl border border-dashed px-4 py-8 text-center text-sm app-surface-soft ${
                      isLight
                        ? "border-orange-200/80 text-amber-900"
                        : "border-orange-500/40 text-orange-100"
                    }`}
                  >
                    <p>
                      {!currentUser
                        ? "Sign in and add the classes you're learning to see matching tutors."
                        : !hasViewerLearnerSubjects && !showAllTutors
                          ? "Add the classes you're learning in your profile to see matching tutors."
                          : "No tutors are available just yet. Check back soon!"}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleNavigate("/Profile")}
                      className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                        isLight
                          ? "border-orange-300 text-amber-900 hover:border-orange-400"
                          : "border-orange-400 text-orange-100 hover:border-orange-200"
                      }`}
                    >
                      Go to profile
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {tab === "learners" && (
            <section className={`rounded-3xl border app-surface p-6 ${sectionShadow}`}>
              <header className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className={`text-2xl font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>
                    Learner Matches
                  </h2>
                  <p className="app-muted text-xs sm:text-sm">
                    These learners need help with subjects you tutor. Matches are highlighted.
                  </p>
                </div>
                <span className={`text-xs uppercase tracking-[0.25em] ${isLight ? "text-amber-800/80" : "text-orange-200/80"}`}>
                  {learners.length} matches
                </span>
              </header>
              <div className={`mb-4 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm ${isLight ? "text-amber-800/80" : "text-orange-200/80"}`}>
                <span>
                  {showAllLearners
                    ? "Showing every learner in the directory."
                    : "Showing learners who need help with the subjects you teach."}
                </span>
                <button
                  type="button"
                  onClick={() => setShowAllLearners((prev) => !prev)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition sm:text-sm ${
                    isLight
                      ? "border-orange-200 text-amber-900 hover:border-orange-400 hover:text-orange-900"
                      : "border-orange-500/40 text-orange-100 hover:border-orange-200 hover:text-white"
                  }`}
                >
                  {showAllLearners ? "Show matches only" : "Show all"}
                </button>
              </div>
              <div className="grid gap-5">
                {learners.length > 0 ? (
                  learners.map((user) => {
                    const learnerBio = getLearnerBio(user);
                    const learnerSubjects = getLearnerSubjects(user);
                    const availableDays = user.availableDays || [];
                    const matchedLearnerSubjects = learnerSubjects.filter((subject) =>
                      viewerTutorSubjectSet.has(subject.toLowerCase())
                    );
                    const displayLearnerSubjects =
                      matchedLearnerSubjects.length > 0 && !showAllSubjects
                        ? matchedLearnerSubjects
                        : learnerSubjects;

                    return (
                      <article
                        key={user.id}
                        className={`rounded-2xl border app-surface-soft p-5 transition hover:-translate-y-[2px] ${cardHoverShadow}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h3 className={`text-xl font-semibold ${isLight ? "text-slate-900" : "text-amber-50"}`}>
                              {user.name || "Unnamed Student"}
                            </h3>
                            <p className={`text-sm ${isLight ? "text-amber-800/80" : "text-orange-200/80"}`}>
                              Looking for a peer tutor
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${getGradeBadgeClasses(user.grade, isLight)}`}
                          >
                            Grade {user.grade || "N/A"}
                          </span>
                        </div>
                        {availableDays.length > 0 && (
                          <p className={`mt-2 text-xs ${isLight ? "text-amber-800/80" : "text-orange-200/80"}`}>
                            Available: {availableDays.join(", ")}
                          </p>
                        )}
                        {learnerBio && (
                          <p className={`mt-3 text-sm ${isLight ? "text-amber-900" : "text-orange-100/80"}`}>
                            Bio: {learnerBio}
                          </p>
                        )}
                        {matchedLearnerSubjects.length > 0 && (
                          <p className={`mt-3 text-xs font-semibold ${matchedLabelClass(isLight)}`}>
                            Matched on: {buildMatchLabel(matchedLearnerSubjects)}
                          </p>
                        )}
                        {displayLearnerSubjects.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {displayLearnerSubjects.map((subject) => {
                              const matched = matchedLearnerSubjects.some(
                                (entry) => entry.toLowerCase() === subject.toLowerCase()
                              );
                              return (
                                <span
                                  key={subject}
                                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${getSubjectChipClasses(matched, isLight)}`}
                                >
                                  {subject}
                                  {matched && (
                                    <span
                                      className={`text-[10px] uppercase tracking-wide ${isLight ? "text-emerald-700" : "text-emerald-100"}`}
                                    >
                                      Match
                                    </span>
                                  )}
                                </span>
                              );
                            })}
                          </div>
                        )}
                        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                          <p className={isLight ? "text-amber-800/80" : "text-orange-200/80"}>{user.email}</p>
                          <button
                            type="button"
                            onClick={() => handleNavigate(`/contact/${user.id}/`)}
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                              isLight
                                ? "bg-orange-500 text-white hover:bg-orange-400"
                                : "bg-orange-400 text-black hover:bg-orange-300"
                            }`}
                          >
                            View Contact
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAllSubjects((prev) => !prev)}
                            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                              isLight
                                ? "border-orange-200 text-amber-900 hover:border-orange-400 hover:text-orange-900"
                                : "border-orange-500/40 text-orange-100 hover:border-orange-200 hover:text-white"
                            }`}
                          >
                            {showAllSubjects ? "Show matched subjects" : "Show all subjects"}
                          </button>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div
                    className={`flex flex-col items-center gap-3 rounded-xl border border-dashed px-4 py-8 text-center text-sm app-surface-soft ${
                      isLight
                        ? "border-orange-200/80 text-amber-900"
                        : "border-orange-500/40 text-orange-100"
                    }`}
                  >
                    <p>
                      {!currentUser
                        ? "Sign in and add the classes you can teach to see students who need your help."
                        : !hasViewerTutorSubjects && !showAllLearners
                          ? "Add the classes you can teach in your profile to see learners who need support."
                          : "No learners are looking for help just yet. Check back soon!"}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleNavigate("/Profile")}
                      className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                        isLight
                          ? "border-orange-300 text-amber-900 hover:border-orange-400"
                          : "border-orange-400 text-orange-100 hover:border-orange-200"
                      }`}
                    >
                      Go to profile
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

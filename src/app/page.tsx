"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "./lib/firebase";
import { onAuthStateChanged, signOut, type User as FirebaseAuthUser } from "firebase/auth";

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
  availableDays?: string[]; // e.g. ["Monday", "Wednesday"]
}
// Helper: returns true if there is any overlap between viewerDays and userDays
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
  if (tutorSubjects.length > 0) {
    return tutorSubjects;
  }
  const roleValue = user.role?.toLowerCase();
  if (roleValue === "tutor" || roleValue === "both") {
    return normalizeSubjects(user.subjects);
  }
  return [];
};

const getLearnerSubjects = (user: User): string[] => {
  const learnerSubjects = normalizeSubjects(user.learnerSubjects);
  if (learnerSubjects.length > 0) {
    return learnerSubjects;
  }
  const roleValue = user.role?.toLowerCase();
  if (!roleValue || roleValue === "learner" || roleValue === "both") {
    return normalizeSubjects(user.subjects);
  }
  return [];
};

const getTutorBio = (user: User): string | undefined => {
  if (user.tutorBio && user.tutorBio.trim()) {
    return user.tutorBio;
  }
  const roleValue = user.role?.toLowerCase();
  if (roleValue === "tutor" || roleValue === "both") {
    return user.bio;
  }
  return undefined;
};

const getLearnerBio = (user: User): string | undefined => {
  if (user.learnerBio && user.learnerBio.trim()) {
    return user.learnerBio;
  }
  const roleValue = user.role?.toLowerCase();
  if (!roleValue || roleValue === "learner" || roleValue === "both") {
    return user.bio;
  }
  return undefined;
};

export default function HomePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<FirebaseAuthUser | null>(null);
  const [showAllTutors, setShowAllTutors] = useState(false);
  const [showAllLearners, setShowAllLearners] = useState(false);
  const [tab, setTab] = useState<"tutors" | "learners">("tutors");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
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

  const viewerProfile = useMemo(
    () => (currentUser ? users.find((user) => user.id === currentUser.uid) ?? null : null),
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
    () => new Set<string>(viewerLearnerSubjects.map((subject) => subject.toLowerCase())),
    [viewerLearnerSubjects]
  );

  const viewerTutorSubjectSet = useMemo(
    () => new Set<string>(viewerTutorSubjects.map((subject) => subject.toLowerCase())),
    [viewerTutorSubjects]
  );

  const hasViewerLearnerSubjects = viewerLearnerSubjects.length > 0;
  const hasViewerTutorSubjects = viewerTutorSubjects.length > 0;
  const tutors = useMemo(() => {
    if (!currentUser) {
      return [];
    }
    if (!showAllTutors && !hasViewerLearnerSubjects) {
      return [];
    }
    return users.filter((user) => {
      if (user.id === currentUser.uid) {
        return false;
      }
      const tutorSubjects = getTutorSubjects(user);
      // Availability matching: both must have availableDays, must overlap
      const viewerDays = viewerProfile?.availableDays || [];
      const userDays = user.availableDays || [];
      if (viewerDays.length > 0 && userDays.length > 0 && !hasDayOverlap(viewerDays, userDays)) {
        return false;
      }
      if (tutorSubjects.length === 0) {
        return showAllTutors;
      }
      if (showAllTutors) {
        return true;
      }
      const tutorSubjectsLower = tutorSubjects.map((subject) => subject.toLowerCase());
      return tutorSubjectsLower.some((subject) =>
        viewerLearnerSubjectSet.has(subject)
      );
    });
  }, [users, currentUser, showAllTutors, hasViewerLearnerSubjects, viewerLearnerSubjectSet, viewerProfile]);

  const learners = useMemo(() => {
    if (!currentUser) {
      return [];
    }
    if (!showAllLearners && !hasViewerTutorSubjects) {
      return [];
    }
    return users.filter((user) => {
      if (user.id === currentUser.uid) {
        return false;
      }
      const learnerSubjects = getLearnerSubjects(user);
      // Availability matching: both must have availableDays, must overlap
      const viewerDays = viewerProfile?.availableDays || [];
      const userDays = user.availableDays || [];
      if (viewerDays.length > 0 && userDays.length > 0 && !hasDayOverlap(viewerDays, userDays)) {
        return false;
      }
      if (learnerSubjects.length === 0) {
        return showAllLearners;
      }
      if (showAllLearners) {
        return true;
      }
      const learnerSubjectsLower = learnerSubjects.map((subject) => subject.toLowerCase());
      return learnerSubjectsLower.some((subject) =>
        viewerTutorSubjectSet.has(subject)
      );
    });
  }, [users, currentUser, showAllLearners, hasViewerTutorSubjects, viewerTutorSubjectSet, viewerProfile]);

  const handleNavigate = (path: string) => {
    router.push(path);
  };

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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black text-orange-500">
        Loading users...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-orange-100">
      <header className="border-b border-orange-700/40 bg-black/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
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
            {!currentUser && (
              <button
                onClick={() => handleNavigate("/signin")}
                className="rounded-full bg-orange-500 px-4 py-1 text-sm font-semibold text-black shadow-lg transition hover:bg-orange-400"
              >
                Sign In
              </button>
            )}
            {currentUser && (
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

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex justify-center gap-4 mb-10">
          <button
            type="button"
            onClick={() => setTab("tutors")}
            className={`px-5 py-2 rounded-full text-sm font-semibold border transition ${
              tab === "tutors"
                ? "bg-orange-500 text-black border-orange-400"
                : "bg-black text-orange-300 border-orange-700/50 hover:border-orange-400 hover:text-orange-100"
            }`}
          >
            Tutors
          </button>
          <button
            type="button"
            onClick={() => setTab("learners")}
            className={`px-5 py-2 rounded-full text-sm font-semibold border transition ${
              tab === "learners"
                ? "bg-orange-500 text-black border-orange-400"
                : "bg-black text-orange-300 border-orange-700/50 hover:border-orange-400 hover:text-orange-100"
            }`}
          >
            Learners
          </button>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-orange-300 sm:text-5xl">
            Find Peer Tutors & Learners
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-orange-200/80">
            Browse classmates who are ready to help or learn. By default you&apos;ll see people whose subjects align with yours—use the “Show all” buttons if you want to browse the full directory.
          </p>
        </div>

        <div className="mt-12">
          {tab === "tutors" && (
          <section className="rounded-3xl border border-orange-700/50 bg-black/60 p-6 shadow-[0_30px_60px_-25px_rgba(250,115,22,0.35)]">
            <header className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-orange-300">
                Tutor Matches
              </h2>
              <span className="text-xs uppercase tracking-[0.25em] text-orange-400/70">
                {tutors.length} matches
              </span>
            </header>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-orange-200/70 sm:text-sm">
              <span>
                {showAllTutors
                  ? "Showing every tutor in the directory."
                  : "Showing tutors who cover the subjects you're learning."}
              </span>
              <button
                type="button"
                onClick={() => setShowAllTutors((prev) => !prev)}
                className="rounded-full border border-orange-600/60 px-3 py-1 text-xs font-semibold text-orange-200 transition hover:border-orange-300 hover:text-orange-100 sm:text-sm"
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
                  // Mailto link
                  const subject = encodeURIComponent("Peer Connect - Tutoring Inquiry");
                  const body = encodeURIComponent(
                    `Hi ${user.name || "there"},\n\nI found your profile on Peer Connect and would like to connect about tutoring.\n\nThanks!\n`
                  );
                  const mailto = `mailto:${user.email}?subject=${subject}&body=${body}`;

                  return (
                    <article
                      key={user.id}
                      className="rounded-2xl border border-orange-700/40 bg-gray-900/50 p-5 transition hover:border-orange-400 hover:shadow-[0_20px_45px_-30px_rgba(250,115,22,0.75)]"
                    >
                      <h3 className="text-xl font-semibold text-orange-200">
                        {user.name || "Unnamed Tutor"}
                      </h3>
                      <p className="mt-1 text-sm text-orange-200/80">
                        Grade {user.grade || "N/A"}
                      </p>
                      {availableDays.length > 0 && (
                        <p className="mt-1 text-xs text-orange-300">
                          Available: {availableDays.join(", ")}
                        </p>
                      )}
                      {tutorBio && (
                        <p className="mt-3 text-sm italic text-orange-200/70">
                          “{tutorBio}”
                        </p>
                      )}
                      {tutorSubjects.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {tutorSubjects.map((subject) => (
                            <span
                              key={subject}
                              className="rounded-full border border-orange-500/50 bg-orange-600/20 px-3 py-1 text-xs font-semibold text-orange-200"
                            >
                              {subject}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-4 flex items-center gap-3">
                        <p className="text-xs text-orange-300">{user.email}</p>
                        <button
                          type="button"
                          onClick={() => handleNavigate(`/contact/${user.id}/`)}
                          className="ml-2 rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-black shadow transition hover:bg-orange-400"
                        >
                          View Contact
                        </button>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-orange-500/40 bg-transparent px-4 py-8 text-center text-sm text-orange-200/70">
                  <p>
                    {!currentUser
                      ? "Sign in and add the classes you're learning to see matching tutors."
                      : !hasViewerLearnerSubjects && !showAllTutors
                        ? "Add the classes you're learning in your profile to see matching tutors."
                        : "No tutors are available just yet. Check back soon!"
                    }
                  </p>
                  <button
                    type="button"
                    onClick={() => handleNavigate("/Profile")}
                    className="rounded-full border border-orange-500/60 px-4 py-2 text-xs font-semibold text-orange-200 transition hover:border-orange-300 hover:text-orange-100"
                  >
                    Go to profile
                  </button>
                </div>
              )}
            </div>
          </section>
          )}

          {tab === "learners" && (
          <section className="rounded-3xl border border-orange-700/50 bg-black/60 p-6 shadow-[0_30px_60px_-25px_rgba(250,115,22,0.35)]">
            <header className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-orange-300">
                Learner Matches
              </h2>
              <span className="text-xs uppercase tracking-[0.25em] text-orange-400/70">
                {learners.length} matches
              </span>
            </header>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-orange-200/70 sm:text-sm">
              <span>
                {showAllLearners
                  ? "Showing every learner in the directory."
                  : "Showing learners who need help with the subjects you teach."}
              </span>
              <button
                type="button"
                onClick={() => setShowAllLearners((prev) => !prev)}
                className="rounded-full border border-orange-600/60 px-3 py-1 text-xs font-semibold text-orange-200 transition hover:border-orange-300 hover:text-orange-100 sm:text-sm"
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
                  // Mailto link
                  const subject = encodeURIComponent("Peer Connect - Learning Inquiry");
                  const body = encodeURIComponent(
                    `Hi ${user.name || "there"},\n\nI found your profile on Peer Connect and would like to connect about learning support.\n\nThanks!\n`
                  );
                  const mailto = `mailto:${user.email}?subject=${subject}&body=${body}`;

                  return (
                    <article
                      key={user.id}
                      className="rounded-2xl border border-orange-700/40 bg-gray-900/50 p-5 transition hover:border-orange-400 hover:shadow-[0_20px_45px_-30px_rgba(250,115,22,0.75)]"
                    >
                      <h3 className="text-xl font-semibold text-orange-200">
                        {user.name || "Unnamed Student"}
                      </h3>
                      <p className="mt-1 text-sm text-orange-200/80">
                        Grade {user.grade || "N/A"}
                      </p>
                      {availableDays.length > 0 && (
                        <p className="mt-1 text-xs text-orange-300">
                          Available: {availableDays.join(", ")}
                        </p>
                      )}
                      {learnerBio && (
                        <p className="mt-3 text-sm italic text-orange-200/70">
                          “{learnerBio}”
                        </p>
                      )}
                      {learnerSubjects.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {learnerSubjects.map((subject) => (
                            <span
                              key={subject}
                              className="rounded-full border border-orange-500/50 bg-orange-600/20 px-3 py-1 text-xs font-semibold text-orange-200"
                            >
                              {subject}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-4 flex items-center gap-3">
                        <p className="text-xs text-orange-300">{user.email}</p>
                        <button
                          type="button"
                          onClick={() => handleNavigate(`/contact/${user.id}/`)}
                          className="ml-2 rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-black shadow transition hover:bg-orange-400"
                        >
                          View Contact
                        </button>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-orange-500/40 bg-transparent px-4 py-8 text-center text-sm text-orange-200/70">
                  <p>
                    {!currentUser
                      ? "Sign in and add the classes you can teach to see students who need your help."
                      : !hasViewerTutorSubjects && !showAllLearners
                        ? "Add the classes you can teach in your profile to see learners who need support."
                        : "No learners are looking for help just yet. Check back soon!"
                    }
                  </p>
                  <button
                    type="button"
                    onClick={() => handleNavigate("/Profile")}
                    className="rounded-full border border-orange-500/60 px-4 py-2 text-xs font-semibold text-orange-200 transition hover:border-orange-300 hover:text-orange-100"
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

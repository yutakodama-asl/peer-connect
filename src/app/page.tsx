"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "./lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

interface User {
  id: string;
  name: string;
  email: string;
  grade?: string;
  role?: string;
  subjects?: string[];
  bio?: string;
}

export default function HomePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [subjectFilter, setSubjectFilter] = useState("All");
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

  const uniqueSubjects = useMemo(() => {
    const subjectSet = new Set<string>();
    users.forEach((user) => {
      user.subjects?.forEach((subject) => {
        if (subject) {
          subjectSet.add(subject.trim());
        }
      });
    });
    return Array.from(subjectSet).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (subjectFilter === "All") {
      return users;
    }
    return users.filter((user) =>
      user.subjects?.some(
        (subject) => subject.toLowerCase() === subjectFilter.toLowerCase()
      )
    );
  }, [users, subjectFilter]);

  const tutors = useMemo(
    () =>
      filteredUsers.filter(
        (user) => user.role?.toLowerCase() === "tutor"
      ),
    [filteredUsers]
  );

  const learners = useMemo(
    () =>
      filteredUsers.filter(
        (user) => user.role?.toLowerCase() !== "tutor"
      ),
    [filteredUsers]
  );

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setSubjectFilter("All");
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
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-orange-300 sm:text-5xl">
              Find Peer Tutors & Learners
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-orange-200/80">
              Browse classmates who are ready to help or learn. Use the subject filter to focus on the topics that matter most to you.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm text-orange-200/80">
            <label
              htmlFor="subject-filter"
              className="font-semibold text-orange-300"
            >
              Filter by subject
            </label>
            <select
              id="subject-filter"
              value={subjectFilter}
              onChange={(event) => setSubjectFilter(event.target.value)}
              className="rounded-lg border border-orange-600 bg-black px-3 py-2 text-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="All">All subjects</option>
              {uniqueSubjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <section className="rounded-3xl border border-orange-700/50 bg-black/60 p-6 shadow-[0_30px_60px_-25px_rgba(250,115,22,0.35)]">
            <header className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-orange-300">
                Tutors
              </h2>
              <span className="text-xs uppercase tracking-[0.25em] text-orange-400/70">
                {tutors.length} available
              </span>
            </header>
            <div className="grid gap-5">
              {tutors.length > 0 ? (
                tutors.map((user) => (
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
                    {user.bio && (
                      <p className="mt-3 text-sm italic text-orange-200/70">
                        “{user.bio}”
                      </p>
                    )}
                    {user.subjects && user.subjects.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {user.subjects.map((subject) => (
                          <span
                            key={subject}
                            className="rounded-full border border-orange-500/50 bg-orange-600/20 px-3 py-1 text-xs font-semibold text-orange-200"
                          >
                            {subject}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="mt-4 text-xs text-orange-300">
                      {user.email}
                    </p>
                  </article>
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-orange-500/40 bg-transparent px-4 py-8 text-center text-sm text-orange-200/70">
                  No tutors match this subject yet. Try another filter or check back soon!
                </p>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-orange-700/50 bg-black/60 p-6 shadow-[0_30px_60px_-25px_rgba(250,115,22,0.35)]">
            <header className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-orange-300">
                Students
              </h2>
              <span className="text-xs uppercase tracking-[0.25em] text-orange-400/70">
                {learners.length} looking
              </span>
            </header>
            <div className="grid gap-5">
              {learners.length > 0 ? (
                learners.map((user) => (
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
                    {user.bio && (
                      <p className="mt-3 text-sm italic text-orange-200/70">
                        “{user.bio}”
                      </p>
                    )}
                    {user.subjects && user.subjects.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {user.subjects.map((subject) => (
                          <span
                            key={subject}
                            className="rounded-full border border-orange-500/50 bg-orange-600/20 px-3 py-1 text-xs font-semibold text-orange-200"
                          >
                            {subject}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="mt-4 text-xs text-orange-300">
                      {user.email}
                    </p>
                  </article>
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-orange-500/40 bg-transparent px-4 py-8 text-center text-sm text-orange-200/70">
                  No students match this subject right now. Invite classmates to join Peer Connect!
                </p>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

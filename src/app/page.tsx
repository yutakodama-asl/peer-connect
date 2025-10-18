"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black text-orange-500">
        Loading users...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-orange-500 p-10">
      {/* Edit Profile Button */}
      <div className="flex justify-end mb-6">
        {currentUser && (
          <button
            onClick={() => router.push("/Profile")}
            className="bg-orange-600 hover:bg-orange-700 text-black font-semibold px-5 py-2 rounded-md shadow-md transition"
          >
            Edit My Profile
          </button>
        )}
      </div>

      <h1 className="text-4xl font-bold text-center mb-10 text-orange-400">
        Peer Connect Users
      </h1>

      <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <div
            key={user.id}
            className="bg-gray-900 border border-orange-600 rounded-lg p-6 shadow-md hover:shadow-orange-500 transition"
          >
            <h2 className="text-2xl font-semibold text-orange-400 mb-3">
              {user.name || "Unnamed User"}
            </h2>

            <p className="text-orange-300 mb-2">
              <span className="font-semibold text-orange-500">Role:</span>{" "}
              {user.role || "N/A"}
            </p>

            <p className="text-orange-300 mb-2">
              <span className="font-semibold text-orange-500">Grade:</span>{" "}
              {user.grade || "N/A"}
            </p>

            {user.bio && (
              <p className="text-orange-400 italic mb-4">
                “{user.bio}”
              </p>
            )}

            {user.subjects && user.subjects.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {user.subjects.map((subject) => (
                  <span
                    key={subject}
                    className="bg-orange-700 text-orange-200 px-3 py-1 rounded-full text-sm font-semibold"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            )}

            <p className="text-orange-500 text-sm">{user.email}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
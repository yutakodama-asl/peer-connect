'use client';

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./lib/firebase";

interface User {
  id: string;
  name: string;
  email: string;
  bio?: string;
  experience?: number;
  grade?: number;
  rating?: number;
  role?: string;
  subjects?: string[];
}

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const usersData: User[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as User[];
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen bg-orange-600 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-black mb-12">Users</h1>
        
        {loading ? (
          <div className="text-center py-8">
            <p className="text-black text-xl">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-black text-xl">No users found</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => (
              <div key={user.id} className="bg-black rounded-xl p-6 shadow-lg hover:shadow-2xl transition-shadow duration-200 border-2 border-orange-500">
                <h3 className="text-2xl font-bold text-orange-500 mb-4">{user.name}</h3>
                
                {user.role && (
                  <p className="text-orange-300 mb-2">
                    <span className="font-semibold">Role:</span> {user.role}
                  </p>
                )}
                
                {user.grade && (
                  <p className="text-orange-300 mb-2">
                    <span className="font-semibold">Grade:</span> {user.grade}
                  </p>
                )}
                
                {user.experience && (
                  <p className="text-orange-300 mb-2">
                    <span className="font-semibold">Experience:</span> {user.experience} years
                  </p>
                )}
                
                {user.rating && (
                  <p className="text-orange-300 mb-2">
                    <span className="font-semibold">Rating:</span> {user.rating} ⭐
                  </p>
                )}
                
                {user.bio && (
                  <p className="text-orange-200 mb-4 italic">"{user.bio}"</p>
                )}
                
                {user.subjects && user.subjects.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {user.subjects.map((subject) => (
                      <span key={subject} className="bg-orange-500 text-black px-3 py-1 rounded-full text-sm font-semibold">
                        {subject}
                      </span>
                    ))}
                  </div>
                )}
                
                <p className="text-orange-400 text-sm">{user.email}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
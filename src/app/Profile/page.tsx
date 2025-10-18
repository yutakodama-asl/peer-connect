"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

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
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const fetchUserData = async () => {
      try {
        const docRef = doc(db, "users", user.uid);
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
        }
      } catch (e) {
        setError("Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const docRef = doc(db, "users", user.uid);
      await setDoc(docRef, {
        name: userData.name,
        grade: userData.grade,
        role: userData.role,
        subjects: userData.subjects.split(",").map((s) => s.trim()).filter(Boolean),
        bio: userData.bio,
      }, { merge: true });
      router.push("/");
    } catch (e) {
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto p-6 mt-12 bg-black text-orange-500 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Profile</h2>
        <p>Please log in to view and edit your profile.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto p-6 mt-12 bg-black text-orange-500 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Profile</h2>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 mt-12 bg-black text-orange-500 rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-6 border-b border-orange-600 pb-2">Your Profile</h2>
      {error && <p className="mb-4 text-red-500">{error}</p>}
      <label className="block mb-4">
        <span className="block mb-1 font-semibold">Name</span>
        <input
          type="text"
          name="name"
          value={userData.name}
          onChange={handleChange}
          className="w-full rounded border border-orange-600 bg-black px-3 py-2 text-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </label>
      <label className="block mb-4">
        <span className="block mb-1 font-semibold">Grade</span>
        <input
          type="text"
          name="grade"
          value={userData.grade}
          onChange={handleChange}
          className="w-full rounded border border-orange-600 bg-black px-3 py-2 text-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="e.g. 10th, 11th"
        />
      </label>
      <label className="block mb-4">
        <span className="block mb-1 font-semibold">Role</span>
        <select
          name="role"
          value={userData.role}
          onChange={handleChange}
          className="w-full rounded border border-orange-600 bg-black px-3 py-2 text-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="tutor">Tutor</option>
          <option value="learner">Learner</option>
        </select>
      </label>
      <label className="block mb-4">
        <span className="block mb-1 font-semibold">Subjects (comma-separated)</span>
        <input
          type="text"
          name="subjects"
          value={userData.subjects}
          onChange={handleChange}
          className="w-full rounded border border-orange-600 bg-black px-3 py-2 text-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="e.g. Math, Physics, Chemistry"
        />
      </label>
      <label className="block mb-6">
        <span className="block mb-1 font-semibold">Bio</span>
        <textarea
          name="bio"
          value={userData.bio}
          onChange={handleChange}
          rows={4}
          className="w-full rounded border border-orange-600 bg-black px-3 py-2 text-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="Tell us about yourself"
        />
      </label>
      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-orange-600 hover:bg-orange-700 text-black font-semibold px-6 py-3 rounded transition-colors disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
};

export default ProfilePage;
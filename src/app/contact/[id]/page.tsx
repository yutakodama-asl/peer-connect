"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function ContactPage() {
  const { id } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    if (!id) return;
    const fetchUser = async () => {
      const snap = await getDoc(doc(db, "users", id as string));
      if (snap.exists()) setProfile(snap.data());
    };
    fetchUser();
  }, [id]);

  if (!profile) {
    return <div className="text-orange-200 p-10">Loading contact info...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-orange-200 p-10">
      <h1 className="text-3xl font-bold mb-4">{profile.name}</h1>
      <p className="mb-2">Grade: {profile.grade || "N/A"}</p>
      <p className="mb-4">Available: {(profile.availableDays || []).join(", ")}</p>

      <h2 className="text-xl font-semibold mb-2">Contact Links</h2>
      <div className="flex flex-col gap-3 mt-3">

        {/* Gmail */}
        {profile.gmail && (
          <button
            onClick={() => window.location.href = `mailto:${profile.gmail}`}
            className="flex items-center gap-3 rounded-xl bg-orange-500/20 border border-orange-600 px-4 py-2 hover:bg-orange-500/30 transition text-left"
          >
            <span className="text-lg">📧</span>
            <div>
              <p className="font-semibold text-orange-300">Email</p>
              <p className="text-orange-200/70 text-sm">{profile.gmail}</p>
            </div>
          </button>
        )}

        {/* Snapchat */}
        {profile.snapchat && (
          <a
            href={`https://www.snapchat.com/add/${profile.snapchat}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl bg-orange-500/20 border border-orange-600 px-4 py-2 hover:bg-orange-500/30 transition"
          >
            <span className="text-lg">👻</span>
            <div>
              <p className="font-semibold text-orange-300">Snapchat</p>
              <p className="text-orange-200/70 text-sm">@{profile.snapchat}</p>
            </div>
          </a>
        )}

        {/* Instagram */}
        {profile.instagram && (
          <a
            href={`https://instagram.com/${profile.instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl bg-orange-500/20 border border-orange-600 px-4 py-2 hover:bg-orange-500/30 transition"
          >
            <span className="text-lg">📸</span>
            <div>
              <p className="font-semibold text-orange-300">Instagram</p>
              <p className="text-orange-200/70 text-sm">@{profile.instagram}</p>
            </div>
          </a>
        )}

      </div>

      <button
        onClick={() => router.back()}
        className="mt-6 border border-orange-600 px-4 py-2 rounded-full hover:border-orange-400 hover:text-orange-100"
      >
        ← Back
      </button>
    </div>
  );
}
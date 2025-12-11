"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useTheme } from "../../lib/theme";

// Define the expected user profile type
interface UserProfile {
  name?: string;
  grade?: string;
  availableDays?: string[];
  gmail?: string;
}

export default function ContactPage() {
  const { id } = useParams();
  const router = useRouter();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const shellStyle = { background: "var(--background)" };
  const textClass = isLight ? "text-amber-900" : "text-orange-200";

  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchUser = async () => {
      const snap = await getDoc(doc(db, "users", id as string));
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile);
      }
    };

    fetchUser();
  }, [id]);

  if (!profile) {
    return (
      <div className={`p-10 ${textClass}`} style={shellStyle}>
        Loading contact info...
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-10 ${textClass}`} style={shellStyle}>
      <h1 className="text-3xl font-bold mb-4">{profile.name}</h1>
      <p className="mb-2">Grade: {profile.grade || "N/A"}</p>
      <p className="mb-4">
        Available: {(profile.availableDays || []).join(", ")}
      </p>

      <h2 className="text-xl font-semibold mb-2">Contact Links</h2>
      <div className="flex flex-col gap-3 mt-3">
        {profile.gmail && (
          <button
            onClick={() => (window.location.href = `mailto:${profile.gmail}`)}
            className="flex items-center gap-3 rounded-xl border app-surface-soft px-4 py-2 transition hover:brightness-105 text-left"
          >
            <div>
              <p className="font-semibold text-orange-500">Email</p>
              <p className={`${isLight ? "text-amber-800" : "text-orange-200/70"} text-sm`}>{profile.gmail}</p>
            </div>
          </button>
        )}
      </div>

      <button
        onClick={() => router.back()}
        className="mt-6 border border-orange-500 px-4 py-2 rounded-full hover:border-orange-400 hover:text-orange-500"
      >
        ← Back
      </button>
    </div>
  );
}

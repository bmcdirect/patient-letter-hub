"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/session";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [practice, setPractice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch("/api/user");
      const userData = await res.json();
      setUser(userData.user);
      if (userData.user?.practiceId) {
        const practiceRes = await fetch(`/api/practices/${userData.user.practiceId}`);
        setPractice(await practiceRes.json());
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!user || !practice) return <div className="p-8">Profile not found.</div>;

  return (
    <main className="flex-1 p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Account Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <span className="font-medium">Customer Name:</span> {practice.name}
          </div>
          <div>
            <span className="font-medium">Customer Number:</span> {practice.id}
          </div>
          <div>
            <span className="font-medium">Address:</span> {practice.address || "N/A"}
          </div>
          <div>
            <span className="font-medium">Phone:</span> {practice.phone || "N/A"}
          </div>
          <div>
            <span className="font-medium">Email:</span> {practice.email || "N/A"}
          </div>
        </CardContent>
      </Card>
    </main>
  );
} 
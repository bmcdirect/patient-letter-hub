"use client";
import React, { useEffect, useState } from "react";

export default function PracticesPage() {
  const [practices, setPractices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPractices() {
      setLoading(true);
      const res = await fetch("/api/practices");
      const data = await res.json();
      setPractices(data.practices || []);
      setLoading(false);
    }
    fetchPractices();
  }, []);

  return (
    <main className="flex-1 overflow-hidden p-8">
      <h1 className="text-2xl font-bold mb-4">Practices</h1>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">Address</th>
              <th className="px-4 py-2 border">Phone</th>
              <th className="px-4 py-2 border">Email</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {practices.map((practice) => (
              <tr key={practice.id}>
                <td className="px-4 py-2 border">{practice.name}</td>
                <td className="px-4 py-2 border">{practice.address}</td>
                <td className="px-4 py-2 border">{practice.phone}</td>
                <td className="px-4 py-2 border">{practice.email}</td>
                <td className="px-4 py-2 border">
                  <button className="text-blue-600 underline" disabled>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
} 
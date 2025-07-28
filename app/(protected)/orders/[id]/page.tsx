"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params as { id: string };
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      setLoading(true);
      const res = await fetch(`/api/orders/${id}`);
      const data = await res.json();
      setOrder(data.order || null);
      setLoading(false);
    }
    if (id) fetchOrder();
  }, [id]);

  if (loading) return <main className="p-8">Loading...</main>;
  if (!order) return <main className="p-8">Order not found.</main>;

  return (
    <main className="p-8">
      <button className="mb-4 text-blue-600 underline" onClick={() => router.push("/orders")}>Back to Orders</button>
      <h1 className="text-2xl font-bold mb-4">Order Details</h1>
      <div className="bg-white p-4 border rounded">
        <div><strong>Order #:</strong> {order.orderNumber}</div>
        <div><strong>Subject:</strong> {order.subject}</div>
        <div><strong>Status:</strong> {order.status}</div>
        <div><strong>Created:</strong> {new Date(order.createdAt).toLocaleString()}</div>
        <div><strong>Cost:</strong> {order.cost}</div>
        <div><strong>Color Mode:</strong> {order.colorMode}</div>
        {/* Add more fields as needed */}
      </div>
    </main>
  );
} 
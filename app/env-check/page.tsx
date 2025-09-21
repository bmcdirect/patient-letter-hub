"use client";
import React from "react";

export default function EnvCheck() {
  // Test 1: Access via process.env (should work)
  const processValue = process.env.NEXT_PUBLIC_USE_CLERK;
  
  // Test 2: Access via process.env with original name (should work)
  const processValueOriginal = process.env.USE_CLERK;

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>USE_CLERK Environment Test</h1>
      
      <h2>✅ Process.env Access (Should Work):</h2>
      <p><strong>process.env.NEXT_PUBLIC_USE_CLERK:</strong> {String(processValue)}</p>
      <p><strong>process.env.USE_CLERK:</strong> {String(processValueOriginal)}</p>
      
      <h2>❌ T3 Env Access (Should Break):</h2>
      <p>This will trigger the hydration error if you uncomment:</p>
      {/* 
      import { env } from "@/env.mjs";
      <p><strong>env.NEXT_PUBLIC_USE_CLERK:</strong> {String(env.NEXT_PUBLIC_USE_CLERK)}</p>
      */}
      
      <h2>🔍 Debug Info:</h2>
      <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV}</p>
      <p><strong>All NEXT_PUBLIC_ vars:</strong></p>
      <pre style={{ background: "#f0f0f0", padding: "10px", fontSize: "12px" }}>
        {Object.keys(process.env)
          .filter(key => key.startsWith('NEXT_PUBLIC_'))
          .map(key => `${key}: ${process.env[key]}`)
          .join('\n')}
      </pre>
    </div>
  );
} 
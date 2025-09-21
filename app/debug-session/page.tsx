"use client";

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export default function DebugSessionPage() {
  const { user, isLoaded } = useUser();
  const [cookies, setCookies] = useState<string>('');
  const [sessionStorage, setSessionStorage] = useState<Record<string, string>>({});
  const [localStorage, setLocalStorage] = useState<Record<string, string>>({});

  useEffect(() => {
    // Get cookies
    setCookies(document.cookie);
    
    // Get session storage
    const sessionData: Record<string, string> = {};
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        sessionData[key] = sessionStorage.getItem(key) || '';
      }
    }
    setSessionStorage(sessionData);
    
    // Get local storage
    const localData: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        localData[key] = localStorage.getItem(key) || '';
      }
    }
    setLocalStorage(localData);
  }, []);

  const clerkCookies = cookies.split(';').filter(cookie => 
    cookie.includes('__clerk') || 
    cookie.includes('__session') || 
    cookie.includes('clerk')
  );

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Clerk Session Debug</h1>
      
      <div className="space-y-6">
        {/* Clerk User State */}
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Clerk User State</h2>
          <div className="space-y-2">
            <p><strong>Is Loaded:</strong> {isLoaded ? 'Yes' : 'No'}</p>
            <p><strong>User Exists:</strong> {user ? 'Yes' : 'No'}</p>
            {user && (
              <>
                <p><strong>User ID:</strong> {user.id}</p>
                <p><strong>Email:</strong> {user.emailAddresses[0]?.emailAddress}</p>
                <p><strong>First Name:</strong> {user.firstName}</p>
                <p><strong>Last Name:</strong> {user.lastName}</p>
              </>
            )}
          </div>
        </div>

        {/* Cookies */}
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Cookies</h2>
          <div className="space-y-2">
            <p><strong>Total Cookies:</strong> {cookies.split(';').length}</p>
            <p><strong>Clerk Cookies:</strong> {clerkCookies.length}</p>
            {clerkCookies.length > 0 && (
              <div>
                <p><strong>Clerk Cookie Details:</strong></p>
                <ul className="list-disc list-inside ml-4">
                  {clerkCookies.map((cookie, index) => (
                    <li key={index} className="text-sm font-mono">
                      {cookie.trim().substring(0, 50)}...
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <details className="mt-2">
              <summary className="cursor-pointer text-blue-600">Show All Cookies</summary>
              <pre className="text-xs bg-white p-2 mt-2 rounded overflow-auto">
                {cookies || 'No cookies found'}
              </pre>
            </details>
          </div>
        </div>

        {/* Session Storage */}
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Session Storage</h2>
          <div className="space-y-2">
            <p><strong>Entries:</strong> {Object.keys(sessionStorage).length}</p>
            {Object.keys(sessionStorage).length > 0 && (
              <details>
                <summary className="cursor-pointer text-blue-600">Show Session Storage</summary>
                <pre className="text-xs bg-white p-2 mt-2 rounded overflow-auto">
                  {JSON.stringify(sessionStorage, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>

        {/* Local Storage */}
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Local Storage</h2>
          <div className="space-y-2">
            <p><strong>Entries:</strong> {Object.keys(localStorage).length}</p>
            {Object.keys(localStorage).length > 0 && (
              <details>
                <summary className="cursor-pointer text-blue-600">Show Local Storage</summary>
                <pre className="text-xs bg-white p-2 mt-2 rounded overflow-auto">
                  {JSON.stringify(localStorage, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Debug Actions</h2>
          <div className="space-x-2">
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Refresh Page
            </button>
            <button 
              onClick={() => {
                document.cookie.split(";").forEach(cookie => {
                  const eqPos = cookie.indexOf("=");
                  const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                  document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                });
                window.location.reload();
              }}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Clear All Cookies
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

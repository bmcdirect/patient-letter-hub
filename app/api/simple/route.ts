import { NextResponse } from "next/server";

export const GET = async (req: Request) => {
  if (process.env.NODE_ENV === 'production') {
    return new Response('Forbidden', { status: 403 });
  }
  
  return NextResponse.json({
    success: true,
    message: "Simple test route working"
  });
};

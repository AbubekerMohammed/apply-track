import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { EMAIL_SIGNUP_UNAVAILABLE_MESSAGE } from "@/lib/auth-messages";
import { appOrigin, isEmailDeliveryAvailable, sendVerificationEmail } from "@/lib/auth-tokens";

export async function POST(req: Request) {
  if (!isEmailDeliveryAvailable()) {
    return NextResponse.json({ error: EMAIL_SIGNUP_UNAVAILABLE_MESSAGE }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || cleanEmail.length > 254) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }

    if (password.length < 8 || password.length > 200) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: (typeof name === "string" && name.trim().slice(0, 100)) || cleanEmail.split("@")[0],
        email: cleanEmail,
        password: hashedPassword,
      },
    });

    // The account can't sign in with its password until the emailed link is
    // opened. If delivery fails, the user can resend from the login page.
    let verificationSent = true;
    try {
      await sendVerificationEmail(cleanEmail, appOrigin(req));
    } catch (error) {
      verificationSent = false;
      console.error("Failed to send verification email:", error);
    }

    return NextResponse.json(
      {
        success: true,
        verificationSent,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error during registration" },
      { status: 500 }
    );
  }
}

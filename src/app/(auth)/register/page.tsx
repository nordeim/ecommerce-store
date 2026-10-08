import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = pageMetadata({ title: "Register", path: "/register" });

export default function RegisterPage() {
  return <RegisterForm />;
}

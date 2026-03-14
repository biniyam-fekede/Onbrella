import { LoginForm } from "../components/login-form";
import heroImage from "@/assets/On-Brella_covered.jpeg";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 -mt-16">
      <img
        src={heroImage}
        alt="On-Brella"
        className="w-64 md:w-80 object-contain"
      />
      <LoginForm />
    </div>
  );
}
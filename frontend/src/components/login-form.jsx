import { useState } from 'react'
import { useNavigate } from "react-router-dom";

import { cn } from '@/lib/utils'
import { supabase } from "@/lib/supabase/client"
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginForm({
  className,
  ...props
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      navigate("/", { replace: true })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="covered@on-brella.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline">
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)} />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
              <div className="flex items-center my-4">
                <hr className="flex-grow border-t border-gray-300" />
                <span className="mx-2 text-gray-500 text-xs">or</span>
                <hr className="flex-grow border-t border-gray-300" />
              </div>
              <Button
                type="button"
                className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-sm"
                style={{ minHeight: 44 }}
                onClick={async () => {
                  await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: { redirectTo: window.location.origin }
                  });
                }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g clipPath="url(#clip0_17_40)">
                    <path d="M19.6 10.23C19.6 9.58 19.54 8.95 19.43 8.34H10V12.09H15.34C15.09 13.36 14.29 14.41 13.18 15.09V17.09H16.18C18.01 15.36 19.6 12.97 19.6 10.23Z" fill="#4285F4"/>
                    <path d="M10 19C12.43 19 14.44 18.19 16.18 17.09L13.18 15.09C12.23 15.69 11.13 16.09 10 16.09C7.66 16.09 5.68 14.36 4.97 12.09H1.97V14.19C3.7 17.04 6.64 19 10 19Z" fill="#34A853"/>
                    <path d="M4.97 12.09C4.78 11.49 4.68 10.85 4.68 10.19C4.68 9.53 4.78 8.89 4.97 8.29V6.19H1.97C1.35 7.41 1 8.77 1 10.19C1 11.61 1.35 12.97 1.97 14.19L4.97 12.09Z" fill="#FBBC05"/>
                    <path d="M10 4.29C11.13 4.29 12.23 4.69 13.18 5.29L16.18 3.29C14.44 2.19 12.43 1.38 10 1.38C6.64 1.38 3.7 3.34 1.97 6.19L4.97 8.29C5.68 6.02 7.66 4.29 10 4.29Z" fill="#EA4335"/>
                  </g>
                  <defs>
                    <clipPath id="clip0_17_40">
                      <rect width="20" height="20" fill="white"/>
                    </clipPath>
                  </defs>
                </svg>
                Sign in with Google
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{' '}
              <a href="/sign-up" className="underline underline-offset-4">
                Sign up
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

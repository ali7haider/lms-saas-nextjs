import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/themeToggle";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Image from "next/image";

export default async function Home() {
  const session = await auth.api.getSession({
        headers: await headers()
    })
  return (
      <div>
        <ThemeToggle />
        {session ? (
          <div>
            <h1>Welcome, {session.user.name}!</h1>
          </div>
        ) : (
          <Button>Logout</Button>
        )}
      </div>
  );
}

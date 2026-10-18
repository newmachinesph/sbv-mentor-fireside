import Link from "next/link";
import { GraduationCap } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="h-4 w-4" />
              </div>
              <span className="font-bold">SBV Mentor</span>
            </div>
            <p className="text-sm text-muted-foreground">
              The right expert at the right time. Mentors on demand for your
              startup journey.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Platform</h4>
            <nav className="flex flex-col gap-2">
              <Link
                href="/mentors"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Browse Mentors
              </Link>
            </nav>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Ecosystem</h4>
            <nav className="flex flex-col gap-2">
              <Link
                href="https://z1.sbv.one"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Forge
              </Link>
              <Link
                href="/"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Mentor
              </Link>
              <Link
                href="https://pitch.sbv.one"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Pitch
              </Link>
              <Link
                href="https://inspace.sbv.one"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                InSpace
              </Link>
            </nav>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Social</h4>
            <nav className="flex flex-col gap-2">
              <Link
                href="https://www.facebook.com/startingblockventures"
                className="text-sm text-muted-foreground hover:text-foreground"
                target="_blank"
                rel="noopener noreferrer"
              >
                Facebook
              </Link>
              <Link
                href="https://www.linkedin.com/company/starting-block-ventures"
                className="text-sm text-muted-foreground hover:text-foreground"
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
              </Link>
            </nav>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>
            SBV Mentor &copy; 2026. Connecting Filipino builders with
            world-class mentors.
          </p>
        </div>
      </div>
    </footer>
  );
}

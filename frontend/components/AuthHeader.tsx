import Image from "next/image";
import Link from "next/link";

type AuthHeaderProps = {
  title?: string;
};

export function AuthHeader({ title = "Authentification" }: AuthHeaderProps) {
  return (
    <div className="text-center mb-4">
      <Link href="/" className="d-inline-flex align-items-center justify-content-center mb-2 text-decoration-none">
        <Image
          src="/habitflow-logo.svg"
          alt="HabitFlow logo"
          width={96}
          height={96}
          priority
        />
      </Link>
      <div className="fw-semibold fs-4">HabitFlow</div>
      <div className="text-uppercase text-secondary small mb-2" style={{ letterSpacing: "0.18em" }}>
        Track · Grow · Flow
      </div>
      <h1 className="h3 mt-3">{title}</h1>
    </div>
  );
}


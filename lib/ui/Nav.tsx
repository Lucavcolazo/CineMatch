import Link from "next/link";

// Barra simple de navegación (sin iconos).
export function Nav(props: { isAuthed: boolean }) {
  const { isAuthed } = props;
  return (
    <div className="nav">
      <div className="brand">
        <Link href="/">CineMatch</Link>
      </div>
      <div className="navLinks">
        {isAuthed ? (
          <>
            <Link href="/discover">Discover</Link>
            <Link href="/search">Search</Link>
            <Link href="/profile">Profile</Link>
          </>
        ) : (
          <>
            <Link href="/login">Login</Link>
            <Link href="/signup">Signup</Link>
          </>
        )}
      </div>
    </div>
  );
}


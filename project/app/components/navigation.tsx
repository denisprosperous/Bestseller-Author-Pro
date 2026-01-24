import { Link, useLocation } from "react-router";
import { BookOpen, Lightbulb, FileEdit, Eye, Volume2, Settings, LogOut, User } from "lucide-react";
import { useEffect, useState } from "react";
import classNames from "classnames";
import { AuthService, type AuthUser } from "~/services/auth-service";
import styles from "./navigation.module.css";

export function Navigation() {
  const location = useLocation();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    // Check initial auth state
    AuthService.getCurrentUser().then(setUser);

    // Listen for auth state changes
    const { data: { subscription } } = AuthService.onAuthStateChange(setUser);

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    await AuthService.signOut();
    window.location.href = "/login";
  };

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        <Link to="/" className={styles.brand}>
          <BookOpen className={styles.icon} />
          <span>Bestseller Author Pro</span>
        </Link>

        <ul className={styles.links}>
          <li>
            <Link to="/" className={classNames(styles.link, isActive("/") && styles.active)}>
              <BookOpen className={styles.linkIcon} />
              Home
            </Link>
          </li>
          <li>
            <Link to="/brainstorm" className={classNames(styles.link, isActive("/brainstorm") && styles.active)}>
              <Lightbulb className={styles.linkIcon} />
              Brainstorm
            </Link>
          </li>
          <li>
            <Link to="/builder" className={classNames(styles.link, isActive("/builder") && styles.active)}>
              <FileEdit className={styles.linkIcon} />
              Builder
            </Link>
          </li>
          <li>
            <Link to="/preview" className={classNames(styles.link, isActive("/preview") && styles.active)}>
              <Eye className={styles.linkIcon} />
              Preview
            </Link>
          </li>
          <li>
            <Link to="/audiobooks" className={classNames(styles.link, isActive("/audiobooks") && styles.active)}>
              <Volume2 className={styles.linkIcon} />
              Audiobooks
            </Link>
          </li>
          <li>
            <Link to="/settings" className={classNames(styles.link, isActive("/settings") && styles.active)}>
              <Settings className={styles.linkIcon} />
              Settings
            </Link>
          </li>
        </ul>

        <div className={styles.userSection}>
          {user ? (
            <div className={styles.userMenu}>
              <div className={styles.userInfo}>
                <User className={styles.userIcon} />
                <span className={styles.userEmail}>{user.email}</span>
              </div>
              <button onClick={handleLogout} className={styles.logoutButton}>
                <LogOut className={styles.linkIcon} />
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className={styles.loginLink}>
              <User className={styles.linkIcon} />
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

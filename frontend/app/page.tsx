import styles from "./page.module.css";
import Link from "next/link";
import { AuthHeader } from "@/components/AuthHeader";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <AuthHeader title="Authentification" />
        <div className={styles.intro}>
          <p>Connectez-vous pour gérer les utilisateurs, rôles et l’activation des comptes.</p>
        </div>
        <div className={styles.ctas}>
          <Link className={styles.primary} href="/login">
            Connexion
          </Link>
          <Link className={styles.secondary} href="/signup">
            Créer un compte
          </Link>
        </div>
      </main>
    </div>
  );
}

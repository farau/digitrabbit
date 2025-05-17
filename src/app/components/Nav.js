"use client";
import Image from "next/image";
import styles from "./Nav.module.css";

export default function Nav() {
  return (
    <div className={styles.Nav}>
      {/* Logo sur la gauche */}
      <div className={styles.NavLogo}>
        <Image src="/img/logo.png" alt="Nav Logo" width={70} height={50} />
      </div>
    </div>
  );
}

import { CSSProperties } from "react";
import { Philosopher } from "@/lib/types";
import styles from "./PhilosopherRail.module.css";

interface PhilosopherRailProps {
  philosophers: Philosopher[];
  /** Which philosopher sits at the front of the rail (--i:0). */
  lead?: string;
}

// How far the band runs to each side of the lead card. Left is short (those
// bays are turned toward the viewer and mostly clipped by the fog); the right
// runs deep so the band recedes and fades out. Cards past n≈6 are fully
// darkened by the falloff, so there is no point drawing further.
const LEFT = 2;
const RIGHT = 6;

/**
 * The Explore half, seen from the side. The philosopher cards form one
 * continuous band that turns away and recedes to the right. Pure CSS 3D — no
 * client state — so it renders on the server. It is decorative (aria-hidden):
 * on the landing it sits behind the "Explore the Philosophers" caption as the
 * panel's background.
 *
 * The band is the PHILOSOPHERS list cycled, centred so `lead` sits at the
 * front and its neighbours fan out on either side.
 */
export default function PhilosopherRail({
  philosophers,
  lead = "nietzsche",
}: PhilosopherRailProps) {
  const count = philosophers.length;
  const centerIdx = Math.max(
    0,
    philosophers.findIndex((p) => p.id === lead),
  );

  const cards = [];
  for (let i = -LEFT; i <= RIGHT; i++) {
    const p = philosophers[((centerIdx + i) % count + count) % count];
    const n = Math.max(0, i);
    const style = {
      "--i": i,
      "--n": n,
      "--accent": p.accent,
    } as CSSProperties;

    cards.push(
      <article key={i} className={styles.card} style={style}>
        <span className={styles.shadow} />
          <span className={styles.edge} />
          <div className={styles.face}>
            <span className={styles.portrait}>
              {p.image ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={p.image}
                  alt=""
                  width={92}
                  height={92}
                  loading={i >= -1 && i <= 2 ? "eager" : "lazy"}
                  decoding="async"
                />
              ) : (
                <span className={styles.initials}>{p.initials}</span>
              )}
          </span>
          <h5 className={styles.name}>{p.name}</h5>
          <p className={styles.dates}>{p.dates}</p>
          <p className={styles.blurb}>{p.blurb}</p>
          <p className={styles.voice}>{p.voiceNote}</p>
        </div>
      </article>,
    );
  }

  return (
    <div
      className={styles.rail}
      data-philosopher-rail
      data-lead={lead}
      aria-hidden
    >
      <div className={styles.stage}>
        <div className={styles.plane}>{cards}</div>
      </div>
      <div className={styles.fog} />
    </div>
  );
}

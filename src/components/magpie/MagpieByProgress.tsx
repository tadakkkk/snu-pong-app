import MagpieSad from "./MagpieSad";
import MagpieIdle from "./MagpieIdle";
import MagpieHappy from "./MagpieHappy";
import MagpieExcited from "./MagpieExcited";
import MagpieShocked from "./MagpieShocked";

interface Props {
  percent: number;
  size?: number;
}

export default function MagpieByProgress({ percent, size = 100 }: Props) {
  if (percent >= 80) return <MagpieShocked size={size} />;
  if (percent >= 50) return <MagpieExcited size={size} />;
  if (percent >= 25) return <MagpieHappy size={size} />;
  if (percent >= 5) return <MagpieIdle size={size} />;
  return <MagpieSad size={size} />;
}

import NueSad from "./NueSad";
import NueIdle from "./NueIdle";
import NueHappy from "./NueHappy";
import NueExcited from "./NueExcited";
import NueShocked from "./NueShocked";

interface Props {
  percent: number;
  size?: number;
}

export default function NueByProgress({ percent, size = 100 }: Props) {
  if (percent >= 80) return <NueShocked size={size} />;
  if (percent >= 50) return <NueExcited size={size} />;
  if (percent >= 25) return <NueHappy size={size} />;
  if (percent >= 5) return <NueIdle size={size} />;
  return <NueSad size={size} />;
}

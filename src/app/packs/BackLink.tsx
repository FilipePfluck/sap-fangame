import Link from "next/link";
import { BUTTON_CLASS } from "./styles";

export default function BackLink({ href }: { href: string }) {
  return (
    <Link href={href} className={`self-start px-4 py-2 text-sm ${BUTTON_CLASS}`}>
      ← Back
    </Link>
  );
}

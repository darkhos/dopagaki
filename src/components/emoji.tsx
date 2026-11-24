import Syringe from '~icons/fluent-emoji-flat/syringe';
import Sparkles from '~icons/fluent-emoji-flat/sparkles';
import Bubbles from '~icons/fluent-emoji-flat/bubbles';
import SmilingHearts from '~icons/fluent-emoji-flat/smiling-face-with-hearts';
import Medal1 from '~icons/fluent-emoji-flat/1st-place-medal';
import Medal2 from '~icons/fluent-emoji-flat/2nd-place-medal';
import Medal3 from '~icons/fluent-emoji-flat/3rd-place-medal';
import Bargain from '~icons/fluent-emoji-flat/japanese-bargain-button';
import Shield from '~icons/fluent-emoji-flat/shield';
import Stopwatch from '~icons/fluent-emoji-flat/stopwatch';
import HealthWorker from '~icons/fluent-emoji-flat/woman-health-worker';
import Moon from '~icons/fluent-emoji-flat/crescent-moon';
import Soap from '~icons/fluent-emoji-flat/soap';
import Memo from '~icons/fluent-emoji-flat/memo';
import Phone from '~icons/fluent-emoji-flat/mobile-phone';
import Camera from '~icons/fluent-emoji-flat/camera-with-flash';

/**
 * Fluent Emoji (Microsoft, MIT) inlined at build time by unplugin-icons (raw SVG
 * strings from the local Iconify package, never user input).
 * Decorative by default: every emoji is aria-hidden; the text next to it carries the meaning.
 */
type Emoji = string;

const MENU_EMOJI: Record<string, Emoji> = {
  'rejuran-2cc': Syringe,
  'shrink-300': Sparkles,
  potenza: Bubbles,
  'jaw-botox': SmilingHearts
};

const TRAIT_EMOJI: Record<string, Emoji> = {
  low_upsell: Shield,
  short_wait: Stopwatch,
  careful: HealthWorker,
  sunday_night: Moon,
  clean_space: Soap,
  branch_verified: Memo
};

const MEDALS: Emoji[] = [Medal1, Medal2, Medal3];

function render(svg: Emoji | undefined, size: number, className?: string) {
  if (!svg) return null;
  return (
    <span
      className={`emoji ${className ?? ''}`}
      style={{ fontSize: size, width: size, height: size }}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export function MenuEmoji({ menuId, size = 28, className }: { menuId: string; size?: number; className?: string }) {
  return render(MENU_EMOJI[menuId], size, className);
}

export function TraitEmoji({ traitId, size = 18, className }: { traitId: string; size?: number; className?: string }) {
  return render(TRAIT_EMOJI[traitId], size, className);
}

/** rank is 1-based; returns null past 3rd place. */
export function MedalEmoji({ rank, size = 28, className }: { rank: number; size?: number; className?: string }) {
  return render(MEDALS[rank - 1], size, className);
}

export function BargainEmoji({ size = 24, className }: { size?: number; className?: string }) {
  return render(Bargain, size, className);
}

export function PhoneEmoji({ size = 24, className }: { size?: number; className?: string }) {
  return render(Phone, size, className);
}

export function CameraEmoji({ size = 22, className }: { size?: number; className?: string }) {
  return render(Camera, size, className);
}

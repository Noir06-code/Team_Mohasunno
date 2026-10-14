// Lucide Icons Integration (No Emojis!)
import {
  createIcons,
  Rocket,
  Landmark,
  DoorOpen,
  LogOut,
  Terminal,
  Radio,
  Orbit,
  ListOrdered,
  Search,
  Database,
  Compass,
  ChevronLeft,
  X,
  Award,
  Check,
  Zap,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  HelpCircle,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Sparkles,
  BookOpen,
  Atom,
  Cpu,
  Eye,
  CheckCircle2
} from 'lucide';

export const ICONS = {
  Rocket,
  Landmark,
  DoorOpen,
  LogOut,
  Terminal,
  Radio,
  Orbit,
  ListOrdered,
  Search,
  Database,
  Compass,
  ChevronLeft,
  X,
  Award,
  Check,
  Zap,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  HelpCircle,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Sparkles,
  BookOpen,
  Atom,
  Cpu,
  Eye,
  CheckCircle2
};

export function refreshIcons(root = document) {
  createIcons({
    icons: ICONS,
    nameAttr: 'data-lucide',
    attrs: {
      class: 'lucide-icon',
      'stroke-width': '2'
    }
  });
}

/**
 * Returns HTML string for a Lucide icon element
 */
export function iconHtml(name, extraClass = '') {
  return `<i data-lucide="${name}" class="lucide-icon ${extraClass}"></i>`;
}

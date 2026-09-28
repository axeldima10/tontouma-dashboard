import {
<<<<<<< HEAD
  Bot,
  Building2,
  Eye,
  CreditCard,
  FileText,
  LayoutDashboard,
  Layers,
  MonitorSmartphone,
  Receipt,
  UserRound,
=======
  Building2,
  CreditCard,
  FileText,
  Inbox,
  LayoutGrid,
  Layers,
  Map,
  MonitorSmartphone,
  Settings,
  Users,
>>>>>>> 939f032 (First Commit)
  type LucideIcon,
} from "lucide-react";

export type ShellVariant = "org" | "admin";

export type NavItem = {
  /** Segment relatif à la racine du tableau de bord ("" = accueil). */
  segment: string;
  label: string;
  description: string;
  Icon: LucideIcon;
  /** Réservé au rôle org:super_admin (masquage UI uniquement, le backend décide). */
  superAdminOnly?: boolean;
<<<<<<< HEAD
  group: "pilotage" | "contenu" | "gestion" | "plateforme" | "compte";
};

export const ORG_NAV: NavItem[] = [
  { segment: "", label: "Vue d’ensemble", description: "État de votre organisation", Icon: LayoutDashboard, group: "pilotage" },
  { segment: "assistant", label: "Tester l’assistant", description: "Poser les questions d’un citoyen, par écrit ou à voix haute", Icon: Bot, group: "pilotage" },
  { segment: "services", label: "Services & démarches", description: "Ce que l’assistant explique aux citoyens", Icon: Layers, group: "contenu" },
  { segment: "documents", label: "Base de connaissances", description: "Règlements, guides et FAQ de référence", Icon: FileText, group: "contenu" },
  { segment: "apercu", label: "Aperçu public", description: "Ce que voient les citoyens", Icon: Eye, group: "contenu" },
  { segment: "bornes", label: "Bornes", description: "État des bornes physiques", Icon: MonitorSmartphone, superAdminOnly: true, group: "gestion" },
  { segment: "abonnement", label: "Abonnement", description: "Plan, statut et limites", Icon: CreditCard, superAdminOnly: true, group: "gestion" },
  { segment: "compte", label: "Mon compte", description: "Profil et vérification de la configuration", Icon: UserRound, group: "compte" },
];

export const ADMIN_NAV: NavItem[] = [
  { segment: "", label: "Tableau de bord", description: "Vue globale de la plateforme", Icon: LayoutDashboard, group: "pilotage" },
  { segment: "assistant", label: "Tester l’assistant", description: "Mode PWA : l’organisation est déduite de la question", Icon: Bot, group: "pilotage" },
  { segment: "organisations", label: "Organisations", description: "Clients, membres, plans et statuts", Icon: Building2, group: "plateforme" },
  { segment: "bornes", label: "Bornes", description: "Parc de bornes de toutes les organisations", Icon: MonitorSmartphone, group: "plateforme" },
  { segment: "plans", label: "Plans d’abonnement", description: "Tarifs en FCFA et limites", Icon: Receipt, group: "plateforme" },
  { segment: "compte", label: "Mon compte", description: "Profil et vérification de la configuration", Icon: UserRound, group: "compte" },
];

export const NAV_GROUP_LABELS: Record<NavItem["group"], string> = {
  pilotage: "Pilotage",
  contenu: "Contenu",
  gestion: "Gestion",
  plateforme: "Plateforme",
  compte: "Compte",
=======
  group: "contenu" | "gestion" | "plateforme";
};

export const ORG_NAV: NavItem[] = [
  { segment: "", label: "Vue d’ensemble", description: "État de votre organisation", Icon: LayoutGrid, group: "contenu" },
  { segment: "services", label: "Services & démarches", description: "Ce que l’assistant explique aux citoyens", Icon: Layers, group: "contenu" },
  { segment: "documents", label: "Documents", description: "Règlements, guides et FAQ de référence", Icon: FileText, group: "contenu" },
  { segment: "plans", label: "Plans du bâtiment", description: "Orientez les citoyens sur place", Icon: Map, group: "contenu" },
  { segment: "bornes", label: "Bornes & QR codes", description: "Bornes physiques et codes à imprimer", Icon: MonitorSmartphone, superAdminOnly: true, group: "gestion" },
  { segment: "membres", label: "Membres", description: "Invitations et rôles de l’équipe", Icon: Users, superAdminOnly: true, group: "gestion" },
  { segment: "abonnement", label: "Abonnement", description: "Plan, limites et factures", Icon: CreditCard, superAdminOnly: true, group: "gestion" },
  { segment: "parametres", label: "Paramètres", description: "Informations de l’organisation", Icon: Settings, superAdminOnly: true, group: "gestion" },
];

export const ADMIN_NAV: NavItem[] = [
  { segment: "", label: "Tableau de bord", description: "Vue globale de la plateforme", Icon: LayoutGrid, group: "plateforme" },
  { segment: "organisations", label: "Organisations", description: "Clients, statuts et suspensions", Icon: Building2, group: "plateforme" },
  { segment: "demandes", label: "Demandes d’accès", description: "Approuver ou refuser les nouvelles organisations", Icon: Inbox, group: "plateforme" },
  { segment: "plans", label: "Plans d’abonnement", description: "Tarifs en FCFA et limites", Icon: CreditCard, group: "plateforme" },
];

export const NAV_GROUP_LABELS: Record<NavItem["group"], string> = {
  contenu: "Contenu",
  gestion: "Gestion",
  plateforme: "Plateforme",
>>>>>>> 939f032 (First Commit)
};

export function navFor(variant: ShellVariant, isSuperAdmin: boolean): NavItem[] {
  if (variant === "admin") return ADMIN_NAV;
  return ORG_NAV.filter((item) => !item.superAdminOnly || isSuperAdmin);
}

export function hrefFor(basePath: string, segment: string): string {
  return segment ? `${basePath}/${segment}` : basePath;
}

<<<<<<< HEAD
/** Élément de navigation actif pour un chemin donné (le plus spécifique l'emporte). */
export function activeSegment(items: NavItem[], basePath: string, pathname: string): string {
  const rest = pathname.startsWith(basePath) ? pathname.slice(basePath.length).replace(/^\//, "") : "";
  const first = rest.split("/")[0] ?? "";
  return items.some((item) => item.segment === first) ? first : "";
}

export const SIDEBAR_COOKIE = "sidebar_collapsed";
=======
export function findNavItem(variant: ShellVariant, segment: string): NavItem | undefined {
  return (variant === "admin" ? ADMIN_NAV : ORG_NAV).find((item) => item.segment === segment);
}
>>>>>>> 939f032 (First Commit)

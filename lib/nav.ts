import {
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
};

export function navFor(variant: ShellVariant, isSuperAdmin: boolean): NavItem[] {
  if (variant === "admin") return ADMIN_NAV;
  return ORG_NAV.filter((item) => !item.superAdminOnly || isSuperAdmin);
}

export function hrefFor(basePath: string, segment: string): string {
  return segment ? `${basePath}/${segment}` : basePath;
}

export function findNavItem(variant: ShellVariant, segment: string): NavItem | undefined {
  return (variant === "admin" ? ADMIN_NAV : ORG_NAV).find((item) => item.segment === segment);
}

// Icônes d'Archivix (bibliothèque Phosphor), regroupées ici pour garder un style homogène.
// Les noms reprennent ceux utilisés dans l'application ; changer ICON_STYLE suffit à changer de style.
import { forwardRef } from "react";
import {
  ArrowLeft as PArrowLeft,
  ArrowRight as PArrowRight,
  ArrowSquareOut as PArrowSquareOut,
  Bank as PBank,
  Bell as PBell,
  BellRinging as PBellRinging,
  BellSlash as PBellSlash,
  Briefcase as PBriefcase,
  Buildings as PBuildings,
  CalendarCheck as PCalendarCheck,
  CaretLeft as PCaretLeft,
  CaretRight as PCaretRight,
  CaretUpDown as PCaretUpDown,
  ChatText as PChatText,
  Check as PCheck,
  CheckCircle as PCheckCircle,
  Clock as PClock,
  ClockCounterClockwise as PClockCounterClockwise,
  CloudArrowUp as PCloudArrowUp,
  Copy as PCopy,
  CreditCard as PCreditCard,
  DeviceMobile as PDeviceMobile,
  DownloadSimple as PDownloadSimple,
  Envelope as PEnvelope,
  EnvelopeOpen as PEnvelopeOpen,
  Eye as PEye,
  EyeSlash as PEyeSlash,
  FileText as PFileText,
  FileXls as PFileXls,
  Files as PFiles,
  Folder as PFolder,
  FolderOpen as PFolderOpen,
  FolderPlus as PFolderPlus,
  GearSix as PGearSix,
  HardDrives as PHardDrives,
  Image as PImage,
  Info as PInfo,
  Key as PKey,
  Lifebuoy as PLifebuoy,
  List as PList,
  Lock as PLock,
  MagnifyingGlass as PMagnifyingGlass,
  Minus as PMinus,
  PaperPlaneRight as PPaperPlaneRight,
  PencilSimple as PPencilSimple,
  Plugs as PPlugs,
  Plus as PPlus,
  Power as PPower,
  Printer as PPrinter,
  Scales as PScales,
  Scroll as PScroll,
  ShareNetwork as PShareNetwork,
  ShieldCheck as PShieldCheck,
  ShieldWarning as PShieldWarning,
  SignOut as PSignOut,
  SquaresFour as PSquaresFour,
  Trash as PTrash,
  TreeStructure as PTreeStructure,
  User as PUser,
  UserPlus as PUserPlus,
  UsersThree as PUsersThree,
  Warning as PWarning,
  X as PX,
  XCircle as PXCircle,
} from "@phosphor-icons/react";

// « duotone » : trait + léger remplissage de couleur ; « regular » : trait fin (plein quand actif)
export const ICON_STYLE = import.meta.env.VITE_ICON_STYLE || "duotone";

// Petites commandes d'interface : toujours en trait simple, plus lisible à petite taille
const CONTROLES = new Set([
  "ArrowLeft", "ArrowRight", "Check", "ChevronLeft", "ChevronRight", "ChevronsUpDown", "Menu", "Minus", "Plus", "X",
  "Eye", "EyeOff", "Copy", "ExternalLink",
]);

function make(nom, Composant) {
  const Icone = forwardRef(function Icone({ size = 24, strokeWidth: _ignore, weight, active, ...props }, ref) {
    const w =
      weight ||
      (ICON_STYLE === "regular" ? (active ? "fill" : "regular") : CONTROLES.has(nom) ? "bold" : "duotone");
    return <Composant ref={ref} size={size} weight={w} {...props} />;
  });
  Icone.displayName = nom;
  return Icone;
}

export const AlertTriangle = make("AlertTriangle", PWarning);
export const ArrowLeft = make("ArrowLeft", PArrowLeft);
export const ArrowRight = make("ArrowRight", PArrowRight);
export const Bell = make("Bell", PBell);
export const BellOff = make("BellOff", PBellSlash);
export const BellRing = make("BellRing", PBellRinging);
export const Briefcase = make("Briefcase", PBriefcase);
export const Building2 = make("Building2", PBuildings);
export const CalendarClock = make("CalendarClock", PCalendarCheck);
export const Check = make("Check", PCheck);
export const CheckCircle2 = make("CheckCircle2", PCheckCircle);
export const ChevronLeft = make("ChevronLeft", PCaretLeft);
export const ChevronRight = make("ChevronRight", PCaretRight);
export const ChevronsUpDown = make("ChevronsUpDown", PCaretUpDown);
export const Clock = make("Clock", PClock);
export const Copy = make("Copy", PCopy);
export const CreditCard = make("CreditCard", PCreditCard);
export const Download = make("Download", PDownloadSimple);
export const ExternalLink = make("ExternalLink", PArrowSquareOut);
export const Eye = make("Eye", PEye);
export const EyeOff = make("EyeOff", PEyeSlash);
export const FileSpreadsheet = make("FileSpreadsheet", PFileXls);
export const FileStack = make("FileStack", PFiles);
export const FileText = make("FileText", PFileText);
export const Folder = make("Folder", PFolder);
export const FolderOpen = make("FolderOpen", PFolderOpen);
export const FolderPlus = make("FolderPlus", PFolderPlus);
export const FolderTree = make("FolderTree", PTreeStructure);
export const HardDrive = make("HardDrive", PHardDrives);
export const History = make("History", PClockCounterClockwise);
export const Image = make("Image", PImage);
export const Info = make("Info", PInfo);
export const KeyRound = make("KeyRound", PKey);
export const Landmark = make("Landmark", PBank);
export const LayoutGrid = make("LayoutGrid", PSquaresFour);
export const LifeBuoy = make("LifeBuoy", PLifebuoy);
export const Lock = make("Lock", PLock);
export const LogOut = make("LogOut", PSignOut);
export const Mail = make("Mail", PEnvelope);
export const MailCheck = make("MailCheck", PEnvelopeOpen);
export const Menu = make("Menu", PList);
export const MessageSquare = make("MessageSquare", PChatText);
export const Minus = make("Minus", PMinus);
export const Pencil = make("Pencil", PPencilSimple);
export const Plus = make("Plus", PPlus);
export const Power = make("Power", PPower);
export const Printer = make("Printer", PPrinter);
export const Scale = make("Scale", PScales);
export const ScrollText = make("ScrollText", PScroll);
export const Search = make("Search", PMagnifyingGlass);
export const Send = make("Send", PPaperPlaneRight);
export const Settings = make("Settings", PGearSix);
export const Share2 = make("Share2", PShareNetwork);
export const ShieldAlert = make("ShieldAlert", PShieldWarning);
export const ShieldCheck = make("ShieldCheck", PShieldCheck);
export const Smartphone = make("Smartphone", PDeviceMobile);
export const Trash2 = make("Trash2", PTrash);
export const Unplug = make("Unplug", PPlugs);
export const UploadCloud = make("UploadCloud", PCloudArrowUp);
export const User = make("User", PUser);
export const UserPlus = make("UserPlus", PUserPlus);
export const Users = make("Users", PUsersThree);
export const X = make("X", PX);
export const XCircle = make("XCircle", PXCircle);
